from abc import ABC, abstractmethod
from typing import Any


class PlacesProvider(ABC):
    """
    Abstract interface for places discovery, resolution, details, and nearby POI searches.
    Enables zero-cost providers (OSM/Nominatim/Overpass/Open-Meteo) and legacy providers (Google Places).
    """

    @abstractmethod
    def search(self, query: str) -> list[dict[str, Any]]:
        """
        Resolves a search query string to a list of candidate places matching the internal schema.
        """
        pass

    @abstractmethod
    def get_details(self, place_id: str, place_data: dict[str, Any] | None = None) -> dict[str, Any] | None:
        """
        Fetches detailed information for a place, including photos, editorial summary, and external links.
        """
        pass

    @abstractmethod
    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius: int = 1500,
    ) -> dict[str, Any]:
        """
        Searches nearby points of interest within the specified radius (in meters).
        Returns categorized nearby places (e.g. attractions, dining, cafes, lodging).
        """
        pass

    def get_historical_weather(
        self,
        latitude: float,
        longitude: float,
    ) -> dict[str, Any] | None:
        """
        Optional: Fetches multi-year historical weather patterns for the destination.
        """
        return None

    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the provider (e.g. 'osm', 'google', 'disabled')."""
        pass

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if the provider is configured and available for requests."""
        pass
