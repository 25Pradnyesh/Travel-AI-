import time

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

        total_start = time.perf_counter()

        # ===============================
        # Frame Extraction
        # ===============================

        start = time.perf_counter()

        frame_paths = self.frame_extractor.extract(
            video_path=video_path,
            output_dir="engine/assets/frames",
        )

        frame_time = time.perf_counter() - start

        # ===============================
        # Evidence Builder
        # ===============================

        start = time.perf_counter()

        evidence = self.evidence_builder.build(
            metadata=metadata,
            video_path=video_path,
            frame_paths=frame_paths,
        )

        evidence_time = time.perf_counter() - start

        # ===============================
        # Location Resolver
        # ===============================

        start = time.perf_counter()

        verified_places = self.resolver.resolve(
            evidence
        )

        resolver_time = time.perf_counter() - start

        # ===============================
        # Scoring
        # ===============================

        start = time.perf_counter()

        ranked = self.scorer.rank(
            [
                place["place"]["name"]
                for place in verified_places
            ],
            evidence,
        )

        score_time = time.perf_counter() - start

        # ===============================
        # Total Time
        # ===============================

        total_time = time.perf_counter() - total_start

        # ===============================
        # Performance Report
        # ===============================

        performance = {
            "frame_extraction": round(frame_time, 2),
            "evidence_builder": round(evidence_time, 2),
            "location_resolver": round(resolver_time, 2),
            "scoring": round(score_time, 2),
            "total": round(total_time, 2),
        }

        print("\n========== PIPELINE TIMINGS ==========")
        print(f"🎞️ Frame Extraction : {frame_time:.2f}s")
        print(f"📝 Evidence Builder : {evidence_time:.2f}s")
        print(f"📍 Location Resolver: {resolver_time:.2f}s")
        print(f"🏆 Scoring          : {score_time:.2f}s")
        print("--------------------------------------")
        print(f"⏱️ Total Pipeline   : {total_time:.2f}s")
        print("======================================\n")

        return {
            "evidence": evidence,
            "verified_places": verified_places,
            "ranked_candidates": ranked,
            "best_guess": ranked[0] if ranked else None,
            "performance": {
            **performance,
            "evidence_builder": evidence.get("performance", {})
            },
        }