import json
import logging
import math
import os
from pathlib import Path
import time
from typing import Any

import requests

from engine.observability.context import get_current_context

logger = logging.getLogger(__name__)

OVERPASS_CACHE_DIR = Path(__file__).resolve().parents[3] / "assets" / "cache" / "overpass"


def get_overpass_user_agent() -> str:
    app_contact = os.getenv("APP_CONTACT", "").strip()
    if not app_contact:
        raise RuntimeError(
            "APP_CONTACT environment variable must be set (e.g. 'contact@yourdomain.com' or "
            "'https://yourdomain.com/contact') to comply with OpenStreetMap Overpass API policies."
        )
    return f"TravelAI/1.0 ({app_contact})"


class OverpassClient:
    """
    Executes a single Overpass query per analysis for nearby attractions, dining, cafes, and hotels.
    Features:
    - 1500m radius search.
    - Persistent disk cache keyed by rounded coordinates (3 decimal places ~110m).
    - Status & slot check via /api/status.
    - Graceful degradation to empty list + 'Nearby unavailable' on 429/timeout/busy.
    - Capped at ~20 items total.
    """

    OVERPASS_URL = "https://overpass-api.de/api/interpreter"
    OVERPASS_MIRRORS = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ]
    STATUS_URL = "https://overpass-api.de/api/status"

    def __init__(self, cache_dir: Path | None = None):
        self.cache_dir = cache_dir or OVERPASS_CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.last_status: str = "ok"
        self.last_failure_time: float | None = None
        self.consecutive_failures: int = 0
        self._negative_cache: dict[str, tuple[float, dict[str, Any]]] = {}

    def get_health(self) -> dict[str, Any]:
        """Returns provider readiness and recent failure metrics."""
        return {
            "status": "degraded" if self.consecutive_failures >= 3 else "ok",
            "consecutive_failures": self.consecutive_failures,
            "last_failure_time": self.last_failure_time,
            "last_status": self.last_status,
            "ready": self.consecutive_failures < 3,
        }

    def _get_cache_key(self, lat: float, lon: float) -> str:
        # Round coordinates to 2 decimal places (~1.1km) for destination-level POI caching
        return f"{round(lat, 2)}_{round(lon, 2)}.json"

    def _check_slots_available(self) -> bool:
        """Non-blocking slot check with 1s timeout."""
        headers = {"User-Agent": get_overpass_user_agent()}
        try:
            resp = requests.get(self.STATUS_URL, headers=headers, timeout=1.0)
            if resp.status_code == 200:
                text = resp.text
                if "Slot available after" in text and "0 slots available" in text:
                    logger.warning("[OVERPASS] No slots immediately available.")
                    return False
                return True
        except Exception:
            pass
        return True

    def _calculate_distance_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine formula for distance in kilometers."""
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2.0) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(r * c, 2)

    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        radius: int = 1500,
    ) -> dict[str, Any]:
        """
        Executes single Overpass query around (latitude, longitude) for:
        - Attractions, historic landmarks, dining, cafes, and hotels.
        - Hard 4s timeout per attempt, with one retry on another public mirror.
        - Persistent disk cache by rounded coordinates (~1.1km).
        - Degrades to empty + 'Nearby unavailable' on error/timeout.
        """
        if latitude is None or longitude is None:
            return self._empty_result("Coordinates missing")

        cache_key = self._get_cache_key(latitude, longitude)
        cache_path = self.cache_dir / cache_key

        # Check in-memory negative cache
        if cache_key in self._negative_cache:
            expiry, cached_res = self._negative_cache[cache_key]
            if time.time() < expiry:
                logger.debug("[OVERPASS] Negative cache hit for nearby (%s, %s)", latitude, longitude)
                return cached_res
            else:
                del self._negative_cache[cache_key]

        if cache_path.exists():
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                logger.debug("[OVERPASS] Cache hit for nearby (%s, %s)", latitude, longitude)
                return cached
            except Exception as e:
                logger.warning("[OVERPASS] Failed reading disk cache: %s", e)

        # Construct single Overpass QL query with timeout:4
        overpass_ql = f"""
