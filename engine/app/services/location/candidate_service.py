import re
import logging

# ==================================================
# Generic Words
# Never search these alone.
# ==================================================

GENERIC_LOCATION_WORDS = {

    "lake",
    "river",
    "beach",
    "mountain",
    "park",
    "garden",
    "forest",
    "falls",
    "waterfall",
    "temple",
    "fort",
    "palace",
    "museum",
    "road",
    "street",
    "city",
    "country",
    "island",
    "view",
    "viewpoint",
    "peak",
    "pass",
    "valley",
    "canyon",
    "gorge",

}


# ==================================================
# Ignore Noise
# ==================================================

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


# ==================================================
# Words that usually terminate a location
# ==================================================

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


# ==================================================
# Strong Compound Patterns
# ==================================================

KEYWORD_PATTERNS = [

    r"(Lake\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)",
    r"(Mount\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)",
    r"([A-Z][A-Za-z]+\s+National\s+Park)",
    r"([A-Z][A-Za-z]+\s+Waterfall)",
    r"([A-Z][A-Za-z]+\s+Falls)",
    r"([A-Z][A-Za-z]+\s+Beach)",
    r"([A-Z][A-Za-z]+\s+Island)",
    r"([A-Z][A-Za-z]+\s+Forest)",
    r"([A-Z][A-Za-z]+\s+Temple)",
    r"([A-Z][A-Za-z]+\s+Castle)",
    r"([A-Z][A-Za-z]+\s+Valley)",
    r"([A-Z][A-Za-z]+\s+Peak)",
    r"([A-Z][A-Za-z]+\s+Pass)",
    r"([A-Z][A-Za-z]+\s+Canyon)",
    r"([A-Z][A-Za-z]+\s+Gorge)",
    r"(Swiss\s+Alps)",

]


