import hashlib
import json
import logging
import os
import re
import threading
import time
from pathlib import Path
from typing import Any

import requests

from engine.observability.context import get_current_context

logger = logging.getLogger(__name__)

# Global thread-safe 1 req/sec throttle queue for Nominatim
_nominatim_throttle_lock = threading.Lock()
_last_nominatim_request_timestamp = 0.0

CACHE_DIR = Path(__file__).resolve().parents[3] / "assets" / "cache" / "nominatim"


def get_nominatim_user_agent() -> str:
    """
    Constructs the descriptive User-Agent header from APP_CONTACT.
    Fails with a clear message if APP_CONTACT is unset or empty; never invents one.
    """
    app_contact = os.getenv("APP_CONTACT", "").strip()
    if not app_contact:
        raise RuntimeError(
            "APP_CONTACT environment variable must be set (e.g. 'contact@yourdomain.com' or "
            "'https://yourdomain.com/contact') to comply with the OpenStreetMap Nominatim "
            "Acceptable Use Policy. Never invent a contact email or URL."
        )
    return f"TravelAI/1.0 ({app_contact})"


def normalize_query(query: str) -> str:
    """Normalizes query text for cache keying and search consistency."""
    if not query:
        return ""
    cleaned = re.sub(r"\s+", " ", query.strip())
    cleaned = re.sub(r"\s*,\s*", ", ", cleaned)
    cleaned = cleaned.strip(" ,.-;:!?'\"")
    return cleaned.lower()


