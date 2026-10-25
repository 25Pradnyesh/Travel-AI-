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
        month_num_data: dict[int, dict[str, float]] = {}

        for m in range(1, 13):
            t_list = month_temps[m]
            p_list = month_precips[m]
            m_name = calendar.month_name[m]
            mean_temp = sum(t_list) / len(t_list) if t_list else 20.0
            total_precip_annual = (sum(p_list) / 5.0) if p_list else 50.0

            monthly_stats[m_name] = {
                "mean_temp_c": round(mean_temp, 1),
                "mean_precipitation_mm": round(total_precip_annual, 1),
            }
            month_num_data[m] = {
                "name": m_name,
                "temp": mean_temp,
                "precip": total_precip_annual,
            }

            # Score travel comfort: optimal temp 17°C–25°C, comfortable 13°C–28°C
            # Heavy penalty for freezing / extreme cold (<10°C) and extreme heat (>32°C)
            if 17.0 <= mean_temp <= 25.0:
                temp_penalty = abs(mean_temp - 21.0) * 1.5
            elif mean_temp > 25.0:
                temp_penalty = 6.0 + (mean_temp - 25.0) * 3.0
            elif 10.0 <= mean_temp < 17.0:
                temp_penalty = (17.0 - mean_temp) * 3.5
            elif 5.0 <= mean_temp < 10.0:
                temp_penalty = 24.5 + (10.0 - mean_temp) * 6.0
            else:  # < 5.0 C (freezing or near-freezing)
                temp_penalty = 54.5 + (5.0 - mean_temp) * 10.0

            # Rainfall penalty: mild penalty for >60mm, heavier for monsoon >180mm
            rain_penalty = max(0.0, total_precip_annual - 60.0) / 10.0 * 2.0
            if total_precip_annual > 180.0:
                rain_penalty += (total_precip_annual - 180.0) / 10.0 * 2.0

            score = 100.0 - temp_penalty - rain_penalty
            month_scores.append((m, m_name, score, mean_temp, total_precip_annual))

        # Sort months by comfort score descending
        month_scores.sort(key=lambda x: x[2], reverse=True)

        is_tropical = abs(lat_r) <= 23.5
        is_southern = lat_r < -5.0

        # -------------------------------------------------------------
        # Season Cards & Recommended Window (Hemisphere & Tropics aware)
        # -------------------------------------------------------------
        season_cards = []
        if is_tropical:
            # Tropics: Dry Season vs Wet/Monsoon Season (never spring/autumn)
            # Sort calendar months by rainfall to identify dry and wet clusters
            dry_months = [m for m in range(1, 13) if month_num_data[m]["precip"] <= 90.0]
            wet_months = [m for m in range(1, 13) if month_num_data[m]["precip"] > 140.0]
            if not dry_months:
                # If all rain is high, lowest 5 months
                sorted_by_rain = sorted(range(1, 13), key=lambda m: month_num_data[m]["precip"])
                dry_months = sorted(sorted_by_rain[:5])
                wet_months = sorted(sorted_by_rain[7:])

            dry_names = [calendar.month_name[m] for m in dry_months]
            wet_names = [calendar.month_name[m] for m in wet_months]

            dry_temps = [month_num_data[m]["temp"] for m in dry_months]
            dry_rain = [month_num_data[m]["precip"] for m in dry_months]
            dry_temp_min = round(min(dry_temps)) if dry_temps else 22
            dry_temp_max = round(max(dry_temps)) if dry_temps else 28
            dry_rain_avg = round(sum(dry_rain) / len(dry_rain), 1) if dry_rain else 50.0

            wet_temps = [month_num_data[m]["temp"] for m in wet_months]
            wet_rain = [month_num_data[m]["precip"] for m in wet_months]
            wet_temp_min = round(min(wet_temps)) if wet_temps else 24
            wet_temp_max = round(max(wet_temps)) if wet_temps else 30
            wet_rain_avg = round(sum(wet_rain) / len(wet_rain), 1) if wet_rain else 220.0

            dry_window_str = f"{dry_names[0]}–{dry_names[-1]}" if len(dry_names) > 1 else (dry_names[0] if dry_names else "Year-round")
            wet_window_str = f"{wet_names[0]}–{wet_names[-1]}" if len(wet_names) > 1 else (wet_names[0] if wet_names else "Seasonal")

            season_cards = [
                {
                    "name": "Dry Season",
                    "months": dry_window_str,
                    "avg_temp_range": f"{dry_temp_min}°C–{dry_temp_max}°C",
                    "avg_rainfall": f"{dry_rain_avg} mm/mo",
                    "description": "Lowest rainfall and sunny skies; optimal conditions for exploring and outdoor activities.",
                },
                {
                    "name": "Wet Season",
                    "months": wet_window_str,
                    "avg_temp_range": f"{wet_temp_min}°C–{wet_temp_max}°C",
                    "avg_rainfall": f"{wet_rain_avg} mm/mo",
                    "description": "Tropical downpours and lush landscapes; higher humidity with occasional afternoon storms.",
                },
            ]

            recommended_window = f"Dry season: {dry_window_str}"
            temp_range = f"{dry_temp_min}°C–{dry_temp_max}°C"
            recommended_reason = f"Warm temperatures ({temp_range}) and minimal rainfall ({dry_rain_avg} mm/mo), ideal for travel."
            best_season_title = f"Dry Season ({dry_window_str})"
            best_months = dry_names[:4] if dry_names else [item[1] for item in month_scores[:4]]
            peak_months = dry_names[:3] if dry_names else [item[1] for item in month_scores[:3]]
            avoid_months = wet_names[:3]

        else:
            # Temperate / Subtropical: Spring, Summer, Autumn, Winter
            if is_southern:
                season_defs = [
                    ("Spring", [9, 10, 11]),
                    ("Summer", [12, 1, 2]),
                    ("Autumn", [3, 4, 5]),
                    ("Winter", [6, 7, 8]),
                ]
            else:
                season_defs = [
                    ("Spring", [3, 4, 5]),
                    ("Summer", [6, 7, 8]),
                    ("Autumn", [9, 10, 11]),
                    ("Winter", [12, 1, 2]),
                ]

            season_scores = []
            for s_name, m_list in season_defs:
                s_temps = [month_num_data[m]["temp"] for m in m_list]
                s_precips = [month_num_data[m]["precip"] for m in m_list]
                s_t_min = round(min(s_temps))
                s_t_max = round(max(s_temps))
                s_rain_avg = round(sum(s_precips) / len(s_precips), 1)
                s_m_names = [calendar.month_name[m] for m in m_list]
                s_window = f"{s_m_names[0]}–{s_m_names[-1]}"
                # Average comfort score for the season
                avg_score = sum(next(x[2] for x in month_scores if x[0] == m) for m in m_list) / 3.0
                season_scores.append((s_name, avg_score, s_window, f"{s_t_min}°C–{s_t_max}°C", s_rain_avg, s_m_names))

                # Descriptive weather statement from data only
                if s_t_min < 2:
                    desc = f"Crisp to freezing ({s_t_min}°C–{s_t_max}°C); warm winter clothing required."
                elif s_t_min < 10:
                    desc = f"Cool and crisp ({s_t_min}°C–{s_t_max}°C); light jacket or layers recommended."
                elif s_t_max > 28:
                    desc = f"Warm and sunny ({s_t_min}°C–{s_t_max}°C) with higher seasonal rainfall ({s_rain_avg} mm/mo)."
                elif s_rain_avg < 80.0:
                    desc = f"Pleasant and dry with mild temperatures ({s_t_min}°C–{s_t_max}°C) and low rainfall ({s_rain_avg} mm/mo)."
                else:
                    desc = f"Comfortable weather ({s_t_min}°C–{s_t_max}°C) with moderate precipitation ({s_rain_avg} mm/mo)."

                season_cards.append({
                    "name": s_name,
                    "months": s_window,
                    "avg_temp_range": f"{s_t_min}°C–{s_t_max}°C",
                    "avg_rainfall": f"{s_rain_avg} mm/mo",
                    "description": desc,
                })

            season_scores.sort(key=lambda x: x[1], reverse=True)
            top_season = season_scores[0]
            second_season = season_scores[1]

            # If top two seasons both have high comfort (e.g. Spring & Autumn), combine them
            if second_season[1] >= 65.0 and top_season[1] >= 70.0:
                best_season_title = f"{top_season[0]} & {second_season[0]}"
                recommended_window = f"{top_season[2]} & {second_season[2]}"
                temp_range = f"{top_season[3]}"
                recommended_reason = f"Mild temperatures ({top_season[3]}) and low rainfall, offering optimal conditions for sightseeing."
                combined_months = top_season[5][:2] + second_season[5][:2]
                best_months = combined_months
            else:
                best_season_title = f"{top_season[0]} ({top_season[2]})"
                recommended_window = top_season[2]
                temp_range = top_season[3]
                if top_season[1] < 40.0:
                    temp_qualifier = "Seasonal temperatures"
                elif "Winter" in top_season[0]:
                    temp_qualifier = "Cool winter temperatures"
                else:
                    temp_qualifier = "Comfortable temperatures"
                recommended_reason = f"{temp_qualifier} ({top_season[3]}) and favorable conditions ({top_season[4]} mm/mo rain), optimal for travel."
                best_months = top_season[5]

            peak_months = best_months[:3]
            avoid_months = season_scores[-1][5]

        # -------------------------------------------------------------
        # Climate Normals Summary for Overview Line 5
        # -------------------------------------------------------------
        mean_annual_temp = round(sum(m["mean_temp_c"] for m in monthly_stats.values()) / 12.0, 1)
        total_annual_precip = round(sum(m["mean_precipitation_mm"] for m in monthly_stats.values()))

        if is_tropical:
            climate_type = "Tropical savanna" if total_annual_precip < 1800 else "Tropical rainforest"
        elif mean_annual_temp >= 14.5:
            climate_type = "Humid subtropical" if total_annual_precip > 1000 else "Mediterranean / Subtropical"
        elif mean_annual_temp >= 8.5:
            climate_type = "Temperate oceanic" if total_annual_precip < 900 else "Humid continental"
        else:
            climate_type = "Cool continental"

        climate_summary = f"{climate_type} • Annual avg {mean_annual_temp}°C • {total_annual_precip:,} mm rain"

        result = {
            "best_season": best_season_title,
            "recommended_window": recommended_window,
            "recommended_reason": recommended_reason,
            "temperature_range": temp_range,
            "season_cards": season_cards,
            "best_months": best_months,
            "peak_months": peak_months,
            "avoid_months": avoid_months,
            "weather_source": "Open-Meteo Historical Weather",
            "weather_attribution": "based on historical weather",
            "weather_basis": "based on historical weather",
            "years_analyzed": f"{start_year}-{end_year} (5 full years)",
            "climate_summary": climate_summary,
            "monthly_summary": monthly_stats,
        }

        # Cache on disk
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2)
        except Exception:
            pass
        return result
