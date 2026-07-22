import time

from engine.app.services.extraction.ocr_service import OCRService
from engine.app.services.extraction.speech_service import SpeechService


class EvidenceBuilder:

    def __init__(self):

        self.ocr = OCRService()
        self.speech = SpeechService()

    def build(
        self,
        metadata: dict,
        video_path: str,
        frame_paths: list[str] | None = None,
    ):

        total_start = time.perf_counter()

        frame_paths = frame_paths or []

        ocr_results = []
        seen = set()

        # ==================================
        # OCR
        # ==================================

        ocr_start = time.perf_counter()

        for frame in frame_paths:

            text = self.ocr.extract_text(frame)

            cleaned = text.strip()

            if not cleaned:
                continue

            if cleaned in seen:
                continue

            seen.add(cleaned)
            ocr_results.append(cleaned)

        ocr_time = time.perf_counter() - ocr_start

        # ==================================
        # Speech
        # ==================================

        speech_start = time.perf_counter()

        speech_text = self.speech.extract(video_path)

        speech_time = time.perf_counter() - speech_start

        # ==================================
        # Combine Evidence
        # ==================================

        combine_start = time.perf_counter()

        combined_text = "\n".join([
            metadata.get("title", ""),
            metadata.get("caption", ""),
            " ".join(metadata.get("tags") or []),
            "\n".join(ocr_results),
            speech_text,
        ])

        combine_time = time.perf_counter() - combine_start

        total_time = time.perf_counter() - total_start

        performance = {
            "ocr": round(ocr_time, 2),
            "speech": round(speech_time, 2),
            "combine": round(combine_time, 2),
            "total": round(total_time, 2),
        }

        print("\n========== EVIDENCE BUILDER ==========")
        print(f"📝 OCR             : {ocr_time:.2f}s")
        print(f"🎤 Speech          : {speech_time:.2f}s")
        print(f"🧩 Combine         : {combine_time:.2f}s")
        print("--------------------------------------")
        print(f"⏱️ Total Evidence  : {total_time:.2f}s")
        print("======================================\n")

        return {
            "provider": "instagram",
            "metadata": metadata,
            "title": metadata.get("title", ""),
            "caption": metadata.get("caption", ""),
            "hashtags": metadata.get("tags") or [],
            "ocr_text": "\n".join(ocr_results),
            "speech_text": speech_text,
            "frames": frame_paths,
            "combined_text": combined_text,
            "performance": performance,
        }