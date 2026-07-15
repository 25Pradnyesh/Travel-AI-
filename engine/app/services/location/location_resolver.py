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

            place = self.places.search(candidate)

            if place:
                verified.append({
                    "query": candidate,
                    "place": place,
                })

        return verified