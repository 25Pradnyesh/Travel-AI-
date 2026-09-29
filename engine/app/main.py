import os
from pathlib import Path
import sys
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from engine.observability.context import (
    get_current_context,
    start_request_context,
)
from engine.observability.logger import get_logger

# Ensure UTF-8 output on Windows consoles to prevent charmap encoding errors
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


# ==================================================
# Load Environment Variables
# ==================================================

# Load engine-specific .env first (contains GEMINI_API_KEY, GOOGLE_PLACES_API_KEY)
ENGINE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ENGINE_DIR / ".env", override=False)

# Also check root workspace .env / .env.local
WORKSPACE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(WORKSPACE_DIR / ".env.local", override=False)
load_dotenv(WORKSPACE_DIR / ".env", override=False)


# ==================================================
# FastAPI App
# ==================================================

app = FastAPI(
    title="Travel AI Engine",
    version="1.0.0",
    description="Instagram Reel → Travel Location Intelligence",
)


# ==================================================
# Configuration Validation
# ==================================================

def validate_configuration() -> dict[str, bool]:
    """
    Validates essential engine configuration without exposing secrets.
    """
    places_key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    rate_limit_enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes")

    status_dict = {
        "google_places_configured": bool(places_key),
        "gemini_configured": bool(gemini_key),
        "rate_limiting_enabled": rate_limit_enabled,
    }

    if not places_key:
        print("⚠️ CONFIGURATION WARNING: GOOGLE_PLACES_API_KEY is not set.")
        print("   Destination candidate resolution and nearby search require this key.")
    else:
        print("✅ Google Places API configured.")

    if not gemini_key:
        print("ℹ️ GEMINI_API_KEY not set. Gemini verification running in fallback mode.")
    else:
        print("✅ Gemini API configured.")

    if rate_limit_enabled:
        rpm = os.getenv("RATE_LIMIT_PER_MINUTE", "60")
        print(f"🔒 Rate limiting active ({rpm} req/min).")

    return status_dict

validate_configuration()


# ==================================================
# CORS Configuration
# ==================================================

def configure_cors(env_cors: str | None = None) -> tuple[list[str], bool]:
    """
    Derives allowed CORS origins and credentials policy.
    Hardens against credentialed wildcard access (allow_origins=['*'] + allow_credentials=True).
    """
    dev_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    if env_cors is None:
        env_cors = os.getenv("CORS_ORIGINS", "")

    raw = env_cors.strip()
    if not raw:
        return dev_origins, True

    parsed = [o.strip() for o in raw.split(",") if o.strip()]
    if "*" in parsed:
        # Disallow wildcard origin with credentials per CORS specification
        return ["*"], False

    # Merge explicitly defined production origins with local dev origins
    merged = list(dict.fromkeys(dev_origins + parsed))
    return merged, True


allowed_origins, allow_credentials = configure_cors()

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ==================================================
# Observability Logger
# ==================================================

obs_logger = get_logger("engine.app.main")


# ==================================================
# Security Headers Middleware
# ==================================================

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """
    Injects standard production security headers.
    Protects against MIME-sniffing, clickjacking, and referrer leakage.
    """
    response = await call_next(request)

    # 1. MIME-sniffing protection
    response.headers["X-Content-Type-Options"] = "nosniff"

    # 2. Frame protection / Anti-Clickjacking
    response.headers["X-Frame-Options"] = "DENY"

    # 3. Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # 4. Feature / Permissions Policy
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"

    # 5. Cache Control for sensitive / dynamic API endpoints
    path = request.url.path
    if path.startswith("/analyze") or response.status_code >= 400:
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"

    return response


# ==================================================
# Request Body Size Limit Middleware
# ==================================================

MAX_REQUEST_BODY_SIZE_BYTES = int(os.getenv("MAX_REQUEST_BODY_SIZE_BYTES", str(100 * 1024)))  # 100KB default

