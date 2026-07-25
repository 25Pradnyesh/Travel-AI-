import time

from engine.app.services.ocr.ocr_service import OCRService
from engine.app.services.ocr.ocr_aggregator import OCRAggregator
from engine.app.services.speech.speech_service import SpeechService


class EvidenceBuilder:

    def __init__(self):

        self.ocr = OCRService()

        self.aggregator = OCRAggregator()

        self.speech = SpeechService()

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

            "ocr_text": "",

            "ocr_confidence": 0.0,

            "ocr_quality": "NONE",

            "ocr_detections": [],

            "speech_text": "",

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

            aggregated = self.aggregator.aggregate(
                frame_results,
            )

            print(

                f"Frame {index}"

                f" | OCR Confidence: {aggregated['confidence']}"

                f" | Quality: {aggregated['quality']}"

                f" | Unique: {aggregated['unique_detections']}"

            )

            if aggregated["should_stop"]:

                print(
                    "\n✅ Early OCR stop triggered.\n"
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
            f"📝 OCR Time : {time.perf_counter()-start:.2f}s"
        )

        print(
            f"🎞 Frames Used : {frames_processed}/{len(frame_paths)}"
        )

        print(
            f"📄 Unique OCR : {aggregated['unique_detections']}"
        )

        print(
            f"🎯 OCR Confidence : {aggregated['confidence']}"
        )

        print(
            f"⭐ OCR Quality : {aggregated['quality']}"
        )

        print("\n=========================\n")

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

        evidence["speech_text"] = self.speech.extract(
            video_path,
        )

        print(
            f"🎤 Speech : {time.perf_counter()-start:.2f}s"
        )

        return evidence

    # ==================================================
    # Final
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