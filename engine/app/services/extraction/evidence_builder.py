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
    # Caption Evidence
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
                "hashtags",
            )
            or metadata.get(
                "tags",
            )
            or [],

            "creator": metadata.get(
                "creator",
                "",
            ),

            "location": metadata.get(
                "location",
                "",
            ),

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

            # Runtime

            "frames": [],

        }

    # ==================================================
    # OCR
    # ==================================================

    def build_ocr(
        self,
        evidence: dict,
        frame_paths: list,
    ):

        start = time.perf_counter()

        results = []

        aggregated = None

        print(
            "\n========== OCR ==========\n"
        )

        for index, frame in enumerate(
            frame_paths,
            start=1,
        ):

            detections = self.ocr.extract_text(
                frame,
            )

            if detections:

                results.append(
                    detections,
                )

            aggregated = self.ocr_aggregator.aggregate(
                results,
            )

            print(

                f"Frame {index}"

                f" | {aggregated['quality']}"

                f" | {aggregated['confidence']}"

            )

            if aggregated.get(
                "should_stop",
            ):

                print(
                    "✅ OCR Early Stop"
                )

                break

        if aggregated is None:

            aggregated = {

                "text": "",
                "confidence": 0,
                "quality": "NONE",
                "detections": [],
                "frames_used": 0,
                "unique_detections": 0,
                "high_confidence_detections": 0,

            }

        evidence["frames"] = frame_paths

        evidence["ocr_text"] = aggregated["text"]

        evidence["ocr_confidence"] = aggregated["confidence"]

        evidence["ocr_quality"] = aggregated["quality"]

        evidence["ocr_detections"] = aggregated["detections"]

        evidence["ocr_frames_used"] = aggregated["frames_used"]

        evidence["ocr_unique_detections"] = aggregated["unique_detections"]

        evidence["ocr_high_confidence"] = aggregated["high_confidence_detections"]

        print(

            f"📝 OCR Finished in "

            f"{time.perf_counter()-start:.2f}s"

        )

        return evidence

    # ==================================================
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

        cleaned = self.speech_cleaner.clean_segments(
            raw["segments"],
        )

        aggregated = self.speech_aggregator.aggregate(
            cleaned,
        )

        evidence["speech_text"] = aggregated["text"]

        evidence["speech_confidence"] = aggregated["confidence"]

        evidence["speech_quality"] = aggregated["quality"]

        evidence["speech_segments"] = aggregated["segments"]

        evidence["speech_segment_count"] = aggregated["segment_count"]

        evidence["speech_high_confidence"] = aggregated["high_confidence_segments"]

        print(

            f"🎤 Speech Finished in "

            f"{time.perf_counter()-start:.2f}s"

        )

        return evidence

    # ==================================================
    # Combine Evidence
    # ==================================================

    def combine(
        self,
        evidence: dict,
    ):

        combined = []

        weights = {}

        def add(name, text):

            if not text:
                return

            text = str(text).strip()

            if not text:
                return

            combined.append(text)

            weights[name] = len(text)

        add(
            "title",
            evidence.get("title"),
        )

        add(
            "caption",
            evidence.get("caption"),
        )

        hashtags = " ".join(
            evidence.get(
                "hashtags",
                [],
            )
        )

        add(
            "hashtags",
            hashtags,
        )

        add(
            "ocr",
            evidence.get(
                "ocr_text",
            ),
        )

        add(
            "speech",
            evidence.get(
                "speech_text",
            ),
        )

        evidence["combined_text"] = "\n".join(
            combined,
        )

        evidence["evidence_weights"] = weights

        evidence["evidence_score"] = (

            evidence.get(
                "ocr_confidence",
                0,
            )

            +

            evidence.get(
                "speech_confidence",
                0,
            )

        ) / 2

        print(
            "\n========== EVIDENCE =========="
        )

        print(
            f"Combined Length : {len(evidence['combined_text'])}"
        )

        print(
            f"Evidence Score  : {round(evidence['evidence_score'],2)}"
        )

        print(
            "==============================\n"
        )

        return evidence