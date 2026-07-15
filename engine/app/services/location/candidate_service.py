import re


class CandidateService:

    def generate(self, metadata: dict, ocr_text: str):

        candidates = []

        # OCR
        if ocr_text:
            candidates.append(ocr_text.strip())

        # Caption
        caption = metadata.get("caption") or ""
        if caption:
            candidates.append(caption)

        # Title
        title = metadata.get("title") or ""
        if title:
            candidates.append(title)

        # Hashtags
        hashtags = metadata.get("tags") or []
        candidates.extend(hashtags)

        cleaned = []

        for item in candidates:

            item = item.replace("#", " ")
            item = item.replace("📍", " ")

            item = re.sub(r"\s+", " ", item).strip()

            if len(item) > 2:
                cleaned.append(item)

        # Remove duplicates while preserving order
        unique = []

        for item in cleaned:
            if item not in unique:
                unique.append(item)

        return unique