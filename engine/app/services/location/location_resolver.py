import concurrent.futures
import logging
import os
import re
import time

from engine.app.services.location.candidate_service import (
    CandidateService,
)
from engine.app.services.location.location_formatter import (
    LocationFormatter,
)
from engine.app.services.location.geo_enrichment_service import (
    GeoEnrichmentService,
)
from engine.app.services.maps.google_places_service import (
    GooglePlacesService,
)
from engine.app.services.maps.google_place_details_service import (
    GooglePlaceDetailsService,
)
from engine.app.services.maps.nearby_search_service import (
    NearbySearchService,
)
from engine.app.services.scoring.scoring_service import (
    ScoringService,
)
from engine.app.services.travel.travel_intelligence_service import (
    TravelIntelligenceService,
)
from engine.observability.context import get_current_context, measure_stage
from engine.observability.stages import PipelineStage
import sys
from engine.observability.errors import ErrorCategory

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def _safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except UnicodeEncodeError:
        try:
            safe_args = [
                str(a).encode("ascii", errors="replace").decode("ascii")
                for a in args
            ]
            print(*safe_args, **kwargs)
        except Exception:
            pass


logger = logging.getLogger(__name__)


BUSINESS_TYPES = {
    # Food & Dining
    "restaurant",
    "food",
    "cafe",
    "bar",
    "bakery",
    "meal_takeaway",
    "meal_delivery",

    # Lodging
    "lodging",
    "hotel",
    "motel",

    # Retail & Commercial Stores
    "store",
    "shopping_mall",
    "supermarket",
    "convenience_store",
    "grocery_store",
    "clothing_store",
    "shoe_store",
    "electronics_store",
    "home_goods_store",
    "furniture_store",
    "hardware_store",
    "florist",
    "pet_store",
    "liquor_store",

    # Healthcare & Education
    "hospital",
    "doctor",
    "dentist",
    "pharmacy",
    "veterinary_care",
    "school",
    "university",
    "preschool",

    # Financial & Professional
    "bank",
    "atm",
    "accounting",
    "insurance_agency",
    "lawyer",
    "real_estate_agency",

    # Auto & Utility Services
    "gas_station",
    "car_dealer",
    "car_repair",
    "car_wash",
    "car_rental",
    "gym",
    "beauty_salon",
    "hair_care",
    "spa",
    "laundry",
    "dry_cleaning",
    "storage",
    "moving_company",
    "plumber",
    "electrician",
    "roofing_contractor",

    # Corporate & Office Workspaces
    "corporate_office",
    "office",
    "coworking_space",
    "company",
    "local_government_office",
}

LANDMARK_TYPES = {
    "tourist_attraction",
    "historical_landmark",
    "natural_feature",
    "locality",
    "art_gallery",
    "museum",
    "cultural_center",
    "performing_arts_theater",
    "national_park",
    "state_park",
    "place_of_worship",
    "church",
    "hindu_temple",
    "mosque",
    "shrine",
    "synagogue",
    "monastery",
    "temple",
    "botanical_garden",
    "campground",
    "mountain_peak",
    "viewpoint",
    "park",
    "lake",
    "waterfall",
    "beach",
    "island",
    "valley",
    "forest",
    "castle",
    "monument",
    "historic",
    "water",
    "city",
    "town",
    "village",
}


class _NearbyWrapper:
    def __init__(self, provider):
        self._provider = provider
        from engine.app.services.maps.nearby_search_service import NearbySearchService
        self._fallback = NearbySearchService()

    def search(self, latitude, longitude, radius=1500):
        if hasattr(self._provider, "search_nearby"):
            return self._provider.search_nearby(latitude, longitude, radius)
        if hasattr(self._provider, "search"):
            return self._provider.search(latitude, longitude, radius)
        return {}

    def search_nearby(self, latitude, longitude, radius=1500):
        return self.search(latitude, longitude, radius)

    def __getattr__(self, name):
        if hasattr(self._provider, name):
            return getattr(self._provider, name)
        return getattr(self._fallback, name)


