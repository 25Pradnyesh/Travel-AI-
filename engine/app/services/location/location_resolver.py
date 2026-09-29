import logging
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
}


class LocationResolver:

    def __init__(self):

        self.candidates = CandidateService()
        self.search = GooglePlacesService()
        self.details = GooglePlaceDetailsService()
        self.nearby = NearbySearchService()
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
        print(f"📍 {message}")

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
        Enriches a single candidate with nearby places and travel intelligence.
        Returns: (enriched_item, nearby_duration_seconds, travel_duration_seconds)
        """
        place = item["place"]
        latitude = place.get("latitude")
        longitude = place.get("longitude")

        # ------------------------------------------
        # Nearby Search
        # ------------------------------------------
        t_nb_start = time.perf_counter()
        nearby = self.nearby.search(
            latitude,
            longitude,
        ) or {}
        nearby_duration = time.perf_counter() - t_nb_start

        place = self.attach_nearby(
            place,
            nearby,
        )

        must_visit = nearby.get("must_visit", [])
        food = nearby.get("food", [])
        stay = nearby.get("stay", [])
        transport = nearby.get("transport", [])
        shopping = nearby.get("shopping", [])
        nature = nearby.get("nature", [])

        place["featured_attraction"] = must_visit[0] if must_visit else None
        place["recommended_restaurant"] = food[0] if food else None
        place["recommended_hotel"] = stay[0] if stay else None
        place["nearest_transport"] = transport[0] if transport else None

        stats = nearby.get("statistics", {})
        place["nearby_places_found"] = stats.get("places_found", 0)
        place["nearby_categories"] = stats.get("categories", 0)

        # ------------------------------------------
        # AI Travel Intelligence
        # ------------------------------------------
        t_tr_start = time.perf_counter()
        place = self.travel.enrich(place)
        travel_duration = time.perf_counter() - t_tr_start

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

        # 2. Multi-segment comma relaxation for 3+ segments
        # E.g. "The Fulling Mill, Alresford, Hampshire" -> "The Fulling Mill, Hampshire", "The Fulling Mill, Alresford"
        parts = [p.strip() for p in query.split(",") if p.strip()]
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

        self.last_attempted_candidates = list(candidates)

        print(
            "\n========================================"
        )
        print(
            "      LOCATION RESOLVER STARTED"
        )
        print(
            "========================================\n"
        )

        self.log(
            f"Generated {len(candidates)} search candidate(s)"
        )

        if not candidates:
            self.last_resolver_error = "No location candidates generated from evidence."
            print(
                "❌ No candidates generated.\n"
            )
            return None

        verified_places = []
        seen_place_ids = set()
        total_search_results = 0

        # ==================================================
        # Candidate Search Loop
        # ==================================================

        for index, candidate in enumerate(
            candidates,
            start=1,
        ):
            print(
                f"\n[{index}/{len(candidates)}] {candidate}"
            )

            search_results = self.search.search(candidate)
            resolved_query = candidate

            # Zero-result fallback via deterministic query relaxation
            if not search_results:
                fallbacks = self._generate_query_fallbacks(candidate)
                for fb in fallbacks:
                    self.log(f"Zero results for '{candidate}'. Trying relaxed query: '{fb}'")
                    fb_results = self.search.search(fb)
                    if fb_results:
                        search_results = fb_results
                        resolved_query = fb
                        self.log(f"Relaxed query '{fb}' succeeded with {len(fb_results)} result(s).")
                        break

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
                # Details with graceful search fallback
                # --------------------------------------
                details = self.details.get_details(
                    place_id,
                )
                if not details:
                    self.log(
                        f"Place Details unavailable for '{result.get('display_name')}' ({place_id}); using search result data."
                    )
                    details = {
                        "id": place_id,
                        "display_name": result.get("display_name", ""),
                        "formatted_address": result.get("formatted_address", ""),
                        "latitude": result.get("latitude"),
                        "longitude": result.get("longitude"),
                        "primary_type": result.get("primary_type", ""),
                        "types": result.get("types", []),
                        "rating": result.get("rating", 0.0),
                        "user_rating_count": result.get("user_rating_count", 0),
                        "google_maps_url": result.get("google_maps_url", ""),
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
                "\n❌ No verified travel destinations.\n"
            )
            if getattr(self.search, "last_error", None):
                err = self.search.last_error
                self.last_resolver_error = f"Google Places API error ({err.get('status')}): {err.get('message')}"
            else:
                self.last_resolver_error = f"Google Places returned no verified destinations for {len(candidates)} candidate(s)."
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

        nearby_duration = 0.0
        travel_duration = 0.0

        # Performance Optimization (Phase 7):
        # Only enrich the top candidate (ranked[0]). Non-winning candidates
        # remain available for Gemini comparison without incurring 5x Google Places calls.
        if ranked:
            ranked[0], nearby_duration, travel_duration = self._enrich_candidate(ranked[0])
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
        # Final Winner
        # ==================================================

        winner = ranked[0]

        print()

        self.log(

            f"Winner : {winner['place']['travel_name']}"

        )

        # ==================================================
        # Final Logging Starts Here
        # ==================================================

        # ==================================================
        # Final Ranking
        # ==================================================

        print(
            "\n=============================================="
        )

        print(
            "             FINAL RANKING"
        )

        print(
            "==============================================\n"
        )

        for index, item in enumerate(

            ranked,

            start=1,

        ):

            place = item["place"]

            print(

                f"{index}. "

                f"{place.get('travel_name','Unknown')}"

            )

            print(

                f"   Score       : {item.get('score',0)}"

            )

            print(

                f"   Confidence  : {item.get('confidence','LOW')}"

            )

            print(

                f"   Rating      : "

                f"{place.get('rating',0)} "

                f"({place.get('user_rating_count',0)} reviews)"

            )

            print(

                f"   Country     : "

                f"{place.get('country','')}"

            )

            print(

                f"   Category    : "

                f"{place.get('category','')}"

            )

            print()

        # ==================================================
        # Resolver Statistics
        # ==================================================

        statistics = self.build_statistics(

            candidates,

            verified_places,

            total_search_results,

        )

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

        print(

            "=============================================="

        )

        print(

            f"Winner : {winner['place']['travel_name']}"

        )

        print(

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
                "nearby_places": nearby_duration,
                "travel_intelligence": travel_duration,
            },

        }