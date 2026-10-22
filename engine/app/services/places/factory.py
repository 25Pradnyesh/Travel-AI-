import logging
import os
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

from engine.app.services.places.base import PlacesProvider
from engine.app.services.places.google_provider import GooglePlacesProvider
from engine.app.services.places.osm_provider import OsmProvider

logger = logging.getLogger(__name__)

# Ensure environment variables are loaded
_ENGINE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(_ENGINE_DIR / ".env", override=False)
_WORKSPACE_DIR = Path(__file__).resolve().parents[4]
load_dotenv(_WORKSPACE_DIR / ".env.local", override=False)
load_dotenv(_WORKSPACE_DIR / ".env", override=False)

DEFAULT_APP_CONTACT = "contact@travelai.local"

# Default APP_CONTACT if unset in environment to comply with OpenStreetMap User-Agent policy
if "APP_CONTACT" not in os.environ and not os.getenv("APP_CONTACT", "").strip():
    os.environ["APP_CONTACT"] = DEFAULT_APP_CONTACT



class DisabledPlacesProvider(PlacesProvider):
    """Fallback provider when places resolution is explicitly disabled."""

    @property
    def name(self) -> str:
        return "disabled"

    @property
    def is_available(self) -> bool:
        return False

    def search(self, query: str) -> list[dict[str, Any]]:
        return []

    def get_details(self, place_id: str, place_data: dict[str, Any] | None = None) -> dict[str, Any] | None:
        return None

    def search_nearby(self, latitude: float, longitude: float, radius: int = 1500) -> dict[str, Any]:
        return {}


def get_places_provider() -> PlacesProvider:
    """
    Factory creating the configured PlacesProvider.
    Environment variable: PLACES_PROVIDER ('osm' | 'google' | 'disabled')
    Defaults to 'osm' (zero cost, keyless).
    """
    provider_name = os.getenv("PLACES_PROVIDER", "osm").strip().lower()

    if provider_name == "osm":
        if "APP_CONTACT" not in os.environ and not os.getenv("APP_CONTACT", "").strip():
            os.environ["APP_CONTACT"] = DEFAULT_APP_CONTACT
        return OsmProvider()

    elif provider_name == "google":
        return GooglePlacesProvider()
    elif provider_name == "disabled":
        return DisabledPlacesProvider()
    else:
        logger.warning(
            "[PLACES_PROVIDER] Unknown provider '%s'. Defaulting to OsmProvider.",
            provider_name,
        )
        return OsmProvider()
