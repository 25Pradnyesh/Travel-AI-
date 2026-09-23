import os
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    places_configured = bool(os.getenv("GOOGLE_PLACES_API_KEY", "").strip())
    gemini_configured = bool(os.getenv("GEMINI_API_KEY", "").strip())
    status_label = "ok" if places_configured else "degraded"

    return {
        "status": status_label,
        "service": "Travel AI Engine",
        "version": "1.0.0",
        "configuration": {
            "google_places_ready": places_configured,
            "gemini_ready": gemini_configured,
        },
    }
