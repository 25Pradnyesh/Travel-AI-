from engine.app.services.extraction.evidence_builder import EvidenceBuilder
from engine.app.services.scoring.scoring_service import ScoringService
from engine.app.services.extraction.frame_extractor import FrameExtractor
from engine.app.services.location.location_resolver import LocationResolver


class LocationPipeline:

    def __init__(self):

        self.evidence_builder = EvidenceBuilder()
        self.resolver = LocationResolver()
        self.scorer = ScoringService()
        self.frame_extractor = FrameExtractor()

    def run(
        self,
        metadata: dict,
        video_path: str,
    ):

        frame_paths = self.frame_extractor.extract(
            video_path=video_path,
            output_dir="engine/assets/frames",
        )

        evidence = self.evidence_builder.build(
            metadata,
            frame_paths,
        )

        verified_places = self.resolver.resolve(
            evidence
        )

        ranked = self.scorer.rank(
            [
                place["place"]["name"]
                for place in verified_places
            ],
            evidence,
        )

        return {
            "evidence": evidence,
            "verified_places": verified_places,
            "ranked_candidates": ranked,
            "best_guess": ranked[0] if ranked else None,
        }