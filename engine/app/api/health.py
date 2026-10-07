import os
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health():
    places_configured = bool(os.getenv("GOOGLE_PLACES_API_KEY", "").strip())
    gemini_configured = bool(os.getenv("GEMINI_API_KEY", "").strip())
    supabase_configured = bool(os.getenv("SUPABASE_URL", "").strip() and os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip())
    status_label = "ok" if places_configured else "degraded"
    rate_limit_enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes")
    env = os.getenv("ENVIRONMENT", "development").strip().lower()

    return {
        "status": status_label,
        "service": "Travel AI Engine",
        "version": "1.0.0",
        "environment": env,
        "configuration": {
            "google_places_ready": places_configured,
            "gemini_ready": gemini_configured,
            "supabase_ready": supabase_configured,
            "rate_limiting_active": rate_limit_enabled,
        },
    }
