import logging
import os
from typing import Any

from engine.app.services.maps.google_place_details_service import GooglePlaceDetailsService
from engine.app.services.maps.google_places_service import GooglePlacesService
from engine.app.services.maps.nearby_search_service import NearbySearchService
from engine.app.services.places.base import PlacesProvider

logger = logging.getLogger(__name__)


class GooglePlacesProvider(PlacesProvider):
    """
    Google Places API provider wrapper.
    Kept strictly disabled unless GOOGLE_PLACES_ENABLED=true and a valid API key is present.
    """

    def __init__(self):
        self.search_service = GooglePlacesService()
        self.details_service = GooglePlaceDetailsService()
        self.nearby_service = NearbySearchService()

    @property
    def name(self) -> str:
        return "google"

    @property
    def is_available(self) -> bool:
        enabled = os.getenv("GOOGLE_PLACES_ENABLED", "false").strip().lower() in ("true", "1", "yes")
        has_key = bool(os.getenv("GOOGLE_PLACES_API_KEY", "").strip())
        return enabled and has_key

    def search(self, query: str) -> list[dict[str, Any]]:
        if not self.is_available:
            logger.info("[GOOGLE_PLACES] Google Places provider disabled; search skipped.")
            return []
        return self.search_service.search(query)

    def get_details(self, place_id: str, place_data: dict[str, Any] | None = None) -> dict[str, Any] | None:
        if not self.is_available:
            return None
        return self.details_service.get_details(place_id)

    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius: int = 1500,
    ) -> dict[str, Any]:
        if not self.is_available:
            return {}
        return self.nearby_service.search(latitude, longitude, radius=radius)