class NominatimClient:
    """
    Client for OpenStreetMap Nominatim search API.
    Enforces:
    - 1 request per second global rate limit.
    - Persistent disk caching keyed by normalized query.
    - Strict validation of APP_CONTACT User-Agent.
    - Result mapping to the internal place model.
    """

    BASE_URL = "https://nominatim.openstreetmap.org/search"

    def __init__(self, cache_dir: Path | None = None):
        self.cache_dir = cache_dir or CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    PLACE_CLASSES = {"boundary", "place", "natural", "tourism", "historic", "waterway"}
    ALLOWED_PLACE_CLASSES = PLACE_CLASSES

    def _get_cache_path(
        self,
        norm_query: str,
        accept_language: str = "en",
        countrycodes: str | None = None,
        featuretype: str | None = None,
    ) -> Path:
        cache_key = f"{norm_query}|{accept_language}|{countrycodes or ''}|{featuretype or ''}"
        query_hash = hashlib.sha256(cache_key.encode("utf-8")).hexdigest()
        return self.cache_dir / f"{query_hash}.json"

    def _read_cache(
        self,
        norm_query: str,
        accept_language: str = "en",
        countrycodes: str | None = None,
        featuretype: str | None = None,
    ) -> list[dict[str, Any]] | None:
        cache_path = self._get_cache_path(norm_query, accept_language, countrycodes, featuretype)
        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning("[NOMINATIM] Failed to read disk cache for %s: %s", norm_query, e)
        return None

    def _write_cache(
        self,
        norm_query: str,
        data: list[dict[str, Any]],
        accept_language: str = "en",
        countrycodes: str | None = None,
        featuretype: str | None = None,
    ) -> None:
        cache_path = self._get_cache_path(norm_query, accept_language, countrycodes, featuretype)
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning("[NOMINATIM] Failed to write disk cache for %s: %s", norm_query, e)

    def _throttle(self) -> None:
        """Enforces at least 1.0s interval between consecutive Nominatim calls."""
        global _last_nominatim_request_timestamp
        with _nominatim_throttle_lock:
            now = time.time()
            elapsed = now - _last_nominatim_request_timestamp
            if elapsed < 1.0:
                time.sleep(1.0 - elapsed)
            _last_nominatim_request_timestamp = time.time()

    def search(
        self,
        query: str,
        limit: int = 3,
        accept_language: str = "en",
        countrycodes: str | None = None,
        featuretype: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Executes a Nominatim /search query with limit=3, addressdetails=1, extratags=1, namedetails=1.
        Filters strictly by place-like classes and ranks by importance.
        """
        norm_q = normalize_query(query)
        if not norm_q or len(norm_q) < 2:
            return []

        # Check persistent disk cache first
        cached = self._read_cache(norm_q, accept_language, countrycodes, featuretype)
        if cached is not None:
            logger.debug("[NOMINATIM] Cache hit for '%s'", norm_q)
            return [self.map_result(item) for item in cached]

        user_agent = get_nominatim_user_agent()
        self._throttle()

        params = {
            "q": query,
            "format": "jsonv2",
            "addressdetails": "1",
            "extratags": "1",
            "namedetails": "1",
            "limit": str(limit * 2),  # Retrieve extra to allow place class filtering
        }
        if countrycodes:
            params["countrycodes"] = countrycodes.lower()
        if featuretype:
            params["featuretype"] = featuretype.lower()

        headers = {
            "User-Agent": user_agent,
            "Accept-Language": accept_language,
        }

        t_start = time.perf_counter()
        raw_results = []
        try:
            resp = requests.get(self.BASE_URL, params=params, headers=headers, timeout=10)
            if resp.status_code == 429:
                logger.warning("[NOMINATIM] HTTP 429 Rate limited. Respecting backoff.")
                return []
            resp.raise_for_status()
            raw_results = resp.json()
            if not isinstance(raw_results, list):
                raw_results = []

            # Filter to place-like classes only
            filtered_results = []
            for item in raw_results:
                cat = (item.get("category") or item.get("class") or "").lower()
                if not cat or cat in self.PLACE_CLASSES:
                    filtered_results.append(item)

            # Sort by importance descending
            filtered_results.sort(
                key=lambda x: float(x.get("importance", 0.0) or 0.0),
                reverse=True,
            )
            raw_results = filtered_results[:limit]
            self._write_cache(norm_q, raw_results, accept_language, countrycodes, featuretype)
        except Exception as exc:
            logger.error("[NOMINATIM] Search failed for '%s': %s", query, exc)
            return []
        finally:
            dur = time.perf_counter() - t_start
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("nominatim", dur)

        return [self.map_result(item) for item in raw_results]

    def map_result(self, item: dict[str, Any]) -> dict[str, Any]:
        """Maps a raw Nominatim item to the internal Travel AI Place schema."""
        address = item.get("address") or {}
        namedetails = item.get("namedetails") or {}
        extratags = item.get("extratags") or {}

        # Display name extraction: extract top-level name
        name = (
            namedetails.get("name:en")
            or namedetails.get("name")
            or item.get("name")
            or item.get("display_name", "").split(",")[0].strip()
        )

        display_name = item.get("display_name", "")
        osm_type = item.get("osm_type", "node")
        osm_id = item.get("osm_id", "")
        place_id = f"osm_{osm_type}_{osm_id}"

        # Classify types
        category = item.get("category", "")
        ptype = item.get("type", "")
        types = [t for t in [category, ptype] if t]
        if "tourism" in extratags:
            types.append(extratags["tourism"])
        if "historic" in extratags:
            types.append(extratags["historic"])
        if "amenity" in extratags:
            types.append(extratags["amenity"])

        # Address components
        country = address.get("country", "")
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("municipality")
            or address.get("county")
            or ""
        )
        region = address.get("state") or address.get("region") or address.get("state_district") or ""

        try:
            lat = float(item["lat"])
            lon = float(item["lon"])
        except (KeyError, ValueError, TypeError):
            lat, lon = None, None

        try:
            importance = float(item.get("importance", 0.0))
        except (ValueError, TypeError):
            importance = 0.0

        maps_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}" if osm_id else ""

        return {
            "id": place_id,
            "place_id": place_id,
            "name": name,
            "display_name": display_name,
            "travel_name": name,
            "formatted_address": display_name,
            "latitude": lat,
            "longitude": lon,
            "category": category.capitalize() if category else "Destination",
            "primary_type": ptype or category or "tourist_attraction",
            "types": list(dict.fromkeys(types)),
            "country": country,
            "city": city,
            "region": region,
            "rating": None,  # NEVER invent ratings
            "user_rating_count": None,  # NEVER invent reviews
            "user_ratings_total": None,
            "business_status": "OPERATIONAL",
            "maps_url": maps_url,
            "google_maps_url": maps_url,
            "wikidata": extratags.get("wikidata"),
            "wikipedia": extratags.get("wikipedia"),
            "extratags": extratags,
            "osm_type": osm_type,
            "osm_id": osm_id,
            "importance": importance,
            "boundingbox": [float(b) for b in item.get("boundingbox", []) if b is not None] if item.get("boundingbox") else None,
            "raw_category": category,
            "raw_type": ptype,
        }