[out:json][timeout:4];
(
  node(around:{radius},{latitude},{longitude})["tourism"~"attraction|museum|viewpoint|artwork"];
  way(around:{radius},{latitude},{longitude})["tourism"~"attraction|museum|viewpoint|artwork"];
  node(around:{radius},{latitude},{longitude})["historic"];
  way(around:{radius},{latitude},{longitude})["historic"];
  node(around:{radius},{latitude},{longitude})["amenity"="restaurant"];
  node(around:{radius},{latitude},{longitude})["amenity"="cafe"];
  node(around:{radius},{latitude},{longitude})["tourism"~"hotel|guest_house|hostel"];
);
out center 40;
"""

        headers = {
            "User-Agent": get_overpass_user_agent(),
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        }

        t_start = time.perf_counter()
        elements = []
        timeout_sec = 4.0

        # Try primary, failover to mirror on timeout/error
        mirrors = self.OVERPASS_MIRRORS[:2]
        query_success = False

        last_failure_reason = "Nearby unavailable"
        for mirror_idx, endpoint in enumerate(mirrors):
            try:
                logger.info("[OVERPASS] Querying endpoint %s (timeout: %ss)...", endpoint, timeout_sec)
                resp = requests.post(
                    endpoint,
                    data={"data": overpass_ql.strip()},
                    headers=headers,
                    timeout=timeout_sec,
                )
                if resp.status_code == 429:
                    logger.warning("[OVERPASS] HTTP 429 rate limit from %s.", endpoint)
                    self.last_status = "rate_limited"
                    last_failure_reason = "Nearby unavailable (rate limited)"
                    break
                if resp.status_code in (500, 502, 503, 504):
                    logger.warning("[OVERPASS] HTTP %d from %s. Trying next mirror...", resp.status_code, endpoint)
                    last_failure_reason = f"Nearby unavailable (HTTP {resp.status_code})"
                    continue
                resp.raise_for_status()
                data = resp.json()
                elements = data.get("elements", [])
                self.consecutive_failures = 0
                self.last_status = "ok"
                query_success = True
                break
            except requests.Timeout as exc:
                logger.warning("[OVERPASS] Endpoint %s timed out.", endpoint)
                self.last_status = "timeout"
                last_failure_reason = "Nearby unavailable (timeout)"
                break
            except requests.RequestException as exc:
                logger.warning("[OVERPASS] Endpoint %s failed (%s). Retrying on mirror...", endpoint, type(exc).__name__)
                last_failure_reason = f"Nearby unavailable ({type(exc).__name__})"

        dur = time.perf_counter() - t_start
        ctx = get_current_context()
        if ctx:
            ctx.record_external_call("overpass", dur)

        if not query_success:
            if self.last_status not in ("timeout", "rate_limited"):
                self.last_status = "timeout_or_error"
            self.consecutive_failures += 1
            self.last_failure_time = time.time()
            res = self._empty_result(last_failure_reason)
            self._negative_cache[cache_key] = (time.time() + 180, res)
            return res

        categorized = self._process_elements(elements, latitude, longitude)

        # Cache on disk
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(categorized, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.warning("[OVERPASS] Failed to write disk cache: %s", e)

        return categorized

    def _process_elements(
        self,
        elements: list[dict[str, Any]],
        center_lat: float,
        center_lon: float,
    ) -> dict[str, Any]:
        """Classifies elements into must_visit, food, cafes, and stay; caps total at 20."""
        attractions: list[dict[str, Any]] = []
        dining: list[dict[str, Any]] = []
        cafes: list[dict[str, Any]] = []
        hotels: list[dict[str, Any]] = []

        seen_names = set()

        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name:en") or tags.get("name")
            if not name or name in seen_names:
                continue
            seen_names.add(name)

            # Extract coordinates (node or center for way)
            lat = el.get("lat") or el.get("center", {}).get("lat")
            lon = el.get("lon") or el.get("center", {}).get("lon")
            if lat is None or lon is None:
                continue

            dist = self._calculate_distance_km(center_lat, center_lon, lat, lon)
            osm_type = el.get("type", "node")
            osm_id = el.get("id")
            place_id = f"osm_{osm_type}_{osm_id}"

            # Check if explicit Commons tag exists for nearby photo
            photos = []
            if "wikimedia_commons" in tags:
                photos.append({
                    "url": f"https://commons.wikimedia.org/wiki/{tags['wikimedia_commons']}",
                    "author": "Wikimedia Commons",
                })

            item = {
                "id": place_id,
                "place_id": place_id,
                "name": name,
                "display_name": name,
                "formatted_address": tags.get("addr:street", f"Near destination ({dist} km)"),
                "latitude": float(lat),
                "longitude": float(lon),
                "distance_km": dist,
                "rating": None,  # NEVER invent ratings
                "user_ratings_total": None,  # NEVER invent reviews
                "user_rating_count": None,
                "types": [tags.get("tourism") or tags.get("amenity") or tags.get("historic") or "point_of_interest"],
                "photos": photos,
                "maps_url": f"https://www.openstreetmap.org/{osm_type}/{osm_id}",
            }

            # Classify
            if tags.get("tourism") in ("attraction", "museum", "viewpoint", "artwork") or "historic" in tags:
                item["category"] = "Attraction"
                attractions.append(item)
            elif tags.get("amenity") == "restaurant":
                item["category"] = "Restaurant"
                dining.append(item)
            elif tags.get("amenity") == "cafe":
                item["category"] = "Cafe"
                cafes.append(item)
            elif tags.get("tourism") in ("hotel", "guest_house", "hostel"):
                item["category"] = "Hotel"
                hotels.append(item)

        # Sort each by distance
        attractions.sort(key=lambda x: x.get("distance_km", 999))
        dining.sort(key=lambda x: x.get("distance_km", 999))
        cafes.sort(key=lambda x: x.get("distance_km", 999))
        hotels.sort(key=lambda x: x.get("distance_km", 999))

        # Balance categories within ~20 items total cap (e.g. up to 6 attractions, 6 food, 4 cafes, 4 stay)
        capped_attractions = attractions[:6]
        capped_dining = dining[:6]
        capped_cafes = cafes[:4]
        capped_hotels = hotels[:4]

        # Combine dining + cafes into 'food' for internal schema compatibility while preserving distinction
        combined_food = capped_dining + capped_cafes

        total_places = len(capped_attractions) + len(combined_food) + len(capped_hotels)

        return {
            "must_visit": capped_attractions,
            "food": combined_food,
            "stay": capped_hotels,
            "attractions": capped_attractions,
            "dining": capped_dining,
            "cafes": capped_cafes,
            "hotels": capped_hotels,
            "transport": [],
            "shopping": [],
            "nature": [],
            "statistics": {
                "places_found": total_places,
                "categories": sum(bool(c) for c in [capped_attractions, capped_dining, capped_cafes, capped_hotels]),
                "provider": "overpass",
            },
            "status": "ok",
        }

    def _empty_result(self, reason: str) -> dict[str, Any]:
        """Degrades to empty list + reason message."""
        return {
            "must_visit": [],
            "food": [],
            "stay": [],
            "attractions": [],
            "dining": [],
            "cafes": [],
            "hotels": [],
            "transport": [],
            "shopping": [],
            "nature": [],
            "statistics": {
                "places_found": 0,
                "categories": 0,
                "provider": "overpass",
            },
            "status": "Nearby unavailable",
            "message": reason,
        }
