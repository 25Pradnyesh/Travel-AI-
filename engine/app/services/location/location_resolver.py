from engine.app.services.location.candidate_service import CandidateService
from engine.app.services.maps.google_places_service import GooglePlacesService


class LocationResolver:

    def __init__(self):

        self.candidates = CandidateService()
        self.places = GooglePlacesService()

    def resolve(self, evidence: dict):

        candidates = self.candidates.generate(
            metadata=evidence["metadata"],
            ocr_text=evidence["ocr_text"],
        )

        verified = []

        for candidate in candidates:

            places = self.places.search(candidate)

            if not places:
                continue

            # ---------------------------------------
            # Intelligent Early Exit
            # ---------------------------------------

            if len(places) == 1:

                print(
                    f"✅ High confidence from '{candidate}'"
                )

                return [
                    {
                        "query": candidate,
                        "place": places[0],
                        "confidence": "HIGH",
                    }
                ]

            # ---------------------------------------
            # Otherwise keep searching
            # ---------------------------------------

            verified.append(
                {
                    "query": candidate,
                    "place": places[0],
                    "confidence": "MEDIUM",
                }
            )

        return verified