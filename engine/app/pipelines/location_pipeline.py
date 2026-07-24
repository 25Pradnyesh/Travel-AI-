import time

from engine.app.services.extraction.evidence_builder import EvidenceBuilder
from engine.app.services.extraction.frame_extractor import FrameExtractor
from engine.app.services.location.location_resolver import LocationResolver


class LocationPipeline:

    def __init__(self):

        self.builder = EvidenceBuilder()
        self.resolver = LocationResolver()
        self.frames = FrameExtractor()

    def _build_response(
        self,
        stage: str,
        evidence: dict,
        verified: list,
        total_start: float,
    ):

        best = verified[0] if verified else None

        ranked = []

        if best:

            ranked.append(
                {
                    "place": best["place"],
                    "score": best["score"],
                    "confidence": best["confidence"],
                }
            )

            for alternative in best.get(
                "alternatives",
                [],
            ):

                ranked.append(
                    {
                        "place": alternative,
                        "score": None,
                        "confidence": "ALTERNATIVE",
                    }
                )

        return {
            "stage": stage,
            "evidence": evidence,
            "verified_places": verified,
            "ranked_candidates": ranked,
            "best_guess": best,
            "performance": {
                "total": round(
                    time.perf_counter() - total_start,
                    2,
                )
            },
        }

    def run(
        self,
        metadata: dict,
        video_path: str,
    ):

        total_start = time.perf_counter()

        # ====================================================
        # STAGE 1
        # Caption
        # ====================================================

        print("\n🚀 Stage 1 : Caption")

        evidence = self.builder.build_caption(
            metadata,
        )

        evidence = self.builder.combine(
            evidence,
        )

        verified = self.resolver.resolve(
            evidence,
        )

        if verified:

            if verified[0]["confidence"] in (
                "HIGH",
                "MEDIUM",
            ):

                print(
                    "✅ Caption resolved location."
                )

                return self._build_response(
                    "caption",
                    evidence,
                    verified,
                    total_start,
                )

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
            evidence,
        )

        verified = self.resolver.resolve(
            evidence,
        )

        if verified:

            if verified[0]["confidence"] in (
                "HIGH",
                "MEDIUM",
            ):

                print(
                    "✅ OCR resolved location."
                )

                return self._build_response(
                    "ocr",
                    evidence,
                    verified,
                    total_start,
                )

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
            evidence,
        )

        verified = self.resolver.resolve(
            evidence,
        )

        print(
            "✅ Speech pipeline finished."
        )

        return self._build_response(
            "speech",
            evidence,
            verified,
            total_start,
        )