# ==================================================
# Source Priority
# ==================================================

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

    ) -> str:

        if not text:

            return ""

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

            r"[^\w\s,\n📍-]",

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
    # Remove duplicate words
    # ==================================================

    def deduplicate_words(

        self,

        text: str,

    ) -> str:

        seen = set()

        output = []

        for word in text.split():

            lower = word.lower()

            if lower in seen:

                continue

            seen.add(lower)

            output.append(word)

        return " ".join(output)

    # ==================================================
    # Normalize
    # ==================================================

    def normalize_candidate(

        self,

        candidate: str,

    ) -> str:

        candidate = self.deduplicate_words(

            candidate,

        )

        candidate = re.sub(

            r"\s+",

            " ",

            candidate,

        )

        return candidate.strip(

            " ,.-"

        )

    # ==================================================
    # Validation
    # ==================================================

    def is_valid_candidate(

        self,

        candidate: str,

    ) -> bool:

        candidate = self.normalize_candidate(

            candidate,

        )

        lower = candidate.lower()

        if len(lower) < 3:

            return False

        if lower in STOP_WORDS:

            return False

        words = lower.split()

        if all(
            word in GENERIC_LOCATION_WORDS
            for word in words
        ):
            return False

        if candidate.isdigit():

            return False

        if candidate.isupper() and len(candidate) <= 4:

            return False

        words = lower.split()

        if len(words) == 1:

            if words[0] in GENERIC_LOCATION_WORDS:

                return False

        return True

    # ==================================================
    # Remove Child Candidates
    #
    # Lake Como
    # Lake
    #
    # -> removes Lake
    # ==================================================

    def remove_child_candidates(

        self,

        candidates: list[str],

    ) -> list[str]:

        ordered = sorted(

            candidates,

            key=len,

            reverse=True,

        )

        final = []

        for candidate in ordered:

            lower = candidate.lower()

            keep = True

            for existing in final:

                if (

                    lower != existing.lower()

                    and lower in existing.lower()

                ):

                    keep = False

                    break

            if keep:

                final.append(

                    candidate,

                )

        return final


    def remove_sub_locations(

        self,

        candidates: list[str],

    ):

        final = []

        for candidate in candidates:

            keep = True

            for other in candidates:

                if candidate == other:

                    continue

                if candidate.lower() in other.lower():

                    if len(other.split()) > len(candidate.split()):

                        keep = False

                        break

            if keep:

                final.append(candidate)

        return final

    # ==================================================
    # 📍 Pin Location
    # ==================================================

    def extract_pin_location(

        self,

        text: str,

    ):

        text = self.clean(

            text,

        )

        for line in text.splitlines():

            if "📍" not in line:

                continue

            location = line.replace(

                "📍",

                "",

            ).strip()

            words = []

            for word in location.split():

                lower = word.lower()

                if lower in TRAVEL_TERMINATORS:

                    break

                words.append(

                    word,

                )

            candidate = self.normalize_candidate(

                " ".join(words),

            )

            if self.is_valid_candidate(

                candidate,

            ):

                return candidate

        return None

    # ==================================================
    # Extract Candidates
    # ==================================================

    def extract_compound_locations(

        self,

        text: str,

    ):

        text = self.clean(

            text,

        )

        candidates = []

        # ------------------------------------------
        # 📍 Pinned location
        # ------------------------------------------

        pin = self.extract_pin_location(

            text,

        )

        if pin:

            candidates.append(

                pin,

            )

        # ------------------------------------------
        # Comma-separated locations
        #
        # Varenna, Lake Como
        # Hallstatt, Austria
        # Zermatt, Switzerland
        # ------------------------------------------

        comma_matches = re.findall(

            r"([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*,\s*[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)",

            text,

        )

        candidates.extend(

            comma_matches,

        )

        # ------------------------------------------
        # Strong travel phrases
        # ------------------------------------------

        for pattern in KEYWORD_PATTERNS:

            matches = re.findall(

                pattern,

                text,

            )

            candidates.extend(

                matches,

            )

        # ------------------------------------------
        # Two-word proper nouns
        #
        # Lake Como
        # New York
        # Grand Canyon
        # ------------------------------------------

        two_word = re.findall(

            r"\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3})\b",

            text,

        )

        candidates.extend(

            two_word,

        )

        # ------------------------------------------
        # Single Proper Nouns
        # ------------------------------------------

        single = re.findall(

            r"\b[A-Z][A-Za-z]+\b",

            text,

        )

        candidates.extend(

            single,

        )

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

            seen.add(

                key,

            )

            cleaned.append(

                candidate,

            )
            # AFTER LOOP

            cleaned = self.remove_child_candidates(
                cleaned,
            )

            cleaned = self.remove_sub_locations(
                cleaned,
            )

        cleaned.sort(

            key=lambda x: (

                -len(

                    x.split(),

                ),

                -len(

                    x,

                ),

            ),

        )


        return cleaned

    # ==================================================
    # Add Candidates
    # ==================================================

    def add_candidates(

        self,

        storage: dict,

        text: str,

        source: str,

    ):

        if not text:

            return

        candidates = self.extract_compound_locations(

            text,

        )

        for candidate in candidates:

            key = candidate.lower()

            score = SOURCE_PRIORITY.get(

                source,

                0,

            )

            # ------------------------------------------
            # Phrase Bonus
            # ------------------------------------------

            score += len(

                candidate.split(),

            ) * 10

            # ------------------------------------------
            # Character Bonus
            # ------------------------------------------

            score += min(

                len(candidate),

                20,

            )

            if key not in storage:

                storage[key] = {

                    "candidate": candidate,

                    "sources": {

                        source,

                    },

                    "score": score,

                }

                continue

            storage[key]["sources"].add(

                source,

            )

            storage[key]["score"] += 25

    # ==================================================
    # Generate
    # ==================================================

    def generate(

        self,

        metadata: dict,

        ocr_text: str,

        speech_text: str = "",

    ):

        storage = {}

        # ------------------------------------------
        # Caption
        # ------------------------------------------

        self.add_candidates(

            storage,

            metadata.get(

                "caption",

                "",

            ),

            "caption",

        )

        # ------------------------------------------
        # Speech
        # ------------------------------------------

        self.add_candidates(

            storage,

            speech_text,

            "speech",

        )

        # ------------------------------------------
        # OCR
        # ------------------------------------------

        self.add_candidates(

            storage,

            ocr_text,

            "ocr",

        )

        # ------------------------------------------
        # Title
        # ------------------------------------------

        self.add_candidates(

            storage,

            metadata.get(

                "title",

                "",

            ),

            "title",

        )

        # ------------------------------------------
        # Hashtags
        # ------------------------------------------

        hashtags = (

            metadata.get("hashtags")

            or

            metadata.get("tags")

            or []

        )

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

            if tag.lower() in GENERIC_LOCATION_WORDS:

                continue

            self.add_candidates(

                storage,

                tag,

                "hashtags",

            )

        # ------------------------------------------
        # Final Ranking
        # ------------------------------------------

        ranked = sorted(

            storage.values(),

            key=lambda item: (

                -item["score"],

                -len(

                    item["candidate"].split(),

                ),

                -len(

                    item["candidate"],

                ),

                item["candidate"],

            ),

        )

        logging.info(

            "\n========== CANDIDATE SERVICE ==========\n"

        )

        for index, item in enumerate(

            ranked,

            start=1,

        ):

            logging.info(

                f"{index}. "

                f"{item['candidate']} "

                f"| Score={item['score']} "

                f"| Sources={','.join(sorted(item['sources']))}"

            )

        logging.info(

            "\n=======================================\n"

        )

        return [

            item["candidate"]

            for item in ranked

        ]

