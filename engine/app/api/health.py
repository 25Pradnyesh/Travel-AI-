import os
import requests
from fastapi import APIRouter

from engine.app.services.gemini.gemini_counter import gemini_counter
from engine.app.services.places.factory import get_places_provider

router = APIRouter(tags=["Health"])


def check_service_reachability() -> dict[str, bool]:
    """Lightweight reachability ping for external keyless free services."""
    reachability = {
        "nearby": True,
        "photos": True,
        "weather": True,
    }
    # If in test/offline environment or mock, skip network calls
    if os.getenv("TESTING", "").lower() in ("true", "1") or os.getenv("MOCK_HTTP", "").lower() in ("true", "1"):
        return reachability

    app_contact = os.getenv("APP_CONTACT", "").strip()
    if not app_contact:
        reachability["nearby"] = False
    else:
        headers = {"User-Agent": f"TravelAI/1.0 ({app_contact})"}
        try:
            r = requests.get("https://overpass-api.de/api/status", headers=headers, timeout=2.0)
            reachability["nearby"] = r.status_code in (200, 429)
        except Exception:
            reachability["nearby"] = False

    headers = {"User-Agent": f"TravelAI/1.0 ({app_contact})"} if app_contact else {}
    try:
        r = requests.head("https://commons.wikimedia.org/w/api.php", headers=headers, timeout=2.0)
        reachability["photos"] = r.status_code in (200, 301, 302, 403)
    except Exception:
        reachability["photos"] = False

    try:
        r = requests.head("https://archive-api.open-meteo.com/v1/archive", timeout=2.0)
        reachability["weather"] = r.status_code in (200, 400)
    except Exception:
        reachability["weather"] = False

    return reachability


@router.get("/health")
def health():
    places_provider_name = os.getenv("PLACES_PROVIDER", "osm").strip().lower()
    google_places_enabled = os.getenv("GOOGLE_PLACES_ENABLED", "false").strip().lower() in ("true", "1", "yes")
    google_places_configured = bool(os.getenv("GOOGLE_PLACES_API_KEY", "").strip())
    gemini_configured = bool(os.getenv("GEMINI_API_KEY", "").strip())
    supabase_configured = bool(
        os.getenv("SUPABASE_URL", "").strip() and os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    )

    provider = get_places_provider()
    provider_available = provider.is_available

    status_label = "ok" if provider_available else "degraded"
    rate_limit_enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes")
    env = os.getenv("ENVIRONMENT", "development").strip().lower()

    gemini_status = gemini_counter.get_status()

    reachability = check_service_reachability()

    osm_health = provider.get_health() if hasattr(provider, "get_health") else {}

    if places_provider_name == "osm":
        destination_lookup_ready = provider_available and osm_health.get("destination_lookup_ready", True)
        nearby_ready = provider_available and osm_health.get("nearby_amenities_ready", reachability.get("nearby", False))
    elif places_provider_name == "google":
        destination_lookup_ready = google_places_configured and google_places_enabled
        nearby_ready = google_places_configured and google_places_enabled
    else:
        destination_lookup_ready = False
        nearby_ready = False

    return {
        "status": status_label,
        "service": "Travel AI Engine",
        "version": "1.0.0",
        "environment": env,
        "places_provider": places_provider_name,
        "google_places_enabled": google_places_enabled,
        "reachability": reachability,
        "gemini": {
            "enabled": gemini_configured,
            "daily_calls_used": gemini_status["daily_calls_used"],
            "daily_calls_limit": gemini_status["daily_calls_limit"],
            "quota_exhausted": gemini_status["quota_exhausted"],
        },
        "configuration": {
            "places_provider": places_provider_name,
            "places_provider_ready": provider_available,
            "destination_lookup_ready": destination_lookup_ready,
            "osm_ready": places_provider_name == "osm" and provider_available,
            "nearby_ready": nearby_ready,
            "nearby_amenities_ready": nearby_ready,
            "google_places_ready": google_places_configured and google_places_enabled,
            "gemini_ready": gemini_configured,
            "supabase_ready": supabase_configured,
            "rate_limiting_active": rate_limit_enabled,
        },
    }
