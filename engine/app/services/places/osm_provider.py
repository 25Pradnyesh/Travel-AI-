import logging
import os
from typing import Any

from engine.app.services.places.base import PlacesProvider
from engine.app.services.places.nominatim_client import NominatimClient
from engine.app.services.places.open_meteo_client import OpenMeteoClient
from engine.app.services.places.overpass_client import OverpassClient
from engine.app.services.places.overview_builder import build_destination_overview
from engine.app.services.places.wikimedia_client import WikimediaClient

logger = logging.getLogger(__name__)



class OsmProvider(PlacesProvider):
    """
    OpenStreetMap-based PlacesProvider delivering 100% keyless, zero-cost places intelligence.
    - Candidate Resolution: Open-Meteo Geocoding for city-level names + Nominatim for landmarks/POIs.
    - Photos: Wikipedia REST summary + Wikimedia Commons ImageInfo (strict CC whitelist) + geosearch fallback.
    - Nearby: Single Overpass query (~1500m) capped at 20 places, with slot checks and disk cache.
    - Historical Weather: Open-Meteo 5-year historical archive.
    """

    def __init__(self):
        self.nominatim = NominatimClient()
        self.open_meteo = OpenMeteoClient()
        self.wikimedia = WikimediaClient()
        self.overpass = OverpassClient()
        self._places_cache: dict[str, dict[str, Any]] = {}

    @property
    def name(self) -> str:
        return "osm"

    @property
    def is_available(self) -> bool:
        # Requires APP_CONTACT to be present
        return bool(os.getenv("APP_CONTACT", "").strip())

    def get_health(self) -> dict[str, Any]:
        """Distinguishes destination lookup health from nearby amenities health."""
        overpass_health = self.overpass.get_health() if hasattr(self.overpass, "get_health") else {"ready": True, "status": "ok"}
        return {
            "provider": "osm",
            "ready": self.is_available,
            "destination_lookup_ready": self.is_available,
            "nearby_amenities_ready": self.is_available and overpass_health.get("ready", True),
            "nearby_health": overpass_health,
        }

    # ==================================================
    # Candidate Resolution
    # ==================================================

    def search(
        self,
        query: str,
        countrycodes: str | None = None,
        featuretype: str | None = None,
        accept_language: str = "en",
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """
        Resolves query to candidate places.
        If query looks like a pure city name without landmark keywords, tries Open-Meteo first.
        Otherwise or on fallback, queries Nominatim with 1 req/sec throttle and disk cache.
        """
        query_clean = query.strip()
        if not query_clean or len(query_clean) < 2:
            return []

        # Check if query is likely a bare country name
        if query_clean.lower() in ("korea", "south korea", "italy", "france", "japan", "spain", "germany") and not featuretype:
            featuretype = "country"

        # Check if query is likely a city name (single or two words, no POI keywords)
        words = query_clean.split()
        poi_indicators = {
            "temple", "church", "cathedral", "castle", "monument", "museum", "park",
            "garden", "falls", "waterfall", "bridge", "beach", "hotel", "resort",
            "palace", "tower", "shrine", "viewpoint", "lake", "mountain", "peak",
        }
        has_poi_word = any(w.lower() in poi_indicators for w in words)

        results = []
        if not has_poi_word and len(words) <= 2 and not featuretype and not countrycodes:
            # Try Open-Meteo city search first
            city_results = self.open_meteo.search_city(query_clean, count=2)
            if city_results:
                results.extend(city_results)

        # Query Nominatim for POIs or as comprehensive search
        if not results:
            nom_results = self.nominatim.search(
                query_clean,
                limit=3,
                accept_language=accept_language,
                countrycodes=countrycodes,
                featuretype=featuretype,
            )
            if nom_results:
                results.extend(nom_results)

        for p in results:
            if "id" in p:
                self._places_cache[p["id"]] = p
            if "place_id" in p:
                self._places_cache[p["place_id"]] = p

        return results

    # ==================================================
    # Details & Photos Enrichment
    # ==================================================

    def get_details(self, place_id: str, place_data: dict[str, Any] | None = None) -> dict[str, Any] | None:
        """
        Enriches a resolved place with Wikimedia CC-licensed photos and Wikipedia editorial summary.
        Ratings and reviews remain None (never invented).
        """
        data = place_data or self._places_cache.get(place_id, {})
        extratags = data.get("extratags") or {}
        if not extratags and (data.get("wikidata") or data.get("wikipedia")):
            extratags = {
                "wikidata": data.get("wikidata"),
                "wikipedia": data.get("wikipedia"),
            }

        lat = data.get("latitude") or data.get("lat")
        lon = data.get("longitude") or data.get("lon")
        if lat is not None:
            try:
                lat = float(lat)
            except (ValueError, TypeError):
                lat = None
        if lon is not None:
            try:
                lon = float(lon)
            except (ValueError, TypeError):
                lon = None

        place_name = data.get("name") or data.get("travel_name") or data.get("display_name")
        photos, editorial_summary = self.wikimedia.resolve_destination_photos(
            extratags=extratags,
            latitude=lat,
            longitude=lon,
            place_name=place_name,
        )

        if editorial_summary:
            data["editorial_summary"] = editorial_summary

        wikidata_id = extratags.get("wikidata") or data.get("wikidata")
        wikipedia_tag = extratags.get("wikipedia") or data.get("wikipedia")
        overview = build_destination_overview(
            wikidata_id=wikidata_id,
            wikipedia_tag=wikipedia_tag,
            place_data=data,
            climate_summary=data.get("climate_summary"),
        )
        if not editorial_summary and data.get("editorial_summary"):
            editorial_summary = data["editorial_summary"]

        details: dict[str, Any] = {
            "id": place_id,
            "place_id": place_id,
            "photos": photos,
            "overview": overview,
            "editorial_summary": editorial_summary or "",
            "rating": None,  # NEVER invent
            "user_rating_count": None,
            "user_ratings_total": None,
            "website": extratags.get("website") or extratags.get("contact:website"),
            "phone": extratags.get("phone") or extratags.get("contact:phone"),
            "opening_hours": extratags.get("opening_hours"),
            "wikidata": wikidata_id,
            "wikipedia": wikipedia_tag,
        }

        return details


    # ==================================================
    # Nearby POI Search
    # ==================================================

    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius: int = 1500,
    ) -> dict[str, Any]:
        """
        Executes single Overpass query around coordinates (~1500m) capped at 20 places.
        """
        return self.overpass.search_nearby(latitude, longitude, radius=radius)

    # ==================================================
    # Historical Weather
    # ==================================================

    def get_historical_weather(
        self,
        latitude: float,
        longitude: float,
    ) -> dict[str, Any] | None:
        """
        Fetches 5-year historical weather patterns for the destination from Open-Meteo.
        """
        return self.open_meteo.get_historical_best_months(latitude, longitude)
