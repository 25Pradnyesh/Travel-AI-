from engine.app.services.extraction.ocr_service import OCRService


class EvidenceBuilder:

    def __init__(self):
        self.ocr = OCRService()

    def build(
        self,
        metadata: dict,
        frame_paths: list[str] | None = None,
    ):

        frame_paths = frame_paths or []

        ocr_results = []

        for frame in frame_paths:

            text = self.ocr.extract_text(frame)

            if text.strip():
                ocr_results.append(text)

        combined_text = "\n".join([
            metadata.get("title", ""),
            metadata.get("caption", ""),
            " ".join(metadata.get("tags") or []),
            "\n".join(ocr_results),
        ])

        return {
            "provider": "instagram",
            "metadata": metadata,
            "title": metadata.get("title", ""),
            "caption": metadata.get("caption", ""),
            "hashtags": metadata.get("tags") or [],
            "ocr_text": "\n".join(ocr_results),
            "frames": frame_paths,
            "combined_text": combined_text,
        }