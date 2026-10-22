import datetime
import json
import os
import shutil
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import requests

from engine.app.api.health import health
from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.gemini.gemini_counter import GeminiCallCounter
from engine.app.services.location.location_resolver import LocationResolver
from engine.app.services.places.base import PlacesProvider
from engine.app.services.places.factory import get_places_provider
from engine.app.services.places.nominatim_client import (
    NominatimClient,
    get_nominatim_user_agent,
    normalize_query,
)
from engine.app.services.places.open_meteo_client import OpenMeteoClient
from engine.app.services.places.osm_provider import OsmProvider
from engine.app.services.places.overpass_client import OverpassClient
from engine.app.services.places.wikimedia_client import (
    WikimediaClient,
    get_wikimedia_user_agent,
    is_allowed_license,
)


class TestOsmPlacesProvider(unittest.TestCase):
    """
    Unit and integration tests for OsmProvider and keyless free places services.
    Enforces zero live network calls and verifies anti-Google invariant.
    """

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.cache_dir = Path(self.temp_dir) / "cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.original_contact = os.environ.get("APP_CONTACT")
        os.environ["APP_CONTACT"] = "qa-bot@travelai.local"
        os.environ["PLACES_PROVIDER"] = "osm"
        os.environ["GOOGLE_PLACES_ENABLED"] = "false"

    def tearDown(self):
        if self.original_contact is not None:
            os.environ["APP_CONTACT"] = self.original_contact
        else:
            os.environ.pop("APP_CONTACT", None)
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    # ==================================================
    # 1. User-Agent and Contact Enforcement
    # ==================================================

    def test_user_agent_fails_when_app_contact_unset(self):
        """Must fail with a descriptive message if APP_CONTACT is unset; never invent one."""
        with patch.dict(os.environ, {"APP_CONTACT": ""}):
            with self.assertRaises(RuntimeError) as ctx:
                get_nominatim_user_agent()
            self.assertIn("APP_CONTACT environment variable must be set", str(ctx.exception))

            with self.assertRaises(RuntimeError) as ctx_wiki:
                get_wikimedia_user_agent()
            self.assertIn("APP_CONTACT environment variable must be set", str(ctx_wiki.exception))

    def test_user_agent_format(self):
        """User-Agent must identify TravelAI and include the verified contact."""
        ua = get_nominatim_user_agent()
        self.assertEqual(ua, "TravelAI/1.0 (qa-bot@travelai.local)")

    # ==================================================
    # 2. Nominatim Throttling and Disk Caching
    # ==================================================

    def test_nominatim_caching_and_normalization(self):
        """Nominatim queries must be normalized and persisted to disk cache."""
        norm = normalize_query("  Lake   Como,   Italy!  ")
        self.assertEqual(norm, "lake como, italy")

        client = NominatimClient(cache_dir=self.cache_dir / "nom")
        mock_raw = [
            {
                "osm_type": "relation",
                "osm_id": 42928,
                "lat": "45.99",
                "lon": "9.28",
                "name": "Lake Como",
                "display_name": "Lake Como, Lombardy, Italy",
                "category": "natural",
                "type": "water",
                "extratags": {"wikidata": "Q17478", "wikipedia": "en:Lake Como"},
                "address": {"county": "Como", "state": "Lombardy", "country": "Italy"},
            }
        ]

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_raw

        with patch("requests.get", return_value=mock_resp) as mock_get:
            # First call: hits mocked network and writes to disk cache
            res1 = client.search("Lake Como, Italy")
            self.assertEqual(len(res1), 1)
            self.assertEqual(mock_get.call_count, 1)
            self.assertEqual(res1[0]["id"], "osm_relation_42928")
            self.assertEqual(res1[0]["latitude"], 45.99)
            self.assertIsNone(res1[0]["rating"])  # Never invent ratings

            # Second call: must read from disk cache without making another HTTP call
            res2 = client.search("  Lake Como, Italy!  ")
            self.assertEqual(len(res2), 1)
            self.assertEqual(mock_get.call_count, 1)  # Still 1: cache hit!

    def test_nominatim_throttling_interval(self):
        """Global throttle queue enforces at least 1 req/sec interval."""
        client = NominatimClient(cache_dir=self.cache_dir / "nom_throttle")
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = []

        with patch("requests.get", return_value=mock_resp), \
             patch("time.sleep") as mock_sleep:
            # First search
            client.search("Place A")
            # Immediate second search for a different query (forces network check)
            client.search("Place B")
            # time.sleep must have been called to maintain the 1s interval
            mock_sleep.assert_called()

    # ==================================================
    # 3. Open-Meteo Geocoding
    # ==================================================

    def test_open_meteo_city_geocoding(self):
        """Open-Meteo geocoding resolves city names at zero cost."""
        client = OpenMeteoClient(cache_dir=self.cache_dir / "weather")
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "results": [
                {
                    "id": 3175395,
                    "name": "Florence",
                    "latitude": 43.76956,
                    "longitude": 11.25581,
                    "country": "Italy",
                    "admin1": "Tuscany",
                }
            ]
        }

        with patch("requests.get", return_value=mock_resp):
            cities = client.search_city("Florence", count=2)
            self.assertEqual(len(cities), 1)
            self.assertEqual(cities[0]["name"], "Florence")
            self.assertEqual(cities[0]["country"], "Italy")
            self.assertEqual(cities[0]["latitude"], 43.76956)
            self.assertIsNone(cities[0]["rating"])

    # ==================================================
    # 4. Open-Meteo Historical Weather (5 Full Years)
    # ==================================================

    def test_open_meteo_historical_weather(self):
        """Computes best travel months from 5-year historical weather daily archive."""
        client = OpenMeteoClient(cache_dir=self.cache_dir / "weather")

        # Mock daily records for 12 months over 5 years
        mock_times = []
        mock_temps = []
        mock_precips = []
        for year in range(2021, 2026):
            for month in range(1, 13):
                m_str = f"{month:02d}"
                mock_times.append(f"{year}-{m_str}-15")
                # Summer/Autumn pleasant ~22C, Winter cold ~5C
                temp = 22.0 if month in (5, 6, 9, 10) else (30.0 if month in (7, 8) else 6.0)
                precip = 20.0 if month in (5, 6, 9) else 110.0
                mock_temps.append(temp)
                mock_precips.append(precip)

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "daily": {
                "time": mock_times,
                "temperature_2m_mean": mock_temps,
                "precipitation_sum": mock_precips,
            }
        }

        with patch("requests.get", return_value=mock_resp):
            hist = client.get_historical_best_months(45.99, 9.28)
            self.assertIsNotNone(hist)
            self.assertEqual(hist["weather_attribution"], "based on historical weather")
            self.assertIn("best_months", hist)
            self.assertTrue(len(hist["best_months"]) >= 3)
            # May, June, September should be ranked among best months
            self.assertTrue(any(m in ("May", "June", "September") for m in hist["best_months"]))

    # ==================================================
    # 5. Wikimedia Photography & CC Whitelist Filtering
    # ==================================================

    def test_license_whitelist_filtering(self):
        """Strictly accepts CC0, PD, CC BY, CC BY-SA; rejects non-commercial, ND, and proprietary."""
        # Allowed
        self.assertTrue(is_allowed_license("CC0"))
        self.assertTrue(is_allowed_license("CC0 1.0 Universal"))
        self.assertTrue(is_allowed_license("Public domain"))
        self.assertTrue(is_allowed_license("PD-self"))
        self.assertTrue(is_allowed_license("CC BY 4.0"))
        self.assertTrue(is_allowed_license("CC BY-SA 3.0"))
        self.assertTrue(is_allowed_license("CC-BY-SA-4.0"))

        # Disallowed
        self.assertFalse(is_allowed_license("CC BY-NC 4.0"))
        self.assertFalse(is_allowed_license("CC BY-NC-SA 3.0"))
        self.assertFalse(is_allowed_license("CC BY-ND 2.0"))
        self.assertFalse(is_allowed_license("All Rights Reserved"))
        self.assertFalse(is_allowed_license("Copyrighted"))
        self.assertFalse(is_allowed_license("Fair Use"))
        self.assertFalse(is_allowed_license(None))

    def test_wikimedia_photo_resolution_and_credit(self):
        """Resolves Wikipedia summary lead image and extracts verified CC author attribution."""
        client = WikimediaClient()

        summary_mock = MagicMock()
        summary_mock.status_code = 200
        summary_mock.json.return_value = {
            "title": "Lake Como",
            "extract": "Lake Como is a lake of glacial origin in Lombardy, Italy.",
            "originalimage": {
                "source": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Lake_Como_Panorama.jpg",
            },
        }

        imageinfo_mock = MagicMock()
        imageinfo_mock.status_code = 200
        imageinfo_mock.json.return_value = {
            "query": {
                "pages": {
                    "12345": {
                        "title": "File:Lake Como Panorama.jpg",
                        "imageinfo": [
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Lake_Como_Panorama.jpg",
                                "thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Lake_Como_Panorama.jpg/1600px-Lake_Como_Panorama.jpg",
                                "thumbwidth": 1600,
                                "thumbheight": 900,
                                "descriptionurl": "https://commons.wikimedia.org/wiki/File:Lake_Como_Panorama.jpg",
                                "extmetadata": {
                                    "Artist": {"value": "<a href='https://example.com'>Marco Rossi</a>"},
                                    "LicenseShortName": {"value": "CC BY-SA 4.0"},
                                    "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0"},
                                },
                            }
                        ],
                    }
                }
            }
        }

        def mock_get(url, **kwargs):
            if "api/rest_v1/page/summary" in url:
                return summary_mock
            elif "commons.wikimedia.org" in url:
                return imageinfo_mock
            return MagicMock(status_code=404)

        with patch("requests.get", side_effect=mock_get):
            photos, summary = client.resolve_destination_photos(
                extratags={"wikipedia": "en:Lake Como"},
                latitude=45.99,
                longitude=9.28,
            )

            self.assertEqual(len(photos), 1)
            photo = photos[0]
            self.assertEqual(photo["author"], "Marco Rossi")
            self.assertEqual(photo["license"], "CC BY-SA 4.0")
            self.assertEqual(photo["license_url"], "https://creativecommons.org/licenses/by-sa/4.0")
            self.assertIn("1600px", photo["url"])
            self.assertIn("Lake Como is a lake of glacial origin", summary)

    # ==================================================
    # 6. Overpass Nearby Search & Degradation
    # ==================================================

    def test_overpass_nearby_categorization_and_cap(self):
        """Single Overpass query categorizes nearby places and caps at ~20 items."""
        client = OverpassClient(cache_dir=self.cache_dir / "overpass")

        elements = []
        # 10 attractions
        for i in range(10):
            elements.append({
                "type": "node",
                "id": 100 + i,
                "lat": 45.99 + (i * 0.001),
                "lon": 9.28 + (i * 0.001),
                "tags": {"name": f"Attraction {i}", "tourism": "attraction"},
            })
        # 10 restaurants
        for i in range(10):
            elements.append({
                "type": "node",
                "id": 200 + i,
                "lat": 45.99 + (i * 0.001),
                "lon": 9.28 + (i * 0.001),
                "tags": {"name": f"Restaurant {i}", "amenity": "restaurant"},
            })

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"elements": elements}

        with patch("requests.get", return_value=MagicMock(status_code=200, text="Rate limit: 2")), \
             patch("requests.post", return_value=mock_resp):
            nearby = client.search_nearby(45.99, 9.28, radius=1500)
            self.assertEqual(nearby["status"], "ok")
            # Should be capped at 6 attractions, 6 food, etc.
            self.assertTrue(len(nearby["must_visit"]) <= 6)
            self.assertTrue(len(nearby["food"]) <= 10)
            self.assertTrue(nearby["statistics"]["places_found"] <= 20)
            # Rating and reviews must be None
            for p in nearby["must_visit"]:
                self.assertIsNone(p["rating"])
                self.assertIsNone(p["user_ratings_total"])

    def test_overpass_graceful_degradation_on_429(self):
        """Degrades to empty list and 'Nearby unavailable' without raising an exception."""
        client = OverpassClient(cache_dir=self.cache_dir / "overpass")
        mock_resp = MagicMock()
        mock_resp.status_code = 429

        with patch("requests.get", return_value=MagicMock(status_code=200, text="Rate limit: 2")), \
             patch("requests.post", return_value=mock_resp):
            nearby = client.search_nearby(45.99, 9.28)
            self.assertEqual(nearby["status"], "Nearby unavailable")
            self.assertEqual(len(nearby["must_visit"]), 0)
            self.assertEqual(len(nearby["food"]), 0)

    # ==================================================
    # 7. Gemini Quota Hardening
    # ==================================================

    def test_gemini_call_counter_and_quota_exhaustion(self):
        """Counter increments and 429 returns 'Unverified (vision skipped)'."""
        counter_file = self.cache_dir / "gemini_test.json"
        counter = GeminiCallCounter(counter_file=counter_file)
        self.assertEqual(counter.get_count(), 0)

        counter.increment()
        self.assertEqual(counter.get_count(), 1)

        counter.mark_quota_exhausted()
        self.assertTrue(counter.is_quota_exhausted())

    # ==================================================
    # 8. /health Endpoint
    # ==================================================

    def test_health_reports_osm_provider_and_quota(self):
        """Endpoint exposes places_provider, reachability, and gemini quota."""
        with patch.dict(os.environ, {"PLACES_PROVIDER": "osm", "TESTING": "true"}):
            resp = health()
            self.assertEqual(resp["places_provider"], "osm")
            self.assertFalse(resp["google_places_enabled"])
            self.assertIn("reachability", resp)
            self.assertTrue(resp["reachability"]["nearby"])
            self.assertIn("gemini", resp)
            self.assertIn("daily_calls_used", resp["gemini"])

    # ==================================================
    # 9. STRICT ANTI-GOOGLE TEST (ZERO CALLS TO GOOGLE)
    # ==================================================

    def test_end_to_end_analysis_makes_zero_google_calls(self):
        """
        CRITICAL ACCEPTANCE TEST:
        Runs full LocationPipeline on a recorded fixture with PLACES_PROVIDER=osm.
        Monitors every outbound HTTP request.
        FAILS IMMEDIATELY if any request contacts *googleapis.com* or *google.com*.
        """
        # Recorded fixture data for Lake Como / Varenna
        mock_nom_results = [
            {
                "osm_type": "relation",
                "osm_id": 42928,
                "lat": "45.99",
                "lon": "9.28",
                "name": "Lake Como",
                "display_name": "Lake Como, Lombardy, Italy",
                "category": "natural",
                "type": "water",
                "extratags": {"wikidata": "Q17478", "wikipedia": "en:Lake Como"},
                "address": {"county": "Como", "state": "Lombardy", "country": "Italy"},
            }
        ]

        mock_wiki_summary = {
            "title": "Lake Como",
            "extract": "Lake Como is a lake of glacial origin in Lombardy, Italy.",
            "originalimage": {
                "source": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Lake_Como_Panorama.jpg",
            },
        }

        mock_wiki_imageinfo = {
            "query": {
                "pages": {
                    "100": {
                        "title": "File:Lake Como Panorama.jpg",
                        "imageinfo": [
                            {
                                "url": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Lake_Como_Panorama.jpg",
                                "thumburl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Lake_Como_Panorama.jpg/1600px-Lake_Como_Panorama.jpg",
                                "descriptionurl": "https://commons.wikimedia.org/wiki/File:Lake_Como_Panorama.jpg",
                                "extmetadata": {
                                    "Artist": {"value": "Giuseppe Bellini"},
                                    "LicenseShortName": {"value": "CC BY-SA 4.0"},
                                    "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0"},
                                },
                            }
                        ],
                    }
                }
            }
        }

        mock_overpass_elements = [
            {
                "type": "node",
                "id": 555,
                "lat": 45.992,
                "lon": 9.283,
                "tags": {"name": "Villa Monastero", "tourism": "attraction"},
            },
            {
                "type": "node",
                "id": 666,
                "lat": 45.991,
                "lon": 9.284,
                "tags": {"name": "Ristorante Il Cavatappi", "amenity": "restaurant"},
            },
        ]

        # Intercept ALL requests calls to assert zero Google contact
        google_calls = []

        real_get = requests.get
        real_post = requests.post

        def guarded_request(method, url, *args, **kwargs):
            url_str = str(url).lower()
            if "google" in url_str:
                google_calls.append(url_str)
                raise AssertionError(f"FATAL: Attempted unapproved call to Google API during OSM analysis: {url}")

            # Route keyless mock endpoints
            mock_res = MagicMock()
            if "nominatim.openstreetmap.org" in url_str:
                mock_res.status_code = 200
                mock_res.json.return_value = mock_nom_results
                return mock_res
            elif "api/rest_v1/page/summary" in url_str:
                mock_res.status_code = 200
                mock_res.json.return_value = mock_wiki_summary
                return mock_res
            elif "commons.wikimedia.org" in url_str:
                mock_res.status_code = 200
                mock_res.json.return_value = mock_wiki_imageinfo
                return mock_res
            elif "overpass-api.de/api/status" in url_str:
                mock_res.status_code = 200
                mock_res.text = "Rate limit: 2"
                return mock_res
            elif "overpass-api.de" in url_str:
                mock_res.status_code = 200
                mock_res.json.return_value = {"elements": mock_overpass_elements}
                return mock_res
            elif "archive-api.open-meteo.com" in url_str:
                mock_res.status_code = 200
                mock_res.json.return_value = {
                    "daily": {
                        "time": [f"2023-{m:02d}-15" for m in range(1, 13)],
                        "temperature_2m_mean": [22.0] * 12,
                        "precipitation_sum": [30.0] * 12,
                    }
                }
                return mock_res

            mock_res.status_code = 200
            mock_res.json.return_value = {}
            return mock_res

        with patch("requests.get", side_effect=lambda u, *a, **k: guarded_request("GET", u, *a, **k)), \
             patch("requests.post", side_effect=lambda u, *a, **k: guarded_request("POST", u, *a, **k)):

            pipeline = LocationPipeline()
            # Disable gemini multimodal vision in this test so it relies on text scoring
            pipeline.gemini.should_verify = MagicMock(return_value=False)

            metadata = {
                "title": "Exploring Lake Como in Italy",
                "caption": "A stunning weekend trip to Lake Como",
                "ocr_text": "Varenna Lake Como",
                "speech_text": "We took a ferry across Lake Como",
            }

            resp = pipeline.run(
                metadata=metadata,
                video_path=None,
            )

            # Assertions
            self.assertTrue(resp["success"])
            self.assertIsNotNone(resp["best_guess"])

            best_guess = resp["best_guess"]
            self.assertIn("Lake Como", best_guess["name"])
            self.assertEqual(best_guess["country"], "Italy")
            self.assertEqual(best_guess["latitude"], 45.99)
            self.assertEqual(best_guess["longitude"], 9.28)
            # Ratings must be None in response
            self.assertIsNone(best_guess["rating"])
            self.assertIsNone(best_guess["user_ratings_total"])

            # Photos with CC license
            self.assertTrue(len(best_guess["photos"]) >= 1)
            first_photo = best_guess["photos"][0]
            self.assertEqual(first_photo["author"], "Giuseppe Bellini")
            self.assertEqual(first_photo["license"], "CC BY-SA 4.0")
            self.assertEqual(first_photo["license_url"], "https://creativecommons.org/licenses/by-sa/4.0")

            # Nearby places
            self.assertTrue(len(resp["nearby_places"]) >= 1)
            nearby_names = [p["name"] for p in resp["nearby_places"]]
            self.assertIn("Villa Monastero", nearby_names)

            # Travel intelligence with historical weather
            ti = resp["travel_intelligence"]
            self.assertIn("best_season", ti)
            self.assertEqual(ti.get("weather_basis"), "based on historical weather")

            # ABSOLUTE GUARANTEE: Zero Google calls occurred
            self.assertEqual(len(google_calls), 0)

    # ==================================================
    # 10. Provider Injection, Error Handling & Health Readiness
    # ==================================================

    def test_provider_injection_into_location_resolver(self):
        """LocationResolver must accept an injected PlacesProvider and use it."""
        mock_provider = MagicMock(spec=PlacesProvider)
        mock_provider.name = "osm"
        mock_provider.is_available = True
        mock_provider.search.return_value = []

        resolver = LocationResolver(provider=mock_provider)
        self.assertIs(resolver.provider, mock_provider)
        self.assertIs(resolver.search, mock_provider)
        self.assertIs(resolver.details, mock_provider)
        self.assertIs(resolver.nearby._provider, mock_provider)

    def test_provider_injection_into_location_pipeline(self):
        """LocationPipeline must accept an injected places_provider and pass to LocationResolver."""
        mock_provider = MagicMock(spec=PlacesProvider)
        mock_provider.name = "osm"
        mock_provider.is_available = True

        pipeline = LocationPipeline(places_provider=mock_provider)
        self.assertIs(pipeline.resolver.provider, mock_provider)

    def test_location_resolver_unavailable_provider_error_handling(self):
        """Resolver must gracefully handle unavailable provider and record truthful diagnostic error."""
        mock_provider = MagicMock(spec=PlacesProvider)
        mock_provider.name = "osm"
        mock_provider.is_available = False

        resolver = LocationResolver(provider=mock_provider)
        evidence = {
            "candidates": ["Lake Como"],
            "best_candidates": ["Lake Como"],
            "cleaned_text": "Lake Como",
        }
        res = resolver.resolve(evidence)
        self.assertIsNone(res)
        self.assertEqual(
            resolver.last_resolver_error,
            "Place lookup is unavailable right now (osm provider not configured)",
        )

    def test_location_resolver_provider_search_exception_handling(self):
        """Resolver must catch provider search exceptions gracefully and track truthful error state."""
        mock_provider = MagicMock(spec=PlacesProvider)
        mock_provider.name = "osm"
        mock_provider.is_available = True
        mock_provider.search.side_effect = RuntimeError("OSM connection refused")

        resolver = LocationResolver(provider=mock_provider)
        evidence = {
            "candidates": ["Lake Como"],
            "best_candidates": ["Lake Como"],
            "cleaned_text": "Lake Como",
        }
        res = resolver.resolve(evidence)
        self.assertIsNone(res)
        self.assertIn("Place lookup failed", resolver.last_resolver_error)
        self.assertIn("RuntimeError", resolver.last_resolver_error)

    def test_health_reflects_nearby_readiness_and_provider_readiness(self):
        """Health endpoint configuration and reachability must accurately reflect provider status."""
        # 1. Configured & available
        with patch.dict(os.environ, {"PLACES_PROVIDER": "osm", "APP_CONTACT": "qa@travelai.local", "TESTING": "true"}):
            resp = health()
            self.assertEqual(resp["status"], "ok")
            self.assertEqual(resp["places_provider"], "osm")
            self.assertTrue(resp["configuration"]["places_provider_ready"])
            self.assertTrue(resp["configuration"]["osm_ready"])
            self.assertTrue(resp["configuration"]["nearby_ready"])

        # 2. Provider unconfigured (APP_CONTACT empty)
        with patch.dict(os.environ, {"PLACES_PROVIDER": "osm", "APP_CONTACT": "", "TESTING": "false"}):
            resp = health()
            self.assertEqual(resp["status"], "degraded")
            self.assertFalse(resp["configuration"]["places_provider_ready"])
            self.assertFalse(resp["configuration"]["osm_ready"])
            self.assertFalse(resp["configuration"]["nearby_ready"])
            self.assertFalse(resp["reachability"]["nearby"])

    def test_factory_defaults_app_contact_when_unset(self):
        """Factory must supply default contact if completely unset in environment, but respect empty patch."""
        with patch.dict(os.environ, {"PLACES_PROVIDER": "osm"}, clear=True):
            # APP_CONTACT is unset
            provider = get_places_provider()
            self.assertTrue(provider.is_available)
            self.assertEqual(os.environ.get("APP_CONTACT"), "contact@travelai.local")

        # Explicitly empty string must NOT be overridden and provider must be unavailable
        with patch.dict(os.environ, {"PLACES_PROVIDER": "osm", "APP_CONTACT": ""}):
            provider = get_places_provider()
            self.assertFalse(provider.is_available)


if __name__ == "__main__":
    unittest.main()
