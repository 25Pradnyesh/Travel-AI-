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


BUSINESS_TYPES = {

    "restaurant",
    "food",
    "cafe",
    "bar",
    "bakery",

    "lodging",
    "hotel",

    "store",
    "shopping_mall",
    "supermarket",

    "hospital",
    "school",
    "bank",

    "gas_station",

    "gym",

    "pharmacy",

    "car_dealer",

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

    # ==================================================
    # Logger
    # ==================================================

    def log(

        self,

        message: str,

    ):

        print(

            f"📍 {message}"

        )

    # ==================================================
    # Business Filter
    # ==================================================

    def is_business(

        self,

        place: dict,

    ):

        primary = (

            place.get(

                "primary_type",

                "",

            )

            .lower()

        )

        types = [

            t.lower()

            for t in place.get(

                "types",

                [],

            )

        ]

        if primary in BUSINESS_TYPES:

            return True

        return any(

            t in BUSINESS_TYPES

            for t in types

        )

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
    # Resolve
    # ==================================================

    def resolve(

        self,

        evidence: dict,

    ):

        res_start = time.perf_counter()

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

            search_results = self.search.search(

                candidate,

            )

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
                # Details
                # --------------------------------------

                details = self.details.get_details(

                    place_id,

                )

                if not details:

                    continue

                # --------------------------------------
                # Formatter
                # --------------------------------------

                formatted = self.formatter.format(

                    query=candidate,

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

                enriched["editorial_summary"] = ""

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

        ranked = ranked[:5]

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