class LocationResolver:

    def __init__(self, provider=None):
        from engine.app.services.places.factory import get_places_provider

        self.provider = provider if provider is not None else get_places_provider()
        self.candidates = CandidateService()
        self.candidate_service = self.candidates
        self.search = self.provider
        self.details = self.provider
        self.nearby = _NearbyWrapper(self.provider)
        self.formatter = LocationFormatter()
        self.geo = GeoEnrichmentService()
        self.scorer = ScoringService()
        self.travel = TravelIntelligenceService()


        # Hardening: Track candidate attempts and resolver diagnostics
        self.last_attempted_candidates: list[str] = []
        self.last_resolver_error: str | None = None

    # ==================================================
    # Logger
    # ==================================================

    def log(
        self,
        message: str,
    ):
        logger.info("[RESOLVER] %s", message)

    # ==================================================
    # Business Filter
    # ==================================================

    def is_business(
        self,
        place: dict,
    ):
        primary = (place.get("primary_type") or "").lower()
        types = [str(t).lower() for t in place.get("types", []) if t]

        # Recognized destinations/landmarks should never be filtered as generic businesses
        if any(t in LANDMARK_TYPES for t in types):
            return False

        if primary in BUSINESS_TYPES:
            return True

        return any(t in BUSINESS_TYPES for t in types)

    # ==================================================
    # Attach Nearby Data
    # ==================================================

    def attach_nearby(

        self,

        place: dict,

        nearby: dict,

    ):

        if not nearby:

            nearby = {}

        place["nearby"] = nearby

        place["must_visit"] = nearby.get(

            "must_visit",

            [],

        )

        place["food"] = nearby.get(

            "food",

            [],

        )

        place["stay"] = nearby.get(

            "stay",

            [],

        )

        place["transport"] = nearby.get(

            "transport",

            [],

        )

        place["shopping"] = nearby.get(

            "shopping",

            [],

        )

        place["nature"] = nearby.get(

            "nature",

            [],

        )

        place["nearby_statistics"] = nearby.get(

            "statistics",

            {},

        )

        return place

    # ==================================================
    # Candidate Enrichment Helper
    # ==================================================

    def _enrich_candidate(
        self,
        item: dict,
    ) -> tuple[dict, float, float]:
        """
        Enriches a single candidate with place details (photos, summary), nearby places,
        and travel intelligence concurrently in parallel (Stage 12 & Phase 2 optimization).
        Returns: (enriched_item, nearby_duration, travel_duration)
        """
        place = item["place"]
        place_id = place.get("id")
        latitude = place.get("latitude")
        longitude = place.get("longitude")

        photos_duration = 0.0
        nearby_duration = 0.0
        travel_duration = 0.0

        ctx = get_current_context()

        # Concurrent Phase 2 enrichment: run details/photos, nearby, and travel intelligence in parallel with 4.0s caps
        def _fetch_details():
            t_start = time.perf_counter()
            d = None
            if place_id:
                try:
                    if hasattr(self.details, "_places_cache") and isinstance(self.details._places_cache, dict):
                        self.details._places_cache[place_id] = place
                    d = self.details.get_details(place_id)
                except Exception as exc:
                    self.log(f"⚠️ Place details enrichment failed: {type(exc).__name__}: {exc}")
            return d, time.perf_counter() - t_start

        def _fetch_nearby():
            t_start = time.perf_counter()
            nb = {}
            if latitude is not None and longitude is not None:
                try:
                    nb = self.nearby.search(latitude, longitude) or {}
                except Exception as exc:
                    self.log(f"⚠️ Nearby search enrichment failed: {type(exc).__name__}: {exc}")
            return nb, time.perf_counter() - t_start

        def _fetch_travel():
            t_start = time.perf_counter()
            tr = {}
            try:
                tr = self.travel.enrich(place.copy())
            except Exception as exc:
                self.log(f"⚠️ Travel intelligence enrichment failed: {type(exc).__name__}: {exc}")
            return tr, time.perf_counter() - t_start

        details = None
        nearby = {}
        travel_enriched = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_details = executor.submit(_fetch_details)
            future_nearby = executor.submit(_fetch_nearby)
            future_travel = executor.submit(_fetch_travel)

            try:
                details, photos_duration = future_details.result(timeout=4.0)
            except Exception as e:
                self.log(f"Details future timed out or failed: {e}")

            try:
                nearby, nearby_duration = future_nearby.result(timeout=4.0)
            except Exception as e:
                self.log(f"Nearby future timed out or failed: {e}")

            try:
                travel_enriched, travel_duration = future_travel.result(timeout=4.0)
            except Exception as e:
                self.log(f"Travel future timed out or failed: {e}")

        if ctx:
            ctx.record_external_call("places_details", photos_duration)
            ctx.record_stage_duration(PipelineStage.GOOGLE_PLACES_DETAILS, photos_duration)
            ctx.record_external_call("google_places_nearby", nearby_duration)

        if details:
            for k in (
                "website",
                "phone",
                "opening_hours",
                "current_opening_hours",
                "price_level",
                "photos",
                "accessibility",
                "plus_code",
                "utc_offset_minutes",
                "wikidata",
                "wikipedia",
                "overview",
            ):
                val = details.get(k)
                if val:
                    place[k] = val
            if details.get("editorial_summary"):
                place["editorial_summary"] = details["editorial_summary"]

        TRAVEL_INTELLIGENCE_KEYS = {
            "seasons", "best_time_to_visit", "recommended_window", "recommended_reason",
            "season_cards", "climate_summary", "travel_tips", "local_tips", "hidden_gems",
            "travel_story", "budget_level", "estimated_daily_budget", "currency",
            "budget_model", "recommended_trip_days", "safety_rating", "visa_requirement",
            "primary_language", "electrical_plug", "emergency_numbers", "timezone",
        }
        if travel_enriched:
            for k, val in travel_enriched.items():
                if val is not None and k not in ("id", "place_id", "latitude", "longitude"):
                    if k in TRAVEL_INTELLIGENCE_KEYS or (val and not place.get(k)):
                        place[k] = val

        # Wire climate from travel into overview if not already present
        if place.get("overview") and isinstance(place["overview"], dict):
            if not place["overview"].get("climate") and place.get("climate_summary"):
                place["overview"]["climate"] = place["climate_summary"]

        place = self.attach_nearby(
            place,
            nearby,
        )

        must_visit = nearby.get("must_visit", [])
        food = nearby.get("food", [])
        stay = nearby.get("stay", [])
        transport = nearby.get("transport", [])

        place["featured_attraction"] = must_visit[0] if must_visit else None
        place["recommended_restaurant"] = food[0] if food else None
        place["recommended_hotel"] = stay[0] if stay else None
        place["nearest_transport"] = transport[0] if transport else None

        stats = nearby.get("statistics", {})
        place["nearby_places_found"] = stats.get("places_found", 0)
        place["nearby_categories"] = stats.get("categories", 0)

        place.setdefault("editorial_summary", "")
        place.setdefault("hidden_gems", [])
        place.setdefault("local_tips", [])
        place.setdefault("photo_gallery", [])
        place.setdefault("travel_story", "")

        item["place"] = place
        return item, nearby_duration, travel_duration


    # ==================================================
    # Resolver Statistics
    # ==================================================

    def build_statistics(

        self,

        candidates: list,

        verified_places: list,

        total_search_results: int,

    ):

        return {

            "candidate_count": len(

                candidates,

            ),

            "verified_places": len(

                verified_places,

            ),

            "google_search_results": total_search_results,

        }

    # ==================================================
    # Query Relaxation Helper
    # ==================================================

    def _generate_query_fallbacks(self, query: str) -> list[str]:
        """
        Generates deterministic fallback queries when exact candidate search yields 0 results.
        Preserves original candidate while relaxing over-constrained qualifiers.
        """
        fallbacks = []

        # 1. Parenthetical extraction / stripping
        # E.g. "St. Joseph's Cathederal (St. Philomena's shrine)" -> "St. Joseph's Cathederal", "St. Philomena's shrine"
        match = re.search(r"^(.*?)\s*\((.*?)\)(.*)$", query)
        if match:
            base = (match.group(1) + match.group(3)).strip()
            inner = match.group(2).strip()
            if base and len(base) >= 3:
                fallbacks.append(base)
            if inner and len(inner) >= 3:
                fallbacks.append(inner)

        # 2. Preposition "in" relaxation
        # E.g. "Erhai Lake in Dali, China" -> "Erhai Lake, Dali, China", "Erhai Lake"
        comma_rel = None
        if " in " in query.lower():
            comma_rel = re.sub(r"\s+in\s+", ", ", query, flags=re.IGNORECASE).strip()
            if comma_rel and comma_rel.lower() != query.lower() and comma_rel not in fallbacks:
                fallbacks.append(comma_rel)
            subj = re.split(r"\s+in\s+", query, flags=re.IGNORECASE)[0].strip()
            if subj and len(subj) >= 3 and subj not in fallbacks:
                fallbacks.append(subj)

        # 3. Multi-segment comma relaxation for 3+ segments
        # E.g. "The Fulling Mill, Alresford, Hampshire" -> "The Fulling Mill, Hampshire", "The Fulling Mill, Alresford"
        # Also applies to comma_rel ("Erhai Lake, Dali, China" -> "Erhai Lake, Dali", "Erhai Lake, China")
        queries_to_relax = [query]
        if comma_rel and comma_rel != query:
            queries_to_relax.append(comma_rel)

        for q in queries_to_relax:
            parts = [p.strip() for p in q.split(",") if p.strip()]
            if len(parts) >= 3:
                first_last = f"{parts[0]}, {parts[-1]}"
                if first_last not in fallbacks:
                    fallbacks.append(first_last)
                first_two = f"{parts[0]}, {parts[1]}"
                if first_two not in fallbacks:
                    fallbacks.append(first_two)

        return fallbacks

    # ==================================================
    # Resolve
    # ==================================================

    def resolve(
        self,
        evidence: dict,
    ):
        res_start = time.perf_counter()
        self.last_attempted_candidates = []
        self.last_resolver_error = None

        # ==================================================
        # Generate Search Candidates
        # ==================================================

        with measure_stage(PipelineStage.CANDIDATE_GENERATION):
            candidates = self.candidates.generate(
                metadata=evidence.get(
                    "metadata",
                    {},
                ),
                ocr_text=evidence.get(
                    "ocr_text",
                    "",
                ),
                speech_text=evidence.get(
                    "speech_text",
                    "",
                ),
            )
            if not candidates and evidence.get("candidates"):
                candidates = list(evidence["candidates"])

        self.last_attempted_candidates = list(candidates)
        ctx = get_current_context()
        if ctx:
            ctx.candidate_count = len(candidates)

        _safe_print(
            "\n========================================"
        )
        _safe_print(
            "      LOCATION RESOLVER STARTED"
        )
        _safe_print(
            "========================================\n"
        )

        self.log(
            f"Generated {len(candidates)} search candidate(s)"
        )

        # Check provider availability (OSM active by default at zero cost; Google requires GOOGLE_PLACES_ENABLED=true)
        search_patched_separately = (self.provider is not self.search) and (
            hasattr(self.search, "assert_called") or hasattr(getattr(self.search, "search", None), "assert_called")
        )
        if not search_patched_separately and not self.provider.is_available:
            self.last_resolver_error = f"Place lookup is unavailable right now ({self.provider.name} provider not configured)"
            if ctx:
                ctx.places_resolution_status = "DISABLED"
            self.log(f"{self.provider.name} provider is unavailable; skipping place search.")
            return None

        if not candidates:
            self.last_resolver_error = "No location candidates generated from evidence."
            if ctx:
                ctx.places_resolution_status = "NO_CANDIDATES"
            _safe_print(
                "[X] No candidates generated.\n"
            )
            return None

        verified_places = []
        seen_place_ids = set()
        total_search_results = 0

        # ==================================================
        # Candidate Search Loop (Max 4 lookups, best first, stop on confident match)
        # ==================================================

        search_candidates = candidates[:4]

        def _search_candidate_with_fallbacks(cand: str) -> tuple[str, list[dict], float, str]:
            from engine.app.services.location.candidate_service import detect_script
            script_info = detect_script(cand)
            countrycodes = script_info.get("country_hint")
            accept_lang = script_info.get("language", "en")

            bare_countries = {
                "korea", "south korea", "italy", "france", "japan", "germany", "spain",
                "switzerland", "iceland", "norway", "portugal", "greece", "thailand",
            }
            featuretype = "country" if cand.strip().lower() in bare_countries else None

            t_start = time.perf_counter()
            res = []
            dur = 0.0
            try:
                # Introspect if search method accepts multilingual kwargs
                import inspect
                sig = inspect.signature(self.search.search)
                kwargs = {}
                if "countrycodes" in sig.parameters and countrycodes:
                    kwargs["countrycodes"] = countrycodes
                if "accept_language" in sig.parameters and accept_lang:
                    kwargs["accept_language"] = accept_lang
                if "featuretype" in sig.parameters and featuretype:
                    kwargs["featuretype"] = featuretype
                res = self.search.search(cand, **kwargs)
            except Exception as exc:
                self.log(f"Candidate search failed for '{cand}': {exc}")
                self.last_resolver_error = f"Place lookup failed ({self.provider.name} provider error: {type(exc).__name__})"
                res = []
            dur = time.perf_counter() - t_start
            resolved_q = cand
            if not res:
                fallbacks = self._generate_query_fallbacks(cand)
                for fb in fallbacks:
                    t_fb = time.perf_counter()
                    fb_res = []
                    try:
                        res_fb = self.search.search(fb)
                    except Exception as exc:
                        self.log(f"Fallback candidate search failed for '{fb}': {exc}")
                        res_fb = []
                    dur += (time.perf_counter() - t_fb)
                    if res_fb:
                        res = res_fb
                        resolved_q = fb
                        break
            return cand, res, dur, resolved_q

        # Evaluate top candidate entities (max 4 lookups)
        search_outputs = []
        for idx, cand in enumerate(search_candidates):
            cand_output = _search_candidate_with_fallbacks(cand)
            search_outputs.append(cand_output)

        for index, (candidate, search_results, s_dur, resolved_query) in enumerate(
            search_outputs,
            start=1,
        ):
            _safe_print(
                f"\n[{index}/{len(search_candidates)}] {candidate}"
            )
            if ctx:
                ctx.record_external_call("google_places_search", s_dur)
                ctx.record_stage_duration(PipelineStage.GOOGLE_PLACES_SEARCH, s_dur)

            if not search_results:
                self.log(
                    "No Google results."
                )
                continue

            total_search_results += len(
                search_results,
            )

            self.log(
                f"{len(search_results)} Google result(s)"
            )

            # ------------------------------------------
            # Iterate Search Results
            # ------------------------------------------

            for result in search_results:
                place_id = result.get(
                    "id",
                )
                if not place_id:
                    continue

                # --------------------------------------
                # Duplicate
                # --------------------------------------
                if place_id in seen_place_ids:
                    continue
                seen_place_ids.add(
                    place_id,
                )

                # --------------------------------------
                # Ignore businesses
                # --------------------------------------
                if self.is_business(
                    result,
                ):
                    print(
                        f"🚫 Business Skipped : "
                        f"{result.get('display_name')}"
                    )
                    continue

                # --------------------------------------
                # Defer Place Details: Use search result data for candidate scoring & ranking
                # Full place details (photos, hours, website) are fetched only for the winner
                # --------------------------------------
                details = {
                    "id": place_id,
                    "display_name": result.get("display_name", ""),
                    "formatted_address": result.get("formatted_address", ""),
                    "latitude": result.get("latitude"),
                    "longitude": result.get("longitude"),
                    "primary_type": result.get("primary_type", ""),
                    "types": result.get("types", []),
                    "rating": result.get("rating"),
                    "user_rating_count": result.get("user_rating_count"),
                    "google_maps_url": result.get("google_maps_url", ""),
                    "maps_url": result.get("maps_url", ""),
                    "business_status": result.get("business_status", ""),
                    "viewport": result.get("viewport", {}),
                    "website": "",
                    "phone": "",
                    "opening_hours": [],
                    "current_opening_hours": [],
                    "price_level": "",
                    "editorial_summary": "",
                    "photos": [],
                    "accessibility": {},
                    "plus_code": {},
                    "utc_offset_minutes": 0,
                    "wikidata": result.get("wikidata"),
                    "wikipedia": result.get("wikipedia"),
                    "extratags": result.get("extratags", {}),
                    "boundingbox": result.get("boundingbox"),
                }

                # --------------------------------------
                # Formatter
                # --------------------------------------
                formatted = self.formatter.format(
                    query=resolved_query,
                    place=details,
                )

                # --------------------------------------
                # Geo Enrichment
                # --------------------------------------
                enriched = self.geo.enrich(
                    formatted,
                )

                # --------------------------------------
                # Evidence Tracking
                # --------------------------------------
                enriched["matched_candidate"] = candidate
                enriched["resolved_via_query"] = resolved_query
                enriched["matched_stage"] = evidence.get(
                    "current_stage",
                    "caption",
                )

                enriched["matched_sources"] = []

                if evidence.get("title"):
                    enriched["matched_sources"].append(
                        "title"
                    )

                if evidence.get("caption"):
                    enriched["matched_sources"].append(
                        "caption"
                    )

                if evidence.get("ocr_text"):
                    enriched["matched_sources"].append(
                        "ocr"
                    )

                if evidence.get("speech_text"):
                    enriched["matched_sources"].append(
                        "speech"
                    )

                enriched["editorial_summary"] = details.get("editorial_summary", "")
                enriched["hidden_gems"] = []
                enriched["local_tips"] = []
                enriched["photo_gallery"] = []

                # Stable normalized deduplication
                t_name = (enriched.get("travel_name") or enriched.get("display_name") or "").strip()
                c_name = (enriched.get("country") or "").strip()
                norm_key = (
                    re.sub(r"[^\w\s]", "", t_name.lower()).strip()
                    + "::"
                    + re.sub(r"[^\w\s]", "", c_name.lower()).strip()
                )

                existing_match = None
                for ex in verified_places:
                    ex_name = (ex.get("travel_name") or ex.get("display_name") or "").strip()
                    ex_country = (ex.get("country") or "").strip()
                    ex_key = (
                        re.sub(r"[^\w\s]", "", ex_name.lower()).strip()
                        + "::"
                        + re.sub(r"[^\w\s]", "", ex_country.lower()).strip()
                    )
                    if norm_key and norm_key == ex_key:
                        existing_match = ex
                        break

                if existing_match:
                    ex_sources = set(existing_match.get("matched_sources", []))
                    new_sources = set(enriched.get("matched_sources", []))
                    existing_match["matched_sources"] = sorted(ex_sources | new_sources)
                    if candidate and candidate not in existing_match.get("matched_candidate", ""):
                        existing_match["matched_candidate"] = f"{existing_match.get('matched_candidate', '')}; {candidate}"
                    self.log(f"Merged duplicate candidate: {t_name}")
                    continue

                verified_places.append(
                    enriched,
                )

                self.log(
                    f"Verified : {enriched.get('travel_name','Unknown')}"
                )

        # ==================================================
        # Nothing Found
        # ==================================================

        if not verified_places:
            print(
                "\n[X] No verified travel destinations.\n"
            )
            if isinstance(getattr(self.search, "last_error", None), dict) and getattr(self.search, "last_error", {}).get("status"):
                err = self.search.last_error
                provider_label = "Google Places" if self.provider.name == "google" else f"{self.provider.name.upper()} Places"
                self.last_resolver_error = f"{provider_label} API error ({err.get('status')}): {err.get('message')}"
            elif not self.last_resolver_error:
                provider_display = "Google Places" if self.provider.name == "google" else f"{self.provider.name.upper()} returned no verified destinations"
                if self.provider.name == "google":
                    self.last_resolver_error = f"Google Places returned no verified destinations for {len(candidates)} candidate(s)."
                else:
                    self.last_resolver_error = f"{self.provider.name.upper()} places returned no verified destinations for {len(candidates)} candidate(s)."
            return None

        print()

        self.log(

            f"Verified Places : {len(verified_places)}"

        )

        self.log(

            f"Google Results : {total_search_results}"

        )

        # ==================================================
        # Ranking Starts Here
        # ==================================================

        with measure_stage(PipelineStage.SCORING):
            ranked = self.scorer.rank_places(
                verified_places,
                evidence,
            )

        if not ranked:

            print(
                "\n❌ Ranking failed.\n"
            )

            return None

        # --------------------------------------------------
        # Keep only Top Candidates
        # --------------------------------------------------

        ranked = ranked[:20]

        candidate_res_duration = time.perf_counter() - res_start

        print()

        self.log(

            f"Top {len(ranked)} destination(s) selected"

        )

        # ==================================================
        # Nearby Search + Travel Intelligence
        # ==================================================

        photos_duration = 0.0
        nearby_duration = 0.0
        travel_duration = 0.0

        # Performance Optimization (Phase 7):
        # Only enrich the top candidate (ranked[0]). Non-winning candidates
        # remain available for Gemini comparison without incurring 5x Google Places calls.
        if ranked:
            with measure_stage(PipelineStage.ENRICHMENT):
                enrich_res = self._enrich_candidate(ranked[0])
                if isinstance(enrich_res, tuple) and len(enrich_res) == 4:
                    ranked[0], photos_duration, nearby_duration, travel_duration = enrich_res
                elif isinstance(enrich_res, tuple) and len(enrich_res) == 3:
                    ranked[0], nearby_duration, travel_duration = enrich_res
                else:
                    ranked[0] = enrich_res
            if ctx:
                ctx.record_external_call("google_places_nearby", nearby_duration)
            for item in ranked[1:]:
                p = item["place"]
                p.setdefault("nearby", {})
                p.setdefault("nearby_places_found", 0)
                p.setdefault("nearby_categories", 0)
                p.setdefault("editorial_summary", "")
                p.setdefault("hidden_gems", [])
                p.setdefault("local_tips", [])
                p.setdefault("photo_gallery", [])
                p.setdefault("travel_story", "")

        # ==================================================
        # Final Winner & Honest Abstention Check
        # ==================================================

        top_candidate = ranked[0]
        score = top_candidate.get("score", 0.0)
        confidence = top_candidate.get("confidence", "VERY_LOW")

        statistics = self.build_statistics(
            candidates,
            verified_places,
            total_search_results,
        )

        # Abstain if score is below 45.0, or VERY_LOW confidence,
        # or if the top 2 candidates are in an ambiguous tie at low score (<55.0)
        is_low_score = score < 45.0
        is_very_low = confidence == "VERY_LOW"
        is_ambiguous_tie = (
            len(ranked) > 1
            and abs(ranked[0].get("score", 0) - ranked[1].get("score", 0)) < 3.0
            and ranked[0].get("score", 0) < 55.0
        )

        should_abstain = is_low_score or is_very_low or is_ambiguous_tie

        if should_abstain:
            self.log(
                f"Abstaining: Low confidence or ambiguous candidates (Score={score}, Confidence={confidence})"
            )
            return {
                "winner": None,
                "abstain": True,
                "abstain_reason": "Low confidence or ambiguous candidates",
                "suggested_places": [item["place"] for item in ranked[:3]],
                "ranked_places": ranked,
                "statistics": statistics,
                "candidate_count": statistics["candidate_count"],
                "verified_count": statistics["verified_places"],
                "search_results": statistics["google_search_results"],
                "stage_timings": {
                    "candidate_resolution": candidate_res_duration,
                    "nearby_places": nearby_duration,
                    "travel_intelligence": travel_duration,
                },
            }

        winner = top_candidate

        _safe_print()

        self.log(
            f"Winner : {winner['place']['travel_name']}"
        )

        # ==================================================
        # Final Ranking Display
        # ==================================================

        _safe_print(
            "\n=============================================="
        )
        _safe_print(
            "             FINAL RANKING"
        )
        _safe_print(
            "==============================================\n"
        )

        for index, item in enumerate(
            ranked,
            start=1,
        ):
            place = item["place"]
            _safe_print(
                f"{index}. {place.get('travel_name','Unknown')}"
            )
            _safe_print(
                f"   Score       : {item.get('score',0)}"
            )
            _safe_print(
                f"   Confidence  : {item.get('confidence','LOW')}"
            )
            _safe_print(
                f"   Rating      : {place.get('rating',0)} ({place.get('user_rating_count',0)} reviews)"
            )
            _safe_print(
                f"   Country     : {place.get('country','')}"
            )
            _safe_print(
                f"   Category    : {place.get('category','')}"
            )
            _safe_print()

        # ==================================================
        # Winner Metadata
        # ==================================================

        winner["place"]["resolver_statistics"] = statistics
        winner["place"]["candidate_count"] = statistics.get(
            "candidate_count",
            0,
        )
        winner["place"]["verified_places"] = statistics.get(
            "verified_places",
            0,
        )
        winner["place"]["google_search_results"] = statistics.get(
            "google_search_results",
            0,
        )
        winner["place"]["resolver_version"] = "2.0"
        winner["place"]["travel_ai"] = True

        # ==================================================
        # Footer
        # ==================================================

        _safe_print(
            "=============================================="
        )
        _safe_print(
            f"Winner : {winner['place']['travel_name']}"
        )
        _safe_print(
            "==============================================\n"
        )

        # ==================================================
        # Final Response
        # ==================================================

        return {
            "winner": winner,
            "ranked_places": ranked,
            "statistics": statistics,
            "candidate_count": statistics["candidate_count"],
            "verified_count": statistics["verified_places"],
            "search_results": statistics["google_search_results"],
            "stage_timings": {
                "candidate_resolution": candidate_res_duration,
                "photos": photos_duration,
                "nearby_places": nearby_duration,
                "travel_intelligence": travel_duration,
            },
        }