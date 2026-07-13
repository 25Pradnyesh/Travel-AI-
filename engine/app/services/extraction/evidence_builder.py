from typing import Dict, Any


class EvidenceBuilder:
    """
    Combines everything we know about a reel into one object.

    Later this class will merge:
    - Metadata
    - OCR
    - Video Frames
    - Gemini Vision
    - Google Places
    """

    def build(
        self,
        metadata: Dict[str, Any],
        ocr_text: str = "",
        frames: list | None = None,
    ) -> Dict[str, Any]:

        frames = frames or []

        title = metadata.get("title") or ""
        caption = metadata.get("caption") or ""
        tags = metadata.get("tags") or []

        combined_text = "\n".join(
            filter(
                None,
                [
                    title,
                    caption,
                    " ".join(tags),
                    ocr_text,
                ],
            )
        )

        return {
            "provider": "instagram",

            "metadata": metadata,

            "title": title,

            "caption": caption,

            "hashtags": tags,

            "ocr_text": ocr_text,

            "frames": frames,

            "combined_text": combined_text,
        }