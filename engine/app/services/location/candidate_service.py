import re


STOP_WORDS = {
    "welcome",
    "found",
    "shot",
    "video",
    "videos",
    "comment",
    "comments",
    "like",
    "follow",
    "share",
    "save",
    "beautiful",
    "amazing",
    "travel",
    "travels",
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
    "every",
    "another",
    "honestly",
    "highly",
    "recommend",
    "grade",
    "check",
    "bio",
    "link",
    "free",
    "tutorial",
    "preset",
    "camera",
    "sony",
    "canon",
    "reel",
    "instagram",
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
    "camp",
    "camping",
    "restaurant",
    "cafe",
    "bar",
    "hostel",
    "stay",
    "stays",
    "resort",
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

        text = re.sub(
            r"http\S+|www\S+",
            " ",
            text,
        )

        text = re.sub(
            r"@\w+",
            " ",
            text,
        )

        text = text.replace(
            "📍",
            "\n📍 ",
        )

        text = re.sub(
            r"#([A-Za-z0-9_]+)",
            r" \1 ",
            text,
        )

        text = re.sub(
            r"[^\w\s,\n📍]",
            " ",
            text,
        )

        text = re.sub(
            r"\s+",
            " ",
            text,
        )

        return text.strip()

    def deduplicate_words(
        self,
        candidate: str,
    ):

        seen = set()

        cleaned = []

        for word in candidate.split():

            key = word.lower()

            if key in seen:
                continue

            seen.add(key)

            cleaned.append(word)

        return " ".join(cleaned)

    def normalize_candidate(
        self,
        candidate: str,
    ):

        candidate = self.deduplicate_words(
            candidate,
        )

        candidate = re.sub(
            r"\s+",
            " ",
            candidate,
        )

        return candidate.strip(" ,.")

    def is_valid_candidate(
        self,
        candidate: str,
    ):

        candidate = candidate.strip()

        if len(candidate) < 3:
            return False

        if candidate.lower() in STOP_WORDS:
            return False

        if candidate.isdigit():
            return False

        if "http" in candidate.lower():
            return False

        if (
            candidate.isupper()
            and len(candidate) <= 4
        ):
            return False

        if re.fullmatch(
            r"[\W_]+",
            candidate,
        ):
            return False

        return True

    def extract_pin_location(
        self,
        text: str,
    ):

        for line in text.splitlines():

            if "📍" not in line:
                continue

            location = line.replace(
                "📍",
                "",
            )

            location = re.sub(
                r"#\S+",
                "",
                location,
            )

            location = re.sub(
                r"@\S+",
                "",
                location,
            )

            location = re.sub(
                r"[^\w\s,]",
                " ",
                location,
            )

            words = []

            for word in location.split():

                lower = word.lower()

                if lower == "in":
                    break

                if lower in TRAVEL_TERMINATORS:
                    break

                words.append(word)

            location = self.normalize_candidate(
                " ".join(words),
            )

            if self.is_valid_candidate(
                location,
            ):
                return location

        return None

    def extract_compound_locations(
        self,
        text: str,
    ):

        text = self.clean(text)

        candidates = []

        pin = self.extract_pin_location(
            text,
        )

        if pin:
            candidates.append(pin)

        comma_matches = re.findall(
            r"([A-Z][A-Za-z]+,\s*[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)",
            text,
        )

        candidates.extend(comma_matches)

        for pattern in KEYWORD_PATTERNS:

            candidates.extend(
                re.findall(
                    pattern,
                    text,
                )
            )

        proper_nouns = re.findall(
            r"\b[A-Z][A-Za-z]+\b",
            text,
        )

        for word in proper_nouns:

            if word.lower() in STOP_WORDS:
                continue

            candidates.append(word)

        unique = []

        seen = set()

        for candidate in candidates:

            candidate = self.normalize_candidate(
                candidate,
            )

            if not self.is_valid_candidate(
                candidate,
            ):
                continue

            key = candidate.lower()

            if key in seen:
                continue

            seen.add(key)

            unique.append(candidate)

        unique.sort(
            key=len,
            reverse=True,
        )

        return unique

    def generate(
        self,
        metadata: dict,
        ocr_text: str,
    ):

        candidates = []

        caption = metadata.get(
            "caption",
            "",
        )

        title = metadata.get(
            "title",
            "",
        )

        candidates.extend(
            self.extract_compound_locations(
                caption,
            )
        )

        candidates.extend(
            self.extract_compound_locations(
                title,
            )
        )

        if ocr_text:

            candidates.extend(
                self.extract_compound_locations(
                    ocr_text,
                )
            )

        hashtags = metadata.get(
            "tags"
        ) or []

        for tag in hashtags:

            tag = self.normalize_candidate(
                tag.replace(
                    "#",
                    "",
                )
            )

            if self.is_valid_candidate(
                tag,
            ):

                candidates.append(tag)

        final = []

        seen = set()

        for candidate in candidates:

            key = candidate.lower()

            if key in seen:
                continue

            seen.add(key)

            final.append(candidate)

        final.sort(
            key=len,
            reverse=True,
        )

        return final