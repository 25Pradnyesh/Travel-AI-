import time
from pathlib import Path

from engine.app.services.extraction.evidence_builder import (
    EvidenceBuilder,
)
from engine.app.services.extraction.frame_extractor import (
    FrameExtractor,
)
from engine.app.services.gemini.gemini_verifier import (
    GeminiVerifier,
)
from engine.app.services.location.location_resolver import (
    LocationResolver,
)


class LocationPipeline:

    def __init__(self):

        self.builder = EvidenceBuilder()

        self.frames = FrameExtractor()

        self.resolver = LocationResolver()

        self.gemini = GeminiVerifier()

    # ==================================================
    # Final Response
    # ==================================================

    def build_response(
        self,
        stage,
        evidence,
        resolver_result,
        gemini_result,
        total_start,
    ):

        winner = resolver_result["winner"]

        ranked = resolver_result["ranked_places"]

        gemini_used = False
        gemini_reason = ""
        gemini_confidence = None
        vision = None

        if gemini_result:

            gemini_used = True

            if gemini_result.get("winner"):

                winner = gemini_result["winner"]

            gemini_reason = gemini_result.get(
                "reason",
                "",
            )

            gemini_confidence = gemini_result.get(
                "confidence",
            )

            vision = gemini_result.get(
                "vision",
            )

        return {

            "stage": stage,

            "best_guess": winner,

            "ranked_candidates": ranked,

            "evidence": evidence,

            "candidate_count": resolver_result.get(
                "candidate_count",
                0,
            ),

            "verified_places": resolver_result.get(
                "verified_count",
                0,
            ),

            "gemini": {

                "used": gemini_used,

                "confidence": gemini_confidence,

                "reason": gemini_reason,

                "vision": vision,

            },

            "performance": {

                "total_seconds": round(

                    time.perf_counter()
                    - total_start,

                    2,

                )

            },

        }

    # ==================================================
    # Gemini Decision
    # ==================================================

    def verify_if_needed(
        self,
        evidence,
        resolver_result,
        frame_paths,
    ):

        ranked = resolver_result[
            "ranked_places"
        ]

        if not self.gemini.should_verify(
            ranked,
        ):

            print(
                "\n⚡ Rule engine confident. Skipping Gemini.\n"
            )

            return None

        image = None

        if frame_paths:

            image = frame_paths[0]

        print(
            "\n🤖 Running Gemini...\n"
        )

        return self.gemini.verify(

            evidence=evidence,

            ranked_places=ranked,

            image_path=image,

        )

    # ==================================================
    # Pipeline
    # ==================================================

    def run(
        self,
        metadata,
        video_path,
    ):

        total_start = time.perf_counter()

        frame_paths = []

        # ==================================================
        # Caption
        # ==================================================

        print(
            "\n🚀 Stage 1 : Caption\n"
        )

        evidence = self.builder.build_caption(
            metadata,
        )

        evidence = self.builder.combine(
            evidence,
        )

        resolver = self.resolver.resolve(
            evidence,
        )

        if resolver:

            gemini = self.verify_if_needed(

                evidence,

                resolver,

                frame_paths,

            )

            return self.build_response(

                "caption",

                evidence,

                resolver,

                gemini,

                total_start,

            )

        # ==================================================
        # OCR
        # ==================================================

        print(
            "\n🚀 Stage 2 : OCR\n"
        )

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

        resolver = self.resolver.resolve(
            evidence,
        )

        if resolver:

            gemini = self.verify_if_needed(

                evidence,

                resolver,

                frame_paths,

            )

            return self.build_response(

                "ocr",

                evidence,

                resolver,

                gemini,

                total_start,

            )

        # ==================================================
        # Speech
        # ==================================================

        print(
            "\n🚀 Stage 3 : Speech\n"
        )

        evidence = self.builder.build_speech(

            evidence,

            video_path,

        )

        evidence = self.builder.combine(
            evidence,
        )

        resolver = self.resolver.resolve(
            evidence,
        )

        if not resolver:

            return {

                "stage": "speech",

                "best_guess": None,

                "ranked_candidates": [],

                "evidence": evidence,

                "gemini": {

                    "used": False,

                },

                "performance": {

                    "total_seconds": round(

                        time.perf_counter()
                        - total_start,

                        2,

                    )

                },

            }

        gemini = self.verify_if_needed(

            evidence,

            resolver,

            frame_paths,

        )

        return self.build_response(

            "speech",

            evidence,

            resolver,

            gemini,

            total_start,

        )