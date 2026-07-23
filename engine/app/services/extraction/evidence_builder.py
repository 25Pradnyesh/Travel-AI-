import time

from engine.app.services.extraction.ocr_service import OCRService
from engine.app.services.extraction.speech_service import SpeechService


class EvidenceBuilder:

    def __init__(self):

        self.ocr = OCRService()
        self.speech = SpeechService()

    # ==========================================
    # Stage 1
    # Caption / Metadata only
    # ==========================================

    def build_caption(
        self,
        metadata: dict,
    ):

        return {
            "provider": "instagram",
            "metadata": metadata,
            "title": metadata.get("title", ""),
            "caption": metadata.get("caption", ""),
            "hashtags": metadata.get("tags") or [],
            "ocr_text": "",
            "speech_text": "",
            "frames": [],
        }

    # ==========================================
    # Stage 2
    # OCR only
    # ==========================================

    def build_ocr(
        self,
        evidence: dict,
        frame_paths: list[str],
    ):

        start = time.perf_counter()

        seen = set()
        ocr_results = []

        for frame in frame_paths:

            text = self.ocr.extract_text(frame)

            cleaned = text.strip()

            if not cleaned:
                continue

            if cleaned in seen:
                continue

            seen.add(cleaned)
            ocr_results.append(cleaned)

        evidence["frames"] = frame_paths
        evidence["ocr_text"] = "\n".join(ocr_results)

        print(
            f"📝 OCR : {time.perf_counter()-start:.2f}s"
        )

        return evidence

    # ==========================================
    # Stage 3
    # Speech only
    # ==========================================

    def build_speech(
        self,
        evidence: dict,
        video_path: str,
    ):

        start = time.perf_counter()

        evidence["speech_text"] = self.speech.extract(
            video_path
        )

        print(
            f"🎤 Speech : {time.perf_counter()-start:.2f}s"
        )

        return evidence

    # ==========================================
    # Final
    # Merge everything
    # ==========================================

    def combine(
        self,
        evidence: dict,
    ):

        combined_text = "\n".join([
            evidence["title"],
            evidence["caption"],
            " ".join(evidence["hashtags"]),
            evidence["ocr_text"],
            evidence["speech_text"],
        ])

        evidence["combined_text"] = combined_text

        return evidence