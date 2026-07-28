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
    "hospital",
    "school",
    "bank",
    "gas_station",
    "gym",
    "pharmacy",
    "supermarket",
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
            ).lower()
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
    # Resolve
    # ==================================================

    def resolve(
        self,
        evidence: dict,
    ):

        candidates = self.candidates.generate(

            metadata=evidence["metadata"],

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
            "\n========== LOCATION RESOLVER ==========\n"
        )

        print(
            f"🧠 Candidates : {len(candidates)}"
        )

        verified_places = []

        seen_place_ids = set()

        total_search_results = 0

        # ==================================================
        # Candidate Search
        # ==================================================

        for candidate in candidates:

            search_results = self.search.search(
                candidate,
            )

            if not search_results:
                continue

            total_search_results += len(
                search_results,
            )

            print(
                f"🔍 {candidate} → {len(search_results)} result(s)"
            )

            for result in search_results:

                place_id = result.get(
                    "id",
                )

                if not place_id:
                    continue

                if place_id in seen_place_ids:
                    continue

                seen_place_ids.add(
                    place_id,
                )

                if self.is_business(
                    result,
                ):

                    print(
                        f"🚫 Business skipped: "
                        f"{result.get('display_name')}"
                    )

                    continue

                details = self.details.get_details(
                    place_id,
                )

                if not details:
                    continue

                formatted = self.formatter.format(

                    query=candidate,

                    place=details,

                )

                enriched = self.geo.enrich(
                    formatted,
                )

                verified_places.append(
                    enriched,
                )

        # ==================================================
        # Nothing Found
        # ==================================================

        if not verified_places:

            print(
                "\n❌ No verified places.\n"
            )

            return None

        # ==================================================
        # Ranking
        # ==================================================

        ranked = self.scorer.rank_places(

            verified_places,

            evidence,

        )

        if not ranked:
            return None

        ranked = ranked[:5]

        winner = ranked[0]

        # ==================================================
        # Nearby Intelligence
        # ==================================================

        winner_place = winner["place"]

        latitude = winner_place.get(
            "latitude",
        )

        longitude = winner_place.get(
            "longitude",
        )

        nearby = self.nearby.search(

            latitude,

            longitude,

        )

        winner_place["nearby_landmarks"] = nearby.get(
            "landmarks",
            [],
        )

        winner_place["nearby_attractions"] = nearby.get(
            "viewpoints",
            [],
        )

        winner_place["nearby_airport"] = (

            nearby.get(
                "airports",
                [None],
            )[0]

            if nearby.get(
                "airports",
            )

            else None

        )

        winner_place["nearby_hotels"] = nearby.get(
            "hotels",
            [],
        )

        winner_place["nearby_restaurants"] = nearby.get(
            "restaurants",
            [],
        )

        winner_place["nearby_railway"] = (

            nearby.get(
                "railway",
                [None],
            )[0]

            if nearby.get(
                "railway",
            )

            else None

        )

        # ==================================================
        # Logging
        # ==================================================

        print(
            "\n========== FINAL RANKING ==========\n"
        )

        for index, item in enumerate(

            ranked,

            start=1,

        ):

            place = item["place"]

            print(

                f"{index}. "

                f"{place['travel_name']}"

                f" | {item['score']}"

                f" | {item['confidence']}"

                f" | ⭐ {place.get('rating',0)}"

                f" ({place.get('user_rating_count',0)})"

            )

        print(
            "\n===================================\n"
        )

        return {

            "winner": winner,

            "ranked_places": ranked,

            "candidate_count": len(
                candidates,
            ),

            "verified_count": len(
                verified_places,
            ),

            "search_results": total_search_results,

        }