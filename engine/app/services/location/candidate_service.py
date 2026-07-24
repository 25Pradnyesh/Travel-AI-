import re


STOP_WORDS = {
    "welcome",
    "found",
    "shot",
    "video",
    "comment",
    "like",
    "follow",
    "share",
    "beautiful",
    "amazing",
    "travel",
    "trip",
    "vacation",
    "holiday",
    "visit",
    "visiting",
    "exploring",
    "discover",
    "discovering",
    "staying",
    "walking",
    "hiking",
    "going",
    "today",
    "everyone",
    "honestly",
    "highly",
    "recommend",
}


TRAVEL_TERMINATORS = {
    "hike",
    "trail",
    "trek",
    "walk",
    "road",
    "trip",
    "tour",
    "ferry",
    "cable",
    "train",
    "station",
    "hotel",
    "viewpoint",
    "view",
    "sunrise",
    "sunset",
}


KEYWORD_PATTERNS = [

    r"(Lake\s+[A-Z][A-Za-z]+)",

    r"(Mount\s+[A-Z][A-Za-z]+)",

    r"([A-Z][A-Za-z]+\s+Valley)",

    r"([A-Z][A-Za-z]+\s+Peak)",

    r"([A-Z][A-Za-z]+\s+Falls)",

    r"([A-Z][A-Za-z]+\s+Waterfall)",

    r"([A-Z][A-Za-z]+\s+Beach)",

    r"([A-Z][A-Za-z]+\s+Island)",

    r"([A-Z][A-Za-z]+\s+Forest)",

    r"([A-Z][A-Za-z]+\s+Glacier)",

    r"([A-Z][A-Za-z]+\s+Temple)",

    r"([A-Z][A-Za-z]+\s+Castle)",

    r"([A-Z][A-Za-z]+\s+Pass)",

    r"([A-Z][A-Za-z]+\s+Canyon)",

    r"([A-Z][A-Za-z]+\s+Gorge)",

    r"([A-Z][A-Za-z]+\s+National\s+Park)",

    r"(Swiss\s+Alps)",
]


class CandidateService:

    def clean(self, text: str) -> str:

        text = text.replace("📍", " 📍 ")
        text = text.replace("#", " ")

        # Remove emojis and symbols
        text = re.sub(
            r"[^\w\s,📍]",
            " ",
            text,
        )

        return re.sub(
            r"\s+",
            " ",
            text,
        ).strip()

    def extract_pin_location(self, text: str):

        match = re.search(
            r"📍\s*([^#\n]+)",
            text,
        )

        if not match:
            return None

        location = match.group(1).strip()

        words = location.split()

        cleaned = []

        for word in words:

            lower = word.lower()

            if lower in TRAVEL_TERMINATORS:
                break

            if lower == "in":
                break

            cleaned.append(word)

        location = " ".join(cleaned).strip(" ,.")

        return location if location else None

    def extract_compound_locations(
        self,
        text: str,
    ):

        text = self.clean(text)

        candidates = []

        # ----------------------------------------
        # Priority 1
        # 📍 Location
        # ----------------------------------------

        pin = self.extract_pin_location(text)

        if pin:
            candidates.append(pin)

        # ----------------------------------------
        # Priority 2
        # Comma-separated locations
        # ----------------------------------------

        comma_matches = re.findall(
            r"([A-Z][A-Za-z]+,\s*[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)",
            text,
        )

        candidates.extend(comma_matches)

        # ----------------------------------------
        # Priority 3
        # Known travel patterns
        # ----------------------------------------

        for pattern in KEYWORD_PATTERNS:

            matches = re.findall(
                pattern,
                text,
            )

            candidates.extend(matches)

        # ----------------------------------------
        # Priority 4
        # Proper nouns
        # ----------------------------------------

        words = re.findall(
            r"\b[A-Z][A-Za-z]+\b",
            text,
        )

        for word in words:

            if word.lower() in STOP_WORDS:
                continue

            candidates.append(word)

        # ----------------------------------------
        # Deduplicate
        # ----------------------------------------

        unique = []

        for candidate in candidates:

            candidate = candidate.strip(" ,.")

            if len(candidate) < 3:
                continue

            if candidate not in unique:
                unique.append(candidate)

        return unique

    def generate(
        self,
        metadata: dict,
        ocr_text: str,
    ):

        candidates = []

        caption = metadata.get("caption") or ""
        title = metadata.get("title") or ""

        candidates.extend(
            self.extract_compound_locations(caption)
        )

        candidates.extend(
            self.extract_compound_locations(title)
        )

        if ocr_text:
            candidates.extend(
                self.extract_compound_locations(
                    ocr_text
                )
            )

        hashtags = metadata.get("tags") or []

        candidates.extend(hashtags)

        unique = []

        for candidate in candidates:

            if candidate not in unique:
                unique.append(candidate)

        return unique