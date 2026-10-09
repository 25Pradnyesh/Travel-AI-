import copy
import logging
import os
import re
import threading
import requests

from engine.app.services.maps.places_diagnostics import (
    log_places_diagnostic_error,
    sanitize_secret,
)

logger = logging.getLogger(__name__)

_places_search_cache: dict[str, list[dict]] = {}
_places_cache_lock = threading.Lock()
MAX_SEARCH_CACHE_SIZE = 512


def clear_places_search_cache():
    """Clears the in-memory Google Places search cache."""
    with _places_cache_lock:
        _places_search_cache.clear()


class GooglePlacesService:

    def __init__(self):
        raw_key = os.getenv("GOOGLE_PLACES_API_KEY")
        self.api_key = raw_key.strip() if raw_key else None
        self.url = "https://places.googleapis.com/v1/places:searchText"
        self.max_results = 5
        self.last_error: dict | None = None

    @classmethod
    def clear_cache(cls):
        clear_places_search_cache()

    # ==================================================
    # Query Normalization
    # ==================================================

    def normalize_query(self, query: str) -> str:
        """
        Normalizes search queries by collapsing whitespace, fixing spacing around
        commas, and stripping leading/trailing punctuation and quotes.
        """
        if not query:
            return ""
        # Collapse multiple whitespace characters into single space
        cleaned = re.sub(r"\s+", " ", query).strip()
        # Normalize commas: remove space before comma, ensure single space after
        cleaned = re.sub(r"\s*,\s*", ", ", cleaned)
        # Strip extraneous punctuation from ends
        cleaned = cleaned.strip(" ,.-;:!?'\"")
        return cleaned

    # ==================================================
    # Google Places Search
    # ==================================================

    def search(
        self,
        query: str,
    ):
        self.last_error = None
        query = self.normalize_query(query)

        if not query or len(query) < 2:
            return []

        # Must have at least one alphanumeric character
        if not re.search(r"[A-Za-z0-9]", query):
            return []

        # Check in-memory cache
        cache_key = query.lower()
        with _places_cache_lock:
            if cache_key in _places_search_cache:
                return copy.deepcopy(_places_search_cache[cache_key])

        if not self.api_key:
            self.last_error = {
                "status": "missing_api_key",
                "message": "GOOGLE_PLACES_API_KEY not configured.",
            }
            print("❌ GOOGLE_PLACES_API_KEY not found.")
            return []

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": ",".join(
                [
                    "places.id",
                    "places.displayName",
                    "places.formattedAddress",
                    "places.location",
                    "places.types",
                    "places.primaryType",
                    "places.rating",
                    "places.userRatingCount",
                    "places.businessStatus",
                    "places.googleMapsUri",
                    "places.viewport",
                ]
            ),
        }

        body = {
            "textQuery": query,
            "pageSize": self.max_results,
        }

        try:
            response = requests.post(
                self.url,
                headers=headers,
                json=body,
                timeout=15,
            )

            if not response.ok:
                diag = log_places_diagnostic_error(
                    service_name="GooglePlacesService.search",
                    response=response,
                    secret=self.api_key,
                    service_logger=logger,
                )
                self.last_error = {
                    "status": response.status_code,
                    "message": diag["error_msg"],
                    "google_status": diag["google_status"],
                    "google_message": diag["google_message"],
                    "diagnostic_category": diag["diagnostic_category"],
                    "actionable_hint": diag["actionable_hint"],
                }
                return []

            data = response.json()

        except requests.RequestException as e:
            err_resp = getattr(e, "response", None)
            if err_resp is not None:
                diag = log_places_diagnostic_error(
                    service_name="GooglePlacesService.search",
                    response=err_resp,
                    secret=self.api_key,
                    service_logger=logger,
                )
                self.last_error = {
                    "status": diag["status_code"],
                    "error_type": type(e).__name__,
                    "message": diag["error_msg"],
                    "google_status": diag["google_status"],
                    "google_message": diag["google_message"],
                    "diagnostic_category": diag["diagnostic_category"],
                    "actionable_hint": diag["actionable_hint"],
                }
            else:
                status_code = "network_error"
                clean_err = sanitize_secret(str(e), self.api_key)
                self.last_error = {
                    "status": status_code,
                    "error_type": type(e).__name__,
                    "message": f"Network or connection error: {type(e).__name__}",
                }
                logger.error("❌ Google Places Network Error: %s", clean_err)
                print(f"❌ Google Places Error: {type(e).__name__} (status: {status_code})")
            return []
        except Exception as e:
            self.last_error = {
                "status": "malformed_response",
                "error_type": type(e).__name__,
                "message": f"Failed to parse Places response: {type(e).__name__}",
            }
            print(f"❌ Google Places Error: {type(e).__name__}")
            return []

        if not isinstance(data, dict):
            return []

        places = data.get("places")
        if not isinstance(places, list):
            return []

        results = []
        seen = set()

        for place in places:
            if not isinstance(place, dict):
                continue

            place_id = place.get("id")
            if not place_id or place_id in seen:
                continue

            seen.add(place_id)

            # Defensive parsing for displayName: avoid crash if null or missing text
            display_obj = place.get("displayName")
            display_name = ""
            if isinstance(display_obj, dict):
                display_name = str(display_obj.get("text") or "").strip()

            # Defensive parsing for location: avoid crash if null
            location_obj = place.get("location")
            latitude = None
            longitude = None
            if isinstance(location_obj, dict):
                latitude = location_obj.get("latitude")
                longitude = location_obj.get("longitude")

            # Defensive parsing for types: avoid crash if null
            raw_types = place.get("types")
            types = [str(t) for t in raw_types if t] if isinstance(raw_types, list) else []

            # Defensive parsing for viewport: avoid crash if null
            viewport_obj = place.get("viewport")
            viewport = viewport_obj if isinstance(viewport_obj, dict) else {}

            results.append(
                {
                    "id": place_id,
                    "display_name": display_name,
                    "formatted_address": str(place.get("formattedAddress") or ""),
                    "latitude": latitude,
                    "longitude": longitude,
                    "types": types,
                    "primary_type": str(place.get("primaryType") or ""),
                    "rating": float(place.get("rating") or 0.0),
                    "user_rating_count": int(place.get("userRatingCount") or 0),
                    "business_status": str(place.get("businessStatus") or ""),
                    "viewport": viewport,
                    "google_maps_url": (
                        place.get("googleMapsUri")
                        or f"https://www.google.com/maps/place/?q=place_id:{place_id}"
                    ),
                }
            )

        with _places_cache_lock:
            if len(_places_search_cache) >= MAX_SEARCH_CACHE_SIZE:
                _places_search_cache.pop(next(iter(_places_search_cache)))
            _places_search_cache[cache_key] = copy.deepcopy(results)

        return results