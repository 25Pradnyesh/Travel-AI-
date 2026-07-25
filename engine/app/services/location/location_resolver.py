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
    # Resolve Location
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

        print("\n========== LOCATION RESOLVER ==========\n")

        print(
            f"🧠 Candidates Found : {len(candidates)}"
        )

        verified_places = []

        seen_place_ids = set()

        # ==========================================
        # Google Verification
        # ==========================================

        for candidate in candidates:

            google_results = self.places.search(
                candidate,
            )

            if not google_results:
                continue

            print(
                f"🔍 {candidate} -> {len(google_results)} Google result(s)"
            )

            for google_place in google_results:

                place_id = google_place.get(
                    "id"
                )

                if not place_id:
                    continue

                if place_id in seen_place_ids:
                    continue

                seen_place_ids.add(
                    place_id
                )

                primary_type = (

                    google_place.get(
                        "primary_type",
                        "",
                    )
                    .lower()

                )

                types = [

                    t.lower()

                    for t in google_place.get(
                        "types",
                        [],
                    )

                ]

                # ----------------------------------
                # Reject obvious businesses
                # ----------------------------------

                if (

                    primary_type in BUSINESS_TYPES

                    or

                    any(

                        t in BUSINESS_TYPES

                        for t in types

                    )

                ):

                    print(
                        f"🚫 Skipping business : "
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
                    enriched,
                )

        # ==========================================
        # Nothing verified
        # ==========================================

        if not verified_places:

            print(
                "\n❌ No verified locations.\n"
            )

            return []

        # ==========================================
        # Ranking
        # ==========================================

        ranked = self.scorer.rank_places(

            verified_places,

            evidence,

        )

        if not ranked:
            return []

        # Keep Top 5 internally
        top_results = ranked[:5]

        winner = top_results[0]

        # ==========================================
        # Confidence Gate
        # ==========================================

        if winner["score"] < 65:

            print(
                "\n⚠️ Confidence too low.\n"
            )

            return []

        print(
            "\n========== FINAL RANKING ==========\n"
        )

        for index, item in enumerate(

            top_results,

            start=1,

        ):

            place = item["place"]

            print(

                f"{index}. "

                f"{place['travel_name']}"

                f" | {item['score']}"

                f" | {item['confidence']}"

            )

        print(
            "\n===================================\n"
        )

        alternatives = []

        for item in top_results[1:]:

            alternatives.append(

                {

                    "place": item["place"],

                    "score": item["score"],

                    "raw_score": item["raw_score"],

                    "confidence": item["confidence"],

                }

            )

        # ==========================================
        # Final Output
        # ==========================================

        return [

            {

                "query": winner["place"][
                    "verified_query"
                ],

                "place": winner["place"],

                "score": winner["score"],

                "raw_score": winner["raw_score"],

                "confidence": winner["confidence"],

                "alternatives": alternatives,

                "candidate_count": len(
                    candidates,
                ),

                "verified_places": len(
                    verified_places,
                ),

            }

        ]