from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI


# ==================================================
# Load Environment Variables
# ==================================================

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


# ==================================================
# Import Routers
# ==================================================

from engine.app.api.test_routes import router as test_router

print("✅ test_routes imported")


# ==================================================
# FastAPI App
# ==================================================

app = FastAPI(
    title="Travel AI Engine",
    version="1.0.0",
    description="Instagram Reel → Travel Location Intelligence",
)


# ==================================================
# Routers
# ==================================================

app.include_router(test_router)


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