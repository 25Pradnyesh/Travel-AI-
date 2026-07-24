from engine.app.services.location.candidate_service import CandidateService
from engine.app.services.location.location_formatter import LocationFormatter
from engine.app.services.location.geo_enrichment_service import GeoEnrichmentService
from engine.app.services.maps.google_places_service import GooglePlacesService


class LocationResolver:

    def __init__(self):

        self.candidates = CandidateService()

        self.places = GooglePlacesService()

        self.formatter = LocationFormatter()

        self.geo = GeoEnrichmentService()

    def resolve(
        self,
        evidence: dict,
    ):

        candidates = self.candidates.generate(
            metadata=evidence["metadata"],
            ocr_text=evidence["ocr_text"],
        )

        verified = []

        for candidate in candidates:

            places = self.places.search(candidate)

            if not places:
                continue

            formatted_place = self.formatter.format(
                query=candidate,
                place=places[0],
            )

            enriched_place = self.geo.enrich(
                formatted_place,
            )

            if len(places) == 1:

                print(
                    f"✅ High confidence from '{candidate}'"
                )

                return [
                    {
                        "query": candidate,
                        "place": enriched_place,
                        "confidence": "HIGH",
                    }
                ]

            verified.append(
                {
                    "query": candidate,
                    "place": enriched_place,
                    "confidence": "MEDIUM",
                }
            )

        return verified