import time

from engine.app.services.ocr.ocr_service import OCRService
from engine.app.services.ocr.ocr_aggregator import OCRAggregator

from engine.app.services.speech.speech_service import SpeechService
from engine.app.services.speech.speech_cleaner import SpeechCleaner
from engine.app.services.speech.speech_aggregator import SpeechAggregator


class EvidenceBuilder:

    def __init__(self):

        self.ocr = OCRService()

        self.ocr_aggregator = OCRAggregator()

        self.speech = SpeechService()

        self.speech_cleaner = SpeechCleaner()

        self.speech_aggregator = SpeechAggregator()

    # ==================================================
    # Stage 1
    # Caption
    # ==================================================

    def build_caption(
        self,
        metadata: dict,
    ):

        return {

            "provider": "instagram",

            "metadata": metadata,

            "title": metadata.get(
                "title",
                "",
            ),

            "caption": metadata.get(
                "caption",
                "",
            ),

            "hashtags": metadata.get(
                "tags"
            ) or [],

            # OCR

            "ocr_text": "",

            "ocr_confidence": 0.0,

            "ocr_quality": "NONE",

            "ocr_detections": [],

            # Speech

            "speech_text": "",

            "speech_confidence": 0.0,

            "speech_quality": "NONE",

            "speech_segments": [],

            # Misc

            "frames": [],

        }

    # ==================================================
    # Stage 2
    # OCR
    # ==================================================

    def build_ocr(
        self,
        evidence: dict,
        frame_paths: list[str],
    ):

        start = time.perf_counter()

        frame_results = []

        frames_processed = 0

        print("\n========== OCR ==========\n")

        aggregated = {

            "text": "",

            "confidence": 0.0,

            "quality": "NONE",

            "detections": [],

            "frames_used": 0,

            "unique_detections": 0,

            "high_confidence_detections": 0,

            "should_stop": False,

        }

        for index, frame in enumerate(
            frame_paths,
            start=1,
        ):

            detections = self.ocr.extract_text(
                frame,
            )

            frames_processed += 1

            if detections:

                frame_results.append(
                    detections,
                )

            aggregated = self.ocr_aggregator.aggregate(
                frame_results,
            )

            print(

                f"Frame {index}"

                f" | OCR={aggregated['confidence']}"

                f" | {aggregated['quality']}"

                f" | Unique={aggregated['unique_detections']}"

            )

            if aggregated["should_stop"]:

                print(
                    "\n✅ Early OCR stop.\n"
                )

                break

        evidence["frames"] = frame_paths[
            :frames_processed
        ]

        evidence["ocr_text"] = aggregated[
            "text"
        ]

        evidence["ocr_confidence"] = aggregated[
            "confidence"
        ]

        evidence["ocr_quality"] = aggregated[
            "quality"
        ]

        evidence["ocr_detections"] = aggregated[
            "detections"
        ]

        evidence["ocr_frames_used"] = aggregated[
            "frames_used"
        ]

        evidence["ocr_unique_detections"] = aggregated[
            "unique_detections"
        ]

        evidence["ocr_high_confidence"] = aggregated[
            "high_confidence_detections"
        ]

        print(
            f"📝 OCR : {time.perf_counter()-start:.2f}s"
        )

        return evidence

    # ==================================================
    # Stage 3
    # Speech
    # ==================================================

    def build_speech(
        self,
        evidence: dict,
        video_path: str,
    ):

        start = time.perf_counter()

        raw = self.speech.extract(
            video_path,
        )

        cleaned_segments = (
            self.speech_cleaner.clean_segments(
                raw["segments"],
            )
        )

        aggregated = (
            self.speech_aggregator.aggregate(
                cleaned_segments,
            )
        )

        evidence["speech_text"] = aggregated[
            "text"
        ]

        evidence["speech_confidence"] = aggregated[
            "confidence"
        ]

        evidence["speech_quality"] = aggregated[
            "quality"
        ]

        evidence["speech_segments"] = aggregated[
            "segments"
        ]

        evidence["speech_segment_count"] = aggregated[
            "segment_count"
        ]

        evidence["speech_high_confidence"] = aggregated[
            "high_confidence_segments"
        ]

        print(
            f"🎤 Speech : {time.perf_counter()-start:.2f}s"
        )

        print(
            f"🎯 Speech Confidence : {aggregated['confidence']}"
        )

        print(
            f"⭐ Speech Quality : {aggregated['quality']}"
        )

        return evidence

    # ==================================================
    # Final Merge
    # ==================================================

    def combine(
        self,
        evidence: dict,
    ):

        combined_text = "\n".join(

            filter(

                None,

                [

                    evidence.get(
                        "title",
                        "",
                    ),

                    evidence.get(
                        "caption",
                        "",
                    ),

                    " ".join(
                        evidence.get(
                            "hashtags",
                            [],
                        )
                    ),

                    evidence.get(
                        "ocr_text",
                        "",
                    ),

                    evidence.get(
                        "speech_text",
                        "",
                    ),

                ],

            )

        )

        evidence["combined_text"] = combined_text

        return evidence