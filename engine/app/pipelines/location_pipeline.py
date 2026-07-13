from engine.app.services.extraction.evidence_builder import EvidenceBuilder
from engine.app.services.extraction.candidate_extractor import CandidateExtractor
from engine.app.services.scoring.scoring_service import ScoringService
from engine.app.services.extraction.frame_extractor import FrameExtractor


class LocationPipeline:

    def __init__(self):
        self.evidence_builder = EvidenceBuilder()
        self.extractor = CandidateExtractor()
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

        candidates = self.extractor.extract(
            evidence["combined_text"]
        )

        ranked = self.scorer.rank(
            candidates,
            evidence,
        )

        return {
            "evidence": evidence,
            "candidates": candidates,
            "ranked_candidates": ranked,
            "best_guess": ranked[0] if ranked else None,
        }