import calendar
import datetime
import hashlib
import json
import logging
from pathlib import Path
import time
from typing import Any

import requests

from engine.observability.context import get_current_context

logger = logging.getLogger(__name__)

WEATHER_CACHE_DIR = Path(__file__).resolve().parents[3] / "assets" / "cache" / "weather"


class OpenMeteoClient:
    """
    Client for Open-Meteo free APIs:
    1. Geocoding API for city/locality resolution.
    2. Historical Weather API for multi-year travel intelligence.
    """

    GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
    ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

    def __init__(self, cache_dir: Path | None = None):
        self.cache_dir = cache_dir or WEATHER_CACHE_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    # ==================================================
    # Geocoding (City-level names)
    # ==================================================

    def search_city(self, name: str, count: int = 3) -> list[dict[str, Any]]:
        """
        Searches Open-Meteo Geocoding for city-level and administrative names.
        """
        if not name or len(name.strip()) < 2:
            return []

        params = {
            "name": name.strip(),
            "count": count,
            "language": "en",
            "format": "json",
        }

        t_start = time.perf_counter()
        results = []
        try:
            resp = requests.get(self.GEOCODE_URL, params=params, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results") or []
        except Exception as exc:
            logger.warning("[OPEN_METEO] Geocoding failed for '%s': %s", name, exc)
            return []
        finally:
            dur = time.perf_counter() - t_start
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("open_meteo_geocode", dur)

        mapped = []
        for item in results:
            city_name = item.get("name", "")
            country = item.get("country", "")
            admin1 = item.get("admin1", "")
            address_parts = [p for p in [city_name, admin1, country] if p]
            formatted_address = ", ".join(address_parts)
            place_id = f"openmeteo_{item.get('id', city_name)}"
            lat = item.get("latitude")
            lon = item.get("longitude")

            mapped.append({
                "id": place_id,
                "place_id": place_id,
                "name": city_name,
                "display_name": formatted_address,
                "travel_name": city_name,
                "formatted_address": formatted_address,
                "latitude": float(lat) if lat is not None else None,
                "longitude": float(lon) if lon is not None else None,
                "category": "City",
                "primary_type": "locality",
                "types": ["locality", "city", "political"],
                "country": country,
                "city": city_name,
                "region": admin1,
                "rating": None,
                "user_rating_count": None,
                "user_ratings_total": None,
                "business_status": "OPERATIONAL",
                "maps_url": f"https://www.openstreetmap.org/#map=12/{lat}/{lon}" if lat and lon else "",
                "google_maps_url": f"https://www.openstreetmap.org/#map=12/{lat}/{lon}" if lat and lon else "",
                "importance": 0.8,
            })

        return mapped

    # ==================================================
    # Historical Weather (Last 5 full years)
    # ==================================================

    def get_historical_best_months(
        self,
        latitude: float,
        longitude: float,
    ) -> dict[str, Any] | None:
        """
        Fetches daily temperature and precipitation for the last 5 full years from Open-Meteo Archive API.
        Computes monthly averages and determines optimal travel months labeled 'based on historical weather'.
        """
        if latitude is None or longitude is None:
            return None

        # Cache key rounded to 2 decimal places (~1.1km)
        lat_r = round(latitude, 2)
        lon_r = round(longitude, 2)
        cache_key = f"{lat_r}_{lon_r}.json"
        cache_file = self.cache_dir / cache_key

        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

        now = datetime.datetime.now()
        # Last 5 full years: if 2026, 2021..2025; if 2024, 2019..2023
        end_year = now.year - 1
        start_year = end_year - 4
        start_date = f"{start_year}-01-01"
        end_date = f"{end_year}-12-31"

        params = {
            "latitude": lat_r,
            "longitude": lon_r,
            "start_date": start_date,
            "end_date": end_date,
            "daily": "temperature_2m_mean,precipitation_sum",
            "timezone": "auto",
        }

        t_start = time.perf_counter()
        data = None
        try:
            resp = requests.get(self.ARCHIVE_URL, params=params, timeout=12)
            resp.raise_for_status()
            data = resp.json()
        except Exception as exc:
            logger.warning("[OPEN_METEO] Historical weather failed for (%.2f, %.2f): %s", lat_r, lon_r, exc)
            return None
        finally:
            dur = time.perf_counter() - t_start
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("open_meteo_weather", dur)

        if not data or "daily" not in data:
            return None

        daily = data["daily"]
        times = daily.get("time", [])
        temps = daily.get("temperature_2m_mean", [])
        precips = daily.get("precipitation_sum", [])

        if not times or not temps:
            return None

        # Aggregate monthly stats
        # months 1 to 12
        month_temps: dict[int, list[float]] = {m: [] for m in range(1, 13)}
        month_precips: dict[int, list[float]] = {m: [] for m in range(1, 13)}

        for date_str, temp, precip in zip(times, temps, precips):
            if temp is None:
                continue
            try:
                m = int(date_str[5:7])
                month_temps[m].append(temp)
                if precip is not None:
                    month_precips[m].append(precip)
            except (ValueError, IndexError):
                continue

        monthly_stats = {}
        month_scores = []
        for m in range(1, 13):
            t_list = month_temps[m]
            p_list = month_precips[m]
            m_name = calendar.month_name[m]
            mean_temp = sum(t_list) / len(t_list) if t_list else 20.0
            # Total precip per month annualized (divide by 5 years)
            total_precip_annual = (sum(p_list) / 5.0) if p_list else 50.0

            monthly_stats[m_name] = {
                "mean_temp_c": round(mean_temp, 1),
                "mean_precipitation_mm": round(total_precip_annual, 1),
            }

            # Score travel comfort: ideal temp ~18C-26C, penalty for extreme cold (<5C), heat (>32C), rain (>100mm)
            temp_penalty = abs(mean_temp - 22.0)
            rain_penalty = max(0.0, total_precip_annual - 60.0) / 10.0
            score = 100.0 - (temp_penalty * 2.5) - (rain_penalty * 3.0)
            month_scores.append((m_name, score, mean_temp, total_precip_annual))

        # Sort months by comfort score descending
        month_scores.sort(key=lambda x: x[1], reverse=True)

        peak_months = [item[0] for item in month_scores[:3]]
        shoulder_months = [item[0] for item in month_scores[3:6]]
        avoid_months = [item[0] for item in month_scores[-3:] if item[1] < 60.0]

        best_months = [item[0] for item in month_scores[:4]]

        result = {
            "best_months": best_months,
            "peak_months": peak_months,
            "shoulder_months": shoulder_months,
            "avoid_months": avoid_months,
            "weather_source": "Open-Meteo Historical Weather",
            "weather_attribution": "based on historical weather",
            "years_analyzed": f"{start_year}-{end_year} (5 full years)",
            "monthly_summary": monthly_stats,
        }

        # Cache on disk
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
        except Exception:
            pass

        return result