@app.middleware("http")
async def body_size_limit_middleware(request: Request, call_next):
    """
    Enforces maximum request payload size limits to protect against memory exhaustion.
    """
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > MAX_REQUEST_BODY_SIZE_BYTES:
                    ctx = get_current_context()
                    req_id = ctx.request_id if ctx else request.headers.get("X-Request-ID", "")
                    obs_logger.warning("security", f"Payload too large: {content_length} bytes > {MAX_REQUEST_BODY_SIZE_BYTES}")
                    return JSONResponse(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        content={
                            "detail": f"Request payload exceeds maximum allowed size of {MAX_REQUEST_BODY_SIZE_BYTES // 1024}KB.",
                            "error_category": "PAYLOAD_TOO_LARGE",
                            "request_id": req_id,
                        },
                        headers={"X-Request-ID": req_id} if req_id else {},
                    )
            except ValueError:
                pass
    return await call_next(request)


# ==================================================
# Tracing & Request ID Middleware
# ==================================================

@app.middleware("http")
async def tracing_middleware(request: Request, call_next):
    raw_trace_id = (
        request.headers.get("X-Request-ID")
        or request.headers.get("X-Trace-ID")
        or request.headers.get("x-request-id")
        or request.headers.get("x-trace-id")
    )
    req_id = raw_trace_id.strip() if (raw_trace_id and raw_trace_id.strip()) else str(uuid.uuid4())
    start_request_context(request_id=req_id, url=str(request.url))
    obs_logger.info("http", f"HTTP {request.method} {request.url.path} initiated")

    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    obs_logger.info("http", f"HTTP {request.method} {request.url.path} completed with status {response.status_code}")
    return response


# ==================================================
# Global Exception Handlers (Error Sanitization)
# ==================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Sanitizes schema validation errors, suppressing internal Python classes and stack traces.
    """
    ctx = get_current_context()
    req_id = ctx.request_id if ctx else (request.headers.get("X-Request-ID") or str(uuid.uuid4()))

    errors = exc.errors()
    detail_msg = "Invalid request payload."
    if errors:
        msg = errors[0].get("msg", "")
        if msg.startswith("Value error, "):
            detail_msg = msg[len("Value error, "):]
        elif msg:
            detail_msg = msg

    obs_logger.warning("validation", f"Request validation failed: {detail_msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={
            "detail": detail_msg,
            "error_category": "VALIDATION_ERROR",
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Preserves HTTP semantics while injecting trace IDs and error categories.
    """
    ctx = get_current_context()
    req_id = ctx.request_id if ctx else (request.headers.get("X-Request-ID") or str(uuid.uuid4()))
    headers = dict(exc.headers or {})
    headers["X-Request-ID"] = req_id

    error_cat = "HTTP_ERROR"
    if exc.status_code == 429:
        error_cat = "RATE_LIMIT_EXCEEDED"
    elif exc.status_code == 400:
        error_cat = "BAD_REQUEST"
    elif exc.status_code == 404:
        error_cat = "NOT_FOUND"
    elif exc.status_code == 413:
        error_cat = "PAYLOAD_TOO_LARGE"
    elif exc.status_code == 422:
        error_cat = "UNPROCESSABLE_ENTITY"
    elif exc.status_code == 503:
        error_cat = "SERVICE_UNAVAILABLE"
    elif exc.status_code == 504:
        error_cat = "GATEWAY_TIMEOUT"
    elif exc.status_code >= 500:
        error_cat = "INTERNAL_SERVER_ERROR"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error": exc.detail,
            "error_category": error_cat,
            "request_id": req_id,
        },
        headers=headers,
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Catches all unexpected internal exceptions.
    Prevents leakage of tracebacks, local paths, or internal tokens.
    """
    ctx = get_current_context()
    req_id = ctx.request_id if ctx else (request.headers.get("X-Request-ID") or str(uuid.uuid4()))
    obs_logger.error("system", f"Unhandled server exception: {type(exc).__name__}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Travel AI couldn't complete the analysis.",
            "error": "Travel AI couldn't complete the analysis.",
            "error_category": "PIPELINE_ERROR",
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id},
    )


# ==================================================
# Import Routers
# ==================================================

from engine.app.api.analyze import router as analyze_router
from engine.app.api.health import router as health_router
from engine.app.api.test_routes import router as test_router

app.include_router(analyze_router)
app.include_router(health_router)
app.include_router(test_router)

print("✅ Routers registered: /analyze, /health, diagnostic routes")


# ==================================================
# Root Endpoint
# ==================================================

@app.get("/")
def root():
    return {
        "message": "Travel AI Engine Running 🚀",
        "status": "healthy",
        "version": "1.0.0",
    }