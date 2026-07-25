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
        self.places = GooglePlacesService()
        self.formatter = LocationFormatter()
        self.geo = GeoEnrichmentService()
        self.scorer = ScoringService()

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

        seen_ids = set()

        # ------------------------------------------
        # Google Verification
        # ------------------------------------------

        for candidate in candidates:

            results = self.places.search(
                candidate,
            )

            if not results:
                continue

            print(
                f"🔍 {candidate} -> {len(results)} result(s)"
            )

            for google_place in results:

                place_id = google_place.get(
                    "id"
                )

                if not place_id:
                    continue

                if place_id in seen_ids:
                    continue

                seen_ids.add(
                    place_id
                )

                primary_type = (
                    google_place.get(
                        "primary_type",
                        "",
                    ).lower()
                )

                types = [

                    t.lower()

                    for t in google_place.get(
                        "types",
                        [],
                    )

                ]

                if (
                    primary_type
                    in BUSINESS_TYPES
                    or any(
                        t in BUSINESS_TYPES
                        for t in types
                    )
                ):

                    print(
                        f"🚫 Business skipped: "
                        f"{google_place.get('display_name')}"
                    )

                    continue

                formatted = self.formatter.format(
                    query=candidate,
                    place=google_place,
                )

                enriched = self.geo.enrich(
                    formatted,
                )

                verified_places.append(
                    enriched
                )

        # ------------------------------------------
        # Nothing Verified
        # ------------------------------------------

        if not verified_places:

            print(
                "\n❌ No verified places.\n"
            )

            return None

        # ------------------------------------------
        # Ranking
        # ------------------------------------------

        ranked = self.scorer.rank_places(
            verified_places,
            evidence,
        )

        if not ranked:

            return None

        ranked = ranked[:5]

        print(
            "\n========== RANKED RESULTS ==========\n"
        )

        for index, item in enumerate(
            ranked,
            start=1,
        ):

            place = item["place"]

            print(

                f"{index}. "

                f"{place['travel_name']}"

                f" | Score={item['score']}"

                f" | {item['confidence']}"

            )

        print(
            "\n====================================\n"
        )

        return {

            "ranked_places": ranked,

            "winner": ranked[0],

            "candidate_count": len(
                candidates,
            ),

            "verified_count": len(
                verified_places,
            ),

        }