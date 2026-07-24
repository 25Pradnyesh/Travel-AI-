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
}


class LocationResolver:

    def __init__(self):

        self.candidates = CandidateService()
        self.places = GooglePlacesService()
        self.formatter = LocationFormatter()
        self.geo = GeoEnrichmentService()
        self.scorer = ScoringService()

    def resolve(
        self,
        evidence: dict,
    ):

        candidates = self.candidates.generate(
            metadata=evidence["metadata"],
            ocr_text=evidence["ocr_text"],
        )

        verified_places = []

        seen_place_ids = set()

        print("\n========== LOCATION RESOLVER ==========")

        # ----------------------------------------
        # Search every candidate
        # ----------------------------------------

        for candidate in candidates:

            google_results = self.places.search(
                candidate,
            )

            if not google_results:
                continue

            print(
                f"🔍 '{candidate}' → {len(google_results)} result(s)"
            )

            for google_place in google_results:

                place_id = google_place.get(
                    "id",
                )

                if place_id in seen_place_ids:
                    continue

                seen_place_ids.add(
                    place_id,
                )

                # ----------------------------------------
                # Reject obvious businesses
                # ----------------------------------------

                primary_type = (
                    google_place.get(
                        "primary_type",
                        ""
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

                if (
                    primary_type in BUSINESS_TYPES
                    or any(
                        t in BUSINESS_TYPES
                        for t in types
                    )
                ):

                    print(
                        f"🚫 Ignoring business: "
                        f"{google_place.get('display_name')}"
                    )

                    continue

                formatted_place = self.formatter.format(
                    query=candidate,
                    place=google_place,
                )

                enriched_place = self.geo.enrich(
                    formatted_place,
                )

                verified_places.append(
                    enriched_place,
                )

        # ----------------------------------------
        # Nothing found
        # ----------------------------------------

        if not verified_places:

            print(
                "❌ No verified locations.\n"
            )

            return []

        # ----------------------------------------
        # Rank everything
        # ----------------------------------------

        ranked = self.scorer.rank_places(
            verified_places,
            evidence,
        )

        if not ranked:
            return []

        winner = ranked[0]

        # ----------------------------------------
        # Reject weak winner
        # ----------------------------------------

        if winner["confidence"] == "LOW":

            print(
                "⚠️ No reliable location found."
            )

            return []

        top_results = ranked[:3]

        print("\n========== TOP MATCHES ==========")

        for i, result in enumerate(
            top_results,
            start=1,
        ):

            place = result["place"]

            print(
                f"{i}. "
                f"{place['travel_name']} | "
                f"Score={result['score']} | "
                f"{result['confidence']}"
            )

        print(
            "=================================\n"
        )

        alternatives = []

        for result in top_results[1:]:

            alternatives.append(
                {
                    "place": result["place"],
                    "score": result["score"],
                    "confidence": result["confidence"],
                }
            )

        return [
            {
                "query": winner["place"][
                    "verified_query"
                ],
                "place": winner["place"],
                "score": winner["score"],
                "confidence": winner["confidence"],
                "alternatives": alternatives,
            }
        ]