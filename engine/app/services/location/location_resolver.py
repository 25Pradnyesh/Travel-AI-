from engine.app.services.location.candidate_service import CandidateService
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

        print("\n========== LOCATION RESOLVER ==========")

        # ----------------------------------------
        # Search every extracted candidate
        # ----------------------------------------

        for candidate in candidates:

            google_places = self.places.search(
                candidate,
            )

            if not google_places:
                continue

            print(
                f"🔍 '{candidate}' → {len(google_places)} Google result(s)"
            )

            # ----------------------------------------
            # Format + Enrich every Google result
            # ----------------------------------------

            for google_place in google_places:

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

            print("❌ No verified locations found.\n")

            return []

        # ----------------------------------------
        # Rank every verified place
        # ----------------------------------------

        ranked = self.scorer.rank_places(
            verified_places,
            evidence,
        )

        if not ranked:

            return []

        # ----------------------------------------
        # Keep Top 3
        # ----------------------------------------

        ranked = ranked[:3]

        winner = ranked[0]

        print("\n========== TOP MATCHES ==========")

        for index, item in enumerate(
            ranked,
            start=1,
        ):

            place = item["place"]

            print(
                f"{index}. "
                f"{place['travel_name']} | "
                f"Score: {item['score']} | "
                f"{item['confidence']}"
            )

        print("=======================================\n")

        # ----------------------------------------
        # Preserve alternatives with metadata
        # ----------------------------------------

        alternatives = []

        for item in ranked[1:]:

            alternatives.append(
                {
                    "place": item["place"],
                    "score": item["score"],
                    "confidence": item["confidence"],
                }
            )

        # ----------------------------------------
        # Final Result
        # ----------------------------------------

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