from engine.app.services.extraction.evidence_builder import EvidenceBuilder
from engine.app.services.extraction.candidate_extractor import CandidateExtractor
from engine.app.services.scoring.scoring_service import ScoringService


class LocationPipeline:

    def __init__(self):
        self.evidence_builder = EvidenceBuilder()
        self.extractor = CandidateExtractor()
        self.scorer = ScoringService()

    def run(self, metadata: dict):

        evidence = self.evidence_builder.build(metadata)

        candidates = self.extractor.extract(
            evidence["combined_text"]
        )

        ranked = self.scorer.rank(
            candidates,
            metadata
        )

        return {
            "evidence": evidence,
            "candidates": candidates,
            "ranked_candidates": ranked,
            "best_guess": ranked[0] if ranked else None,
        }