import os
from pathlib import Path
import sys

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

    status = {
        "google_places_configured": bool(places_key),
        "gemini_configured": bool(gemini_key),
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

    return status

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