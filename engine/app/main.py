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
# CORS Configuration
# ==================================================

frontend_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

env_cors = os.getenv("CORS_ORIGINS")
if env_cors:
    frontend_origins.extend([o.strip() for o in env_cors.split(",") if o.strip()])

# Deduplicate origins while preserving order
allowed_origins = list(dict.fromkeys(frontend_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
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