import difflib
import logging
import re

from engine.app.services.scoring.scoring_service import COUNTRIES

logger = logging.getLogger(__name__)

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
    "lago",
    "rio",
    "mont",
    "monte",
    "valle",
    "isola",
    "church",
    "shrine",
    "cathedral",
    "cathederal",
    "mill",
    "bridge",
    "mountains",
    "beaches",
    "lakes",
    "rivers",
    "parks",
    "gardens",
    "forests",
    "islands",
    "waterfalls",
    "temples",
    "canyons",
    "valleys",
    "views",
    "peaks",
    "nature",
    "wildlife",
    "scenery",
    "landscape",
    "outdoors",
}


# ==================================================
# Stop Words and Grammatical Words
# Never allow these as standalone location candidates.
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
    "stationery",
}

COMMON_VERBS_AND_PARTICIPLES = {
    "planning",
    "built",
    "trying",
    "standing",
    "living",
    "learning",
    "watching",
    "located",
    "situated",
    "founded",
    "created",
    "designed",
    "inspired",
    "depicting",
    "housing",
    "walking",
    "riding",
    "driving",
    "flying",
    "heading",
    "stopping",
    "wondering",
    "wandering",
    "wander",
    "imagine",
    "bring",
    "brought",
    "make",
    "made",
    "feel",
    "felt",
    "think",
    "thought",
    "know",
    "known",
    "spend",
    "spent",
    "pause",
    "reach",
    "reached",
    "close",
    "closed",
    "adds",
    "added",
    "adding",
    "loves",
    "loved",
    "loving",
}

DEMONYM_ADJECTIVES = {
    "japanese",
    "italian",
    "french",
    "german",
    "spanish",
    "european",
    "american",
    "indian",
    "chinese",
    "british",
    "english",
    "asian",
    "african",
    "nordic",
    "scandinavian",
    "swiss",
    "dutch",
    "irish",
    "scottish",
    "welsh",
    "russian",
    "greek",
    "turkish",
    "arabic",
    "mexican",
    "canadian",
    "australian",
}

DETERMINERS_AND_PRONOUNS = {
    "this",
    "that",
    "these",
    "those",
    "there",
    "here",
    "what",
    "when",
    "where",
    "why",
    "how",
    "who",
    "which",
    "whose",
    "whom",
    "they",
    "them",
    "their",
    "theirs",
    "your",
    "yours",
    "ours",
    "some",
    "many",
    "much",
    "more",
    "most",
    "another",
    "other",
    "each",
    "every",
    "such",
    "only",
    "very",
    "also",
    "even",
    "just",
    "once",
    "then",
    "soon",
    "next",
    "before",
    "after",
    "because",
    "although",
    "since",
    "while",
    "adult",
    "straight",
}

BOILERPLATE_WORDS = {
    "contact",
    "copyright",
    "repost",
    "permission",
    "licensing",
    "fee",
    "fees",
    "credit",
    "credits",
    "subscribe",
    "follower",
    "followers",
    "likes",
    "collab",
    "collaboration",
    "dm",
    "post",
    "posts",
    "story",
    "stories",
    "presets",
    "guide",
    "itinerary",
    "things",
    "something",
    "anything",
    "nothing",
    "someone",
    "anyone",
    "hours",
    "part",
    "times",
    "time",
    "escape",
    "money",
    "brand",
    "studio",
    "tutorial",
    "preset",
    "presets",
    "cinematic",
    "spiderman",
    # Tech platforms & mapping software (frequently in marketing/promotional copy)
    "google",
    "youtube",
    "instagram",
    "facebook",
    "tiktok",
    "pinterest",
    "twitter",
    "telegram",
    "whatsapp",
    "spotify",
    "apple",
    "map",
    "maps",
}

TEMPORAL_WORDS = {
    # Months
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
    # Days
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    # Seasons & Time
    "spring",
    "summer",
    "autumn",
    "winter",
    "morning",
    "afternoon",
    "evening",
    "night",
    "weekend",
    "weekday",
    "today",
    "yesterday",
    "tomorrow",
    "tonight",
}

