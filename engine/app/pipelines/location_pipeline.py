import time

from engine.app.services.extraction.evidence_builder import EvidenceBuilder
from engine.app.services.scoring.scoring_service import ScoringService
from engine.app.services.extraction.frame_extractor import FrameExtractor
from engine.app.services.location.location_resolver import LocationResolver


class LocationPipeline:

    def __init__(self):

        self.builder = EvidenceBuilder()
        self.resolver = LocationResolver()
        self.scorer = ScoringService()
        self.frames = FrameExtractor()

    def run(
        self,
        metadata: dict,
        video_path: str,
    ):

        total_start = time.perf_counter()

        # ====================================================
        # STAGE 1
        # Caption Only
        # ====================================================

        print("\n🚀 Stage 1 : Caption")

        evidence = self.builder.build_caption(
            metadata
        )

        evidence = self.builder.combine(
            evidence
        )

        verified = self.resolver.resolve(
            evidence
        )

        if verified:

            ranked = self.scorer.rank(
                [
                    place["place"]["name"]
                    for place in verified
                ],
                evidence,
            )

            if ranked and ranked[0]["score"] >= 80:

                print("✅ Caption resolved location.")

                return {
                    "stage": "caption",
                    "evidence": evidence,
                    "verified_places": verified,
                    "ranked_candidates": ranked,
                    "best_guess": ranked[0],
                    "performance": {
                        "total": round(
                            time.perf_counter() - total_start,
                            2,
                        )
                    },
                }

        # ====================================================
        # STAGE 2
        # OCR
        # ====================================================

        print("\n🚀 Stage 2 : OCR")

        frame_paths = self.frames.extract(
            video_path,
            "engine/assets/frames",
        )

        evidence = self.builder.build_ocr(
            evidence,
            frame_paths,
        )

        evidence = self.builder.combine(
            evidence
        )

        verified = self.resolver.resolve(
            evidence
        )

        if verified:

            ranked = self.scorer.rank(
                [
                    place["place"]["name"]
                    for place in verified
                ],
                evidence,
            )

            if ranked and ranked[0]["score"] >= 80:

                print("✅ OCR resolved location.")

                return {
                    "stage": "ocr",
                    "evidence": evidence,
                    "verified_places": verified,
                    "ranked_candidates": ranked,
                    "best_guess": ranked[0],
                    "performance": {
                        "total": round(
                            time.perf_counter() - total_start,
                            2,
                        )
                    },
                }

        # ====================================================
        # STAGE 3
        # Speech
        # ====================================================

        print("\n🚀 Stage 3 : Speech")

        evidence = self.builder.build_speech(
            evidence,
            video_path,
        )

        evidence = self.builder.combine(
            evidence
        )

        verified = self.resolver.resolve(
            evidence
        )

        ranked = self.scorer.rank(
            [
                place["place"]["name"]
                for place in verified
            ],
            evidence,
        )

        print("✅ Speech pipeline finished.")

        return {
            "stage": "speech",
            "evidence": evidence,
            "verified_places": verified,
            "ranked_candidates": ranked,
            "best_guess": ranked[0] if ranked else None,
            "performance": {
                "total": round(
                    time.perf_counter() - total_start,
                    2,
                )
            },
        }