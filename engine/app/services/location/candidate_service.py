import re


STOP_WORDS = {
    "welcome", "found", "shot", "video", "videos",
    "comment", "comments", "like", "follow", "share",
    "save", "beautiful", "amazing", "travel", "travels",
    "trip", "vacation", "holiday", "visit", "visiting",
    "exploring", "discover", "discovering", "staying",
    "walking", "hiking", "going", "today", "everyone",
    "every", "another", "honestly", "highly",
    "recommend", "grade", "check", "bio", "link",
    "free", "tutorial", "preset", "camera", "sony",
    "canon", "reel", "instagram",
}


TRAVEL_TERMINATORS = {
    "hike", "trail", "trek", "walk", "road",
    "trip", "tour", "ferry", "cable", "train",
    "station", "hotel", "viewpoint", "view",
    "sunrise", "sunset", "camp", "camping",
    "restaurant", "cafe", "bar", "hostel",
    "stay", "stays", "resort",
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


SOURCE_PRIORITY = {

    "caption": 5,

    "speech": 4,

    "ocr": 3,

    "hashtags": 2,

    "title": 1,

}


class CandidateService:

    # ==================================================
    # Cleaning
    # ==================================================

    def clean(
        self,
        text: str,
    ):

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

        text = re.sub(
            r"#([A-Za-z0-9_]+)",
            r" \1 ",
            text,
        )

        text = text.replace(
            "📍",
            "\n📍 ",
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

    # ==================================================

    def deduplicate_words(
        self,
        text: str,
    ):

        seen = set()

        words = []

        for word in text.split():

            lower = word.lower()

            if lower in seen:
                continue

            seen.add(lower)

            words.append(word)

        return " ".join(words)

    # ==================================================

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

    # ==================================================

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

        if candidate.isupper() and len(candidate) <= 4:
            return False

        return True

    # ==================================================

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

    # ==================================================

    def extract_compound_locations(
        self,
        text: str,
    ):

        text = self.clean(text)

        candidates = []

        pin = self.extract_pin_location(text)

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

        proper = re.findall(

            r"\b[A-Z][A-Za-z]+\b",

            text,

        )

        candidates.extend(proper)

        cleaned = []

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

            cleaned.append(candidate)

        cleaned.sort(
            key=len,
            reverse=True,
        )

        return cleaned

    # ==================================================

    def add_candidates(
        self,
        storage: dict,
        text: str,
        source: str,
    ):

        for candidate in self.extract_compound_locations(text):

            key = candidate.lower()

            if key not in storage:

                storage[key] = {

                    "candidate": candidate,

                    "source": source,

                    "priority": SOURCE_PRIORITY[source],

                }

            elif SOURCE_PRIORITY[source] > storage[key]["priority"]:

                storage[key]["source"] = source

                storage[key]["priority"] = SOURCE_PRIORITY[source]

    # ==================================================

    def generate(
        self,
        metadata: dict,
        ocr_text: str,
        speech_text: str = "",
    ):

        storage = {}

        self.add_candidates(

            storage,

            metadata.get(
                "caption",
                "",
            ),

            "caption",

        )

        self.add_candidates(

            storage,

            speech_text,

            "speech",

        )

        self.add_candidates(

            storage,

            ocr_text,

            "ocr",

        )

        self.add_candidates(

            storage,

            metadata.get(
                "title",
                "",
            ),

            "title",

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

            if not self.is_valid_candidate(
                tag,
            ):
                continue

            key = tag.lower()

            if key not in storage:

                storage[key] = {

                    "candidate": tag,

                    "source": "hashtags",

                    "priority": SOURCE_PRIORITY["hashtags"],

                }

        ordered = sorted(

            storage.values(),

            key=lambda x: (

                -x["priority"],

                -len(x["candidate"]),

            ),

        )

        return [

            item["candidate"]

            for item in ordered

        ]