INVALID_SINGLE_WORDS = (
    STOP_WORDS
    | COMMON_VERBS_AND_PARTICIPLES
    | DEMONYM_ADJECTIVES
    | DETERMINERS_AND_PRONOUNS
    | BOILERPLATE_WORDS
    | TEMPORAL_WORDS
)


# ==================================================
# Words that terminate location notes
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
# Recognized Geographic Entities
# Supported as legitimate standalone destinations
# ==================================================

KNOWN_GEOGRAPHIC_ENTITIES = {
    "Matera",
    "Rome",
    "Tokyo",
    "Ginza",
    "Mysore",
    "Mysuru",
    "Bangalore",
    "Bengaluru",
    "Chennai",
    "Mumbai",
    "Delhi",
    "Kolkata",
    "Hyderabad",
    "Pune",
    "Jaipur",
    "Agra",
    "Varanasi",
    "Goa",
    "Kerala",
    "Meghalaya",
    "Shillong",
    "Cherrapunji",
    "Deqin",
    "Sedona",
    "Moab",
    "Juneau",
    "Seward",
    "Hampshire",
    "Winchester",
    "Alresford",
    "Mangart",
    "Italy",
    "Slovenia",
    "Japan",
    "India",
    "Germany",
    "France",
    "Alaska",
    "Hawaii",
    "California",
    "Wyoming",
    "Utah",
    "Montana",
    "Florida",
    "Arizona",
    "Kazakhstan",
    "Mangystau",
    "China",
    "London",
    "Paris",
    "Venice",
    "Milan",
    "Florence",
    "Naples",
    "Kyoto",
    "Osaka",
    "Madrid",
    "Barcelona",
    "Berlin",
    "Munich",
    "Amsterdam",
    "Vienna",
    "Prague",
    "Zurich",
    "Geneva",
    "Sydney",
    "Melbourne",
    "Dubai",
    "Singapore",
    "Bangkok",
    "Bali",
    "Enshi",
    "Houtouwan",
}

# Include recognized world countries as geographic entities
KNOWN_GEOGRAPHIC_ENTITIES.update(
    {c.title() for c in COUNTRIES if len(c) > 2}
)


# ==================================================
# Strong Compound Patterns
# ==================================================

KEYWORD_PATTERNS = [
    r"((?:(?:[A-Z][A-Za-z0-9']+|St\.|Mt\.)(?:\s+[A-Z][A-Za-z0-9']+)*\s+)?National\s+Park)",
    r"((?:Mount|Mt\.?|Lake|Cape|Point|Bay|River|Gulf|Loch|Isle)\s+[A-Z][A-Za-z0-9']+(?:\s+[A-Z][A-Za-z0-9']+)*)",
    r"((?:St\.?\s+)?[A-Z][A-Za-z0-9']+(?:'s)?(?:\s+[A-Z][A-Za-z0-9']+)*\s+(?:Cathedral|Cathederal|Shrine|Church|Basilica|Abbey|Monastery)(?:\s*\([A-Za-z0-9'\s\.]+\))?)",
    r"((?:The\s+)?[A-Z][A-Za-z0-9']+(?:\s+[A-Z][A-Za-z0-9']+)*\s+(?:Mill|Bridge|Tower|Castle|Palace|Fort|Waterfall|Falls|Beach|Island|Forest|Rainforest|Valley|Peak|Pass|Canyon|Gorge|Recreation\s+Area))",
    r"(Lago\s+di\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)",
    r"(Val\s+di\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)",
    r"((?:[Ss]alto|[Cc]ascada|[Cc]ataratas)\s+(?:de\s+|del\s+|el\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)*)",
    r"(Isola\s+di\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)",
    r"(Swiss\s+Alps)",
]


# ==================================================
# Contextual Location Triggers
# ==================================================

LOCATION_TRIGGER_PATTERNS = [
    r"(?i:trip to|travel to|welcome to|visiting|visit to|explore|exploring|heart of|hidden in|located in|situated in|drive to|road trip to|road trip from|heading to|escape to|flight to|fly to)\s+((?:St\.\s+|Mt\.\s+)?[A-Z][A-Za-z0-9']+(?:\s+[A-Z][A-Za-z0-9']+){0,3}(?:,\s*[A-Z][A-Za-z]+)*)",
    r"(?i:places in|destinations in|best of|gems in)\s+((?:St\.\s+|Mt\.\s+)?[A-Z][A-Za-z0-9']+(?:\s+[A-Z][A-Za-z0-9']+){0,3}(?:,\s*[A-Z][A-Za-z]+)*)",
    r"(?i:\bin\s+)((?:St\.\s+|Mt\.\s+)?[A-Z][A-Za-z0-9']+(?:\s+[A-Z][A-Za-z0-9']+){0,2}(?:,\s*[A-Z][A-Za-z]+)?)",
    r"([A-Z][A-Za-z]+)\s+(?i:is\s+(?:one\s+of|a|an)\s+(?:the\s+)?(?:oldest|most|best|famous|beautiful|inhabited|ancient)?\s*(?:cities|city|towns|town|places|place|destinations|destination|villages|village|countries|country))\b",
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

        # Remove URLs
        text = re.sub(
            r"https?://\S+|www\.\S+",
            " ",
            text,
        )

        # Remove user handles
        text = re.sub(
            r"@\w+",
            " ",
            text,
        )

        # Normalize sentence-ending punctuation so sentence/clause boundaries are preserved
        text = text.replace("!", ".").replace("?", ".")

        # Normalize brackets and structural dividers onto separate lines
        text = text.replace("[", "\n").replace("]", "\n")

        # Normalize pin emojis so they start on a clean newline
        text = re.sub(
            r"[📍📌]",
            "\n📍 ",
            text,
        )

        # Normalize typographical quotes and dashes
        text = (
            text.replace("’", "'")
            .replace("‘", "'")
            .replace("“", '"')
            .replace("”", '"')
            .replace("–", "-")
            .replace("—", "-")
        )

        # Preserve word characters, whitespace, newlines, commas, periods, hyphens, single quotes, pin, parentheses
        text = re.sub(
            r"[^\w\s,\.\n📍\'\(\)-]",
            " ",
            text,
        )

        # Collapse horizontal whitespace to a single space, preserving newlines
        text = re.sub(
            r"[^\S\n]+",
            " ",
            text,
        )

        # Collapse excessive newlines
        text = re.sub(
            r"\n\s*\n+",
            "\n",
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
        candidate = self.deduplicate_words(candidate)
        candidate = re.sub(r"\s+", " ", candidate)
        return candidate.strip(" ,.-'\"")

    # ==================================================
    # Validation
    # ==================================================

    def is_valid_candidate(
        self,
        candidate: str,
    ) -> bool:
        candidate = self.normalize_candidate(candidate)
        lower = candidate.lower()

        if len(lower) < 3:
            return False

        if lower in INVALID_SINGLE_WORDS:
            return False

        words = lower.split()

        # Reject if starts with a boilerplate/non-location indicator
        if words and words[0] in BOILERPLATE_WORDS:
            return False

        # Reject if all words are generic location tokens (e.g. "beach park")
        if all(word in GENERIC_LOCATION_WORDS for word in words):
            return False

        # Reject if all words are invalid single words or temporal words
        if all(word in INVALID_SINGLE_WORDS for word in words):
            return False

        if candidate.isdigit():
            return False

        if candidate.isupper() and len(candidate) <= 4 and candidate not in ("USA", "UK"):
            return False

        # Single word validation: must not be in generic, stop, verb, demonym, boilerplate, or temporal sets
        if len(words) == 1:
            if words[0] in GENERIC_LOCATION_WORDS or words[0] in INVALID_SINGLE_WORDS:
                return False

        return True

    # ==================================================
    # Remove Child Candidates
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
                if lower != existing.lower() and lower in existing.lower():
                    keep = False
                    break

            if keep:
                final.append(candidate)

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
    # 📍 Pin Locations
    # ==================================================

    def extract_pin_locations(
        self,
        text: str,
    ) -> list[str]:
        pins = []
        for line in text.splitlines():
            line_str = line.strip()
            match = re.search(r"[📍📌]\s*(.+)", line_str)
            if not match:
                continue

            content = match.group(1).strip()
            content = re.sub(
                r"^(?:location|place|where)\s*:\s*",
                "",
                content,
                flags=re.IGNORECASE,
            ).strip()

            lower_content = content.lower()
            # Skip non-destination conversational intros and marketing bullet points
            if any(lower_content.startswith(p) for p in [
                "here are", "these are", "some of", "favorite places", "my favorite", "save this", "check out",
                "a custom google map", "custom google map", "google map", "custom map", "my map",
                "link in", "click the", "click here", "download", "free guide"
            ]):
                continue

            # Split on note separators (e.g. " - open since 1904", " (⚠️ This is a private home...)")
            segments = re.split(r"\s+[-–—|]\s+|\s*\(|\s+🕰️|\s+⚠️", content)
            loc_candidate = segments[0].strip() if segments else content

            # Also stop if any travel terminator word is encountered when length >= 2
            words = []
            for word in loc_candidate.split():
                if word.lower() in TRAVEL_TERMINATORS and len(words) >= 2:
                    break
                words.append(word)

            cand = self.normalize_candidate(" ".join(words))
            if self.is_valid_candidate(cand):
                pins.append(cand)

        return pins

    def extract_pin_location(
        self,
        text: str,
    ):
        pins = self.extract_pin_locations(text)
        return pins[0] if pins else None

    # ==================================================
    # Extract Candidates
    # ==================================================

    def extract_compound_locations(
        self,
        text: str,
        source: str = "caption",
    ):
        cleaned = self.clean(text)
        candidates = []

        # ------------------------------------------
        # 1. 📍 Pinned locations
        # ------------------------------------------
        pins = self.extract_pin_locations(cleaned)
        for pin in pins:
            candidates.append(pin)
            parts = [pt.strip() for pt in pin.split(",") if len(pt.strip()) > 2]
            if len(parts) > 1:
                for pt in parts:
                    if self.is_valid_candidate(pt):
                        candidates.append(pt)

        # ------------------------------------------
        # 2. Comma-separated locations line-by-line
        # ------------------------------------------
        for line in cleaned.splitlines():
            comma_matches = re.findall(
                r"([A-Z][A-Za-z0-9'\.]+(?:\s+[A-Z][A-Za-z0-9'\.]+)*,\s*[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*(?:,\s*[A-Z][A-Za-z]+)*)",
                line,
            )
            for cm in comma_matches:
                cm_parts = [pt.strip() for pt in cm.split(",")]
                # Reject multi-part candidate if:
                # 1. Any segment is an invalid single word or generic descriptor
                # 2. Any non-final segment is a country name (e.g. "Cathedral, Germany, Mysore")
                has_invalid = (
                    any(
                        pt.lower() in INVALID_SINGLE_WORDS or pt.lower() in GENERIC_LOCATION_WORDS
                        for pt in cm_parts
                    )
                    or any(pt.lower() in COUNTRIES for pt in cm_parts[:-1])
                )
                if not has_invalid:
                    candidates.append(cm)
                for pt in cm_parts:
                    if self.is_valid_candidate(pt):
                        candidates.append(pt)

        # ------------------------------------------
        # 3. Contextual Location Triggers
        # ------------------------------------------
        for pattern in LOCATION_TRIGGER_PATTERNS:
            for line in cleaned.splitlines():
                matches = re.findall(pattern, line)
                for m in matches:
                    cand = m.strip() if isinstance(m, str) else m[0].strip()
                    if self.is_valid_candidate(cand):
                        candidates.append(cand)

        # ------------------------------------------
        # 4. Landmark & Keyword Patterns
        # ------------------------------------------
        for pattern in KEYWORD_PATTERNS:
            for line in cleaned.splitlines():
                matches = re.findall(pattern, line)
                for m in matches:
                    cand = m.strip() if isinstance(m, str) else m[0].strip()
                    if cand and cand[0].islower():
                        cand = cand.title()
                    if self.is_valid_candidate(cand):
                        candidates.append(cand)

        # ------------------------------------------
        # 5. Multi-word Proper Nouns within clauses
        # ------------------------------------------
        clauses = re.split(r"[\.\!\?\n;:•\(\)\[\]]", cleaned)
        for clause in clauses:
            clause = clause.strip()
            if not clause:
                continue
            two_three_words = re.findall(
                r"\b([A-Z][A-Za-z0-9'\.]+(?:\s+[A-Z][A-Za-z0-9'\.]+){1,2})\b",
                clause,
            )
            for ttw in two_three_words:
                words = ttw.split()
                if words[0].lower() in INVALID_SINGLE_WORDS:
                    if len(words) > 2:
                        sub = " ".join(words[1:])
                        if self.is_valid_candidate(sub):
                            candidates.append(sub)
                    continue
                if self.is_valid_candidate(ttw):
                    candidates.append(ttw)

        # ------------------------------------------
        # 6. Recognized Single-Word Geographic Entities
        # ------------------------------------------
        words_in_text = set(re.findall(r"\b[A-Za-z]+\b", cleaned))
        words_lower = {w.lower() for w in words_in_text if len(w) >= 3}
        for geo in KNOWN_GEOGRAPHIC_ENTITIES:
            geo_lower = geo.lower()
            if geo_lower in words_lower:
                candidates.append(geo)
                continue
            # OCR / transcription typo tolerance for recognized destinations
            if source in ("ocr", "speech") and len(geo_lower) >= 5:
                for w in words_lower:
                    if len(w) >= 4 and abs(len(w) - len(geo_lower)) <= 2:
                        ratio = difflib.SequenceMatcher(None, w, geo_lower).ratio()
                        if ratio >= 0.70:
                            candidates.append(geo)
                            break


        # ------------------------------------------
        # Normalization and Validation Filter
        # ------------------------------------------
        cleaned_candidates = []
        seen = set()

        for candidate in candidates:
            candidate = self.normalize_candidate(candidate)
            if not self.is_valid_candidate(candidate):
                continue

            key = candidate.lower()
            if key in seen:
                continue

            seen.add(key)
            cleaned_candidates.append(candidate)

        cleaned_candidates = self.remove_child_candidates(cleaned_candidates)
        cleaned_candidates = self.remove_sub_locations(cleaned_candidates)

        cleaned_candidates.sort(
            key=lambda x: (
                -len(x.split()),
                -len(x),
            ),
        )

        return cleaned_candidates

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

        candidates = self.extract_compound_locations(text, source=source)

        for candidate in candidates:
            key = candidate.lower()
            score = SOURCE_PRIORITY.get(source, 0)

            # Phrase Bonus
            score += len(candidate.split()) * 10

            # Known entity bonus
            if candidate in KNOWN_GEOGRAPHIC_ENTITIES:
                score += 20

            # Character Bonus
            score += min(len(candidate), 20)

            if key not in storage:
                storage[key] = {
                    "candidate": candidate,
                    "sources": {source},
                    "score": score,
                }
                continue

            storage[key]["sources"].add(source)
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
            metadata.get("caption", ""),
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
            metadata.get("title", ""),
            "title",
        )

        # ------------------------------------------
        # Hashtags
        # ------------------------------------------
        hashtags = (
            metadata.get("hashtags")
            or metadata.get("tags")
            or []
        )

        for tag in hashtags:
            tag = self.normalize_candidate(
                tag.replace("#", "")
            )

            if not self.is_valid_candidate(tag):
                continue

            if tag.lower() in GENERIC_LOCATION_WORDS or tag.lower() in INVALID_SINGLE_WORDS:
                continue

            key = tag.lower()
            score = SOURCE_PRIORITY.get("hashtags", 2)
            if tag in KNOWN_GEOGRAPHIC_ENTITIES:
                score += 25

            if key not in storage:
                storage[key] = {
                    "candidate": tag,
                    "sources": {"hashtags"},
                    "score": score,
                }
            else:
                storage[key]["sources"].add("hashtags")
                storage[key]["score"] += 15

        # ------------------------------------------
        # Final Ranking
        # ------------------------------------------
        ranked = sorted(
            storage.values(),
            key=lambda item: (
                -item["score"],
                -len(item["candidate"].split()),
                -len(item["candidate"]),
                item["candidate"],
            ),
        )

        logger.info("\n========== CANDIDATE SERVICE ==========\n")
        for index, item in enumerate(ranked, start=1):
            logger.info(
                f"{index}. {item['candidate']} | Score={item['score']} | Sources={','.join(sorted(item['sources']))}"
            )
        logger.info("\n=======================================\n")

        return [item["candidate"] for item in ranked]
