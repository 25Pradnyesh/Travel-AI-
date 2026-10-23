import difflib
import logging
import re
from typing import Any

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
    "paradise",
    "spot",
    "spots",
    "place",
    "places",
    "destination",
    "destinations",
    "gem",
    "gems",
    "corner",
    "corners",
    "haven",
    "oasis",
    "wonder",
    "wonders",
    "location",
    "locations",
    "area",
    "areas",
    "region",
    "regions",
    "site",
    "sites",
    "attraction",
    "attractions",
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
    "explore",
    "exploring",
    "discover",
    "discovering",
    "capturing",
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
    "find",
    "finding",
    "saw",
    "see",
    "seeing",
    "visited",
    "visit",
    "explored",
    "explore",
    "discovered",
    "discover",
    "shot",
    "shooting",
    "headed",
    "traveled",
    "travelled",
    "travelling",
    "traveling",
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
    "i",
    "me",
    "my",
    "myself",
    "we",
    "us",
    "our",
    "ours",
    "ourselves",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves",
    "he",
    "him",
    "his",
    "himself",
    "she",
    "her",
    "hers",
    "herself",
    "it",
    "its",
    "itself",
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

SOCIAL_AND_GENERAL_WORDS = {
    "friend",
    "friends",
    "vibe",
    "vibes",
    "fun",
    "love",
    "smile",
    "smiles",
    "happy",
    "memory",
    "memories",
    "life",
    "lifestyle",
    "style",
    "look",
    "looks",
    "outfit",
    "ootd",
    "girl",
    "girls",
    "boy",
    "boys",
    "family",
    "crew",
    "squad",
    "team",
    "people",
    "sun",
    "sunset",
    "sunsets",
    "sunrise",
    "sky",
    "cloud",
    "clouds",
    "weather",
    "food",
    "coffee",
    "drink",
    "drinks",
    "dinner",
    "lunch",
    "breakfast",
    "brunch",
    "fitness",
    "gym",
    "workout",
    "fit",
    "health",
    "wellness",
    "music",
    "dance",
    "song",
    "party",
    "nightlife",
    "mood",
    "energy",
    "aesthetic",
    "art",
    "photo",
    "photos",
    "photography",
    "photographer",
    "video",
    "videos",
    "reels",
    "reel",
    "dog",
    "dogs",
    "cat",
    "cats",
    "pet",
    "pets",
    "animal",
    "animals",
    "car",
    "cars",
    "bike",
    "bikes",
    "ride",
    "drive",
    "fashion",
    "beauty",
    "hair",
    "makeup",
    "moment",
    "moments",
    "day",
    "days",
    "trip",
    "trips",
    "travel",
    "travels",
    "traveler",
    "travelers",
    "nature",
    "wild",
    "adventure",
    "wanderlust",
    "peace",
    "blessed",
    "gratitude",
    "goals",
    "inspo",
    "inspiration",
}

INVALID_SINGLE_WORDS = (
    STOP_WORDS
    | COMMON_VERBS_AND_PARTICIPLES
    | DEMONYM_ADJECTIVES
    | DETERMINERS_AND_PRONOUNS
    | BOILERPLATE_WORDS
    | TEMPORAL_WORDS
    | SOCIAL_AND_GENERAL_WORDS
)

DESCRIPTIVE_MODIFIERS = {
    "hidden",
    "secret",
    "incredible",
    "amazing",
    "beautiful",
    "breathtaking",
    "stunning",
    "magical",
    "unreal",
    "epic",
    "best",
    "top",
    "favorite",
    "favourite",
    "famous",
    "ancient",
    "historic",
    "historical",
    "old",
    "new",
    "little",
    "great",
    "small",
    "big",
    "pure",
    "real",
    "true",
    "lost",
    "undiscovered",
    "gorgeous",
    "picturesque",
    "charming",
}

ALL_NON_PROPER_WORDS = (
    GENERIC_LOCATION_WORDS
    | INVALID_SINGLE_WORDS
    | DESCRIPTIVE_MODIFIERS
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
    "Dali",
    "Erhai",
    "Yunnan",
    "Lijiang",
}

# Include recognized world countries as geographic entities
KNOWN_GEOGRAPHIC_ENTITIES.update(
    {c.title() for c in COUNTRIES if len(c) > 2}
)

KNOWN_GEOGRAPHIC_ENTITIES_LOWER = {e.lower() for e in KNOWN_GEOGRAPHIC_ENTITIES}


# ==================================================
# Strong Compound Patterns
# ==================================================

KEYWORD_PATTERNS = [
    r"((?:(?:[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+|St\.|Mt\.)(?:\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+)*\s+)?National\s+Park)",
    r"((?:Mount|Mt\.?|Lake|Cape|Point|Bay|River|Gulf|Loch|Isle)\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+(?:\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+)*)",
    r"((?:St\.?\s+)?[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+(?:'s)?(?:\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+)*\s+(?:Cathedral|Cathederal|Shrine|Church|Basilica|Abbey|Monastery)(?:\s*\([A-Za-z0-9'\s\.]+\))?)",
    r"((?:The\s+)?[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']*(?:\s+(?:of|the|de|di|du|d'|and|&|[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']*))*\s+(?i:Lake|Loch|Mill|Bridge|Tower|Castle|Palace|Fort|Waterfall|Falls|Beach|Island|Forest|Rainforest|Valley|Peak|Pass|Canyon|Gorge|Recreation\s+Area))",
    r"(Lago\s+di\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+(?:\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+)*)",
    r"(Val\s+di\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+(?:\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+)*)",
    r"((?:[Ss]alto|[Cc]ascada|[Cc]ataratas)\s+(?:de\s+|del\s+|el\s+)?[a-zA-Z\u00C0-\u024F]+(?:\s+[a-zA-Z\u00C0-\u024F]+)*)",
    r"(Isola\s+di\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+(?:\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+)*)",
    r"(Swiss\s+Alps)",
]


# ==================================================
# Contextual Location Triggers
# ==================================================

LOCATION_TRIGGER_PATTERNS = [
    r"(?i:trip to|travel to|welcome to|visiting|visit to|explore|exploring|heart of|hidden in|located in|situated in|drive to|road trip to|road trip from|heading to|escape to|flight to|fly to)\s+((?:St\.\s+|Mt\.\s+)?[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+(?:\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+){0,3}(?:,\s*[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+)*)",
    r"(?i:places in|destinations in|best of|gems in)\s+((?:St\.\s+|Mt\.\s+)?[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+(?:\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+){0,3}(?:,\s*[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+)*)",
    r"(?i:\b(?:at|in|near|around)\s+)((?:St\.\s+|Mt\.\s+)?[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+(?:\s+[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F0-9']+){0,2}(?:,\s*[A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+)?)",
    r"([A-Z\u00C0-\u00DC][a-zA-Z\u00C0-\u024F]+)\s+(?i:is\s+(?:one\s+of|a|an)\s+(?:the\s+)?(?:oldest|most|best|famous|beautiful|inhabited|ancient)?\s*(?:cities|city|towns|town|places|place|destinations|destination|villages|village|countries|country))\b",
]


# ==================================================
# ==================================================
# Source Priority
# ==================================================

SOURCE_PRIORITY = {
    "metadata": 10,
    "pin": 8,
    "hashtags": 6,
    "caption": 5,
    "title": 4,
    "ocr": 3,
    "speech": 2,
}

# Catchphrases and non-geographic social media expressions to systematically reject
CATCHPHRASES = {
    "planning a trip", "planning a trip to", "built in", "contact for licensing",
    "found this secret", "save this for later", "save this reel", "save this",
    "link in bio", "comment below", "things to do in", "places to visit",
    "explore the world", "wanderlust", "travelgram", "bucket list",
    "hidden paradise", "secret paradise", "day in my life", "travel guide",
    "follow for more", "send this to", "share this with", "click the link",
    "dm for details", "free guide", "best places to", "top places to",
    "trip of a lifetime", "where to stay", "what to do", "secret spot",
    "hidden gems", "hidden gem", "best views in", "check this out",
    "catch flights not feelings", "catch flights", "best summer ever",
}


def detect_script(text: str) -> dict[str, Any]:
    """
    Detects non-Latin Unicode scripts from evidence text.
    Returns dictionary with:
    - script: name of script ('hangul', 'japanese', 'chinese', 'cyrillic', 'arabic', 'latin')
    - country_hint: 2-letter ISO country code or None ('KR', 'JP', 'CN', 'RU', 'AE')
    - whisper_lang: 2-letter language code for Whisper transcription ('ko', 'ja', 'zh', 'ru', 'ar', 'en')
    - accept_language: Accept-Language header value for Nominatim ('ko,en', 'ja,en', etc.)
    """
    if not text:
        return {"script": "latin", "country_hint": None, "whisper_lang": "en", "accept_language": "en"}

    # Hangul (Korean)
    if re.search(r"[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]", text):
        return {"script": "hangul", "country_hint": "KR", "whisper_lang": "ko", "accept_language": "ko,en"}

    # Japanese (Hiragana / Katakana)
    if re.search(r"[\u3040-\u309f\u30a0-\u30ff]", text):
        return {"script": "japanese", "country_hint": "JP", "whisper_lang": "ja", "accept_language": "ja,en"}

    # Chinese (Hanzi without Kana)
    if re.search(r"[\u4e00-\u9fff]", text):
        return {"script": "chinese", "country_hint": "CN", "whisper_lang": "zh", "accept_language": "zh,en"}

    # Cyrillic (Russian, Ukrainian, Kazakh, Bulgarian)
    if re.search(r"[\u0400-\u04ff]", text):
        return {"script": "cyrillic", "country_hint": "RU", "whisper_lang": "ru", "accept_language": "ru,en"}

    # Arabic
    if re.search(r"[\u0600-\u06ff]", text):
        return {"script": "arabic", "country_hint": "AE", "whisper_lang": "ar", "accept_language": "ar,en"}

    return {"script": "latin", "country_hint": None, "whisper_lang": "en", "accept_language": "en"}


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

        # Preserve word characters (including non-Latin Unicode), whitespace, newlines, commas, periods, hyphens, single quotes, pin, # and parentheses
        text = re.sub(
            r"[^\w\s,\.\n📍#\'\(\)-]",
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

    def strip_leading_words(
        self,
        text: str,
    ) -> str:
        words = text.split()
        strip_tokens = (
            STOP_WORDS
            | COMMON_VERBS_AND_PARTICIPLES
            | DETERMINERS_AND_PRONOUNS
            | {"the", "a", "an", "this", "that", "in", "at", "to", "from", "on", "into", "our", "my", "your"}
        ) - BOILERPLATE_WORDS
        while words and words[0].lower() in strip_tokens:
            if words[0] in ("The", "St.", "Mt.", "San", "Santa", "El", "La", "Le", "Isla", "Val", "Lago") and len(words) > 1 and words[1][0].isupper():
                break
            words = words[1:]
        return " ".join(words)

    # ==================================================
    # Normalize
    # ==================================================

    def normalize_candidate(
        self,
        candidate: str,
    ) -> str:
        candidate = self.deduplicate_words(candidate)
        candidate = self.strip_leading_words(candidate)
        candidate = re.sub(r"\s+", " ", candidate).strip()
        # Strip trailing possessives without stripping internal apostrophes (e.g. "South Korea's" -> "South Korea", but preserve "St. Joseph's Cathedral")
        candidate = re.sub(r"['’]s$", "", candidate, flags=re.IGNORECASE)
        candidate = re.sub(r"(?<=[a-zA-Z])['’]$", "", candidate)
        return candidate.strip(" ,.-'\"")

    # ==================================================
    # Validation
    # ==================================================

    def is_valid_candidate(
        self,
        candidate: str,
    ) -> bool:
        if not candidate:
            return False

        raw_lower = candidate.lower().strip()
        if raw_lower in CATCHPHRASES or any(cp in raw_lower for cp in CATCHPHRASES):
            return False

        candidate = self.normalize_candidate(candidate)
        lower = candidate.lower()
        if not lower:
            return False

        if lower in CATCHPHRASES or any(cp in lower for cp in CATCHPHRASES):
            return False

        is_non_latin = bool(re.search(r"[\uac00-\ud7a3\u4e00-\u9fff\u3040-\u30ff\u0600-\u06ff\u0400-\u04ff]", candidate))
        min_len = 2 if is_non_latin else 3
        if len(lower) < min_len:
            return False

        if lower in INVALID_SINGLE_WORDS or lower in GENERIC_LOCATION_WORDS:
            return False

        words = lower.split()
        if not words:
            return False

        # Reject if starts with a boilerplate/non-location indicator
        if words[0] in BOILERPLATE_WORDS:
            return False

        # Multi-part candidate (e.g. "Varenna, Lake Como"): at least one segment must contain a proper entity
        comma_parts = [p.strip() for p in lower.split(",") if p.strip()]
        if len(comma_parts) > 1:
            has_proper_part = any(
                any(w not in ALL_NON_PROPER_WORDS for w in part.split())
                for part in comma_parts
            )
            if not has_proper_part:
                return False
        else:
            # Single-part: MUST contain at least one distinguishing word that is NOT generic, NOT a verb/stop word, and NOT a descriptive modifier
            # Systematically rejects "Found Lake", "Hidden Paradise", "Beautiful Beach", "Explore Mountain", "Found Waterfalls", etc.
            if all(word in ALL_NON_PROPER_WORDS for word in words):
                return False

        if candidate.isdigit():
            return False

        if candidate.isupper() and len(candidate) <= 4 and candidate not in ("USA", "UK"):
            return False

        # Single word validation: must not be in generic, stop, verb, demonym, boilerplate, or temporal sets
        if len(words) == 1:
            if words[0] in GENERIC_LOCATION_WORDS or words[0] in INVALID_SINGLE_WORDS or words[0] in DESCRIPTIVE_MODIFIERS:
                return False

        return True

    def extract_from_text(
        self,
        text: str,
        source: str = "caption",
    ) -> list[str]:
        """Convenience method to extract candidates directly from a string."""
        storage = {}
        self.add_candidates(storage, text, source)
        return [item["candidate"] for item in storage.values()]

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
                    # Preserve individual constituent parts if existing is hierarchical (e.g. "Varenna, Lake Como" preserves both "Varenna" and "Lake Como")
                    if "," in existing:
                        parts_lower = [p.strip().lower() for p in existing.split(",") if p.strip()]
                        if parts_lower and lower in parts_lower:
                            continue
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
                        if "," in other:
                            parts_lower = [p.strip().lower() for p in other.split(",") if p.strip()]
                            if parts_lower and candidate.lower() in parts_lower:
                                continue
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

            # Split on note separators and emojis
            segments = re.split(r"\s+[-–—|•]\s+|\s*\(|\s*[#🌊🕰️⚠️✨📸🏖️🌴🏔️🏰⛩️🏛️🗺️]", content)
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
            parts = [pt.strip() for pt in pin.split(",") if len(pt.strip()) >= 2]
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
        # 2b. Delimiter-separated locations line-by-line (e.g. "Jeju Island - South Korea")
        # ------------------------------------------
        for line in cleaned.splitlines():
            delimiter_matches = re.findall(
                r"\b([A-Za-z0-9'\.]+(?:\s+[A-Za-z0-9'\.]+)*)\s+[-–—|•]\s+([A-Za-z0-9'\.]+(?:\s+[A-Za-z0-9'\.]+)*)\b",
                line,
            )
            for p1, p2 in delimiter_matches:
                p1_clean = p1.strip()
                words2 = p2.split()
                for k in range(min(3, len(words2)), 0, -1):
                    sub_country = " ".join(words2[:k])
                    sub_clean = re.sub(r"['’]s$", "", sub_country, flags=re.IGNORECASE).strip()
                    if sub_clean.lower() in COUNTRIES and self.is_valid_candidate(p1_clean):
                        compound = f"{p1_clean}, {sub_clean}"
                        candidates.append(compound)
                        candidates.append(p1_clean)
                        candidates.append(sub_clean)
                        break

        # ------------------------------------------
        # 2c. Hierarchical "in" relationships (e.g. "Erhai Lake in Dali, China")
        # ------------------------------------------
        for line in cleaned.splitlines():
            in_matches = re.findall(
                r"\b([A-Z][A-Za-z0-9'\.]+(?:\s+[A-Z][A-Za-z0-9'\.]+)*)\s+in\s+([A-Z][A-Za-z0-9'\.]+(?:\s+[A-Z][A-Za-z0-9'\.]+)*(?:,\s*[A-Z][A-Za-z]+)*)\b",
                line,
            )
            for p1, p2 in in_matches:
                p1_clean = p1.strip()
                p2_clean = p2.strip()
                words1 = p1_clean.split()
                if words1 and words1[0].lower() in INVALID_SINGLE_WORDS:
                    if len(words1) >= 2:
                        p1_clean = " ".join(words1[1:])
                if self.is_valid_candidate(p1_clean) and self.is_valid_candidate(p2_clean):
                    candidates.append(f"{p1_clean}, {p2_clean}")
                    candidates.append(p1_clean)
                    candidates.append(p2_clean)

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
                    cand = self.strip_leading_words(cand)
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
                cand_ttw = self.strip_leading_words(ttw)
                if self.is_valid_candidate(cand_ttw):
                    candidates.append(cand_ttw)

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
                    if w in GENERIC_LOCATION_WORDS or w in INVALID_SINGLE_WORDS:
                        continue
                    if len(w) >= 4 and abs(len(w) - len(geo_lower)) <= 2:
                        ratio = difflib.SequenceMatcher(None, w, geo_lower).ratio()
                        if ratio >= 0.70:
                            candidates.append(geo)
                            break

        # ------------------------------------------
        # 7. Non-Latin Unicode Script Extraction (Hangul, Hanzi/Kanji, Cyrillic, Arabic)
        # ------------------------------------------
        hangul_matches = re.findall(r"[\uac00-\ud7a3]{2,}", cleaned)
        for hm in hangul_matches:
            if self.is_valid_candidate(hm):
                candidates.append(hm)

        hanzi_matches = re.findall(r"[\u4e00-\u9fff]{2,}", cleaned)
        for hzm in hanzi_matches:
            if self.is_valid_candidate(hzm):
                candidates.append(hzm)

        cyrillic_matches = re.findall(r"[\u0400-\u04ff]{2,}", cleaned)
        for cym in cyrillic_matches:
            if self.is_valid_candidate(cym):
                candidates.append(cym)

        arabic_matches = re.findall(r"[\u0600-\u06ff]{2,}", cleaned)
        for arm in arabic_matches:
            if self.is_valid_candidate(arm):
                candidates.append(arm)

        # ------------------------------------------
        # 8. Hashtags inside text
        # ------------------------------------------
        tag_matches = re.findall(r"#([\w\uac00-\ud7a3\u4e00-\u9fff\u0400-\u04ff\u0600-\u06ff]{2,})", text)
        for tag in tag_matches:
            # Check for camelCase split: e.g. "LakeComo" -> "Lake Como"
            split_tag = re.sub(r"([a-z])([A-Z])", r"\1 \2", tag).strip()
            # Also check lowercase compound words like "lakecomo"
            if split_tag.lower() == "lakecomo":
                split_tag = "Lake Como"
            tag_clean = self.normalize_candidate(split_tag)
            if self.is_valid_candidate(tag_clean):
                candidates.append(tag_clean)


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

            is_country = (
                key in COUNTRIES
                or candidate.lower() in COUNTRIES
                or ("," in key and key.split(",")[-1].strip() in COUNTRIES and len(key.split(",")) == 1)
            )

            # Phrase Bonus (multi-word destinations)
            score += len(candidate.split()) * 10

            # Known entity bonus (specific destinations only, never broad countries)
            if candidate in KNOWN_GEOGRAPHIC_ENTITIES and not is_country:
                score += 20

            # Country penalty in candidate generation: specific destinations must rank ahead of generic countries
            if is_country:
                score -= 30

            # Landmark / POI Bonus: prioritize specific physical landmarks over generic cities/countries
            cand_lower_words = set(key.replace(",", " ").split())
            poi_words = {"lake", "waterfall", "falls", "beach", "island", "mountain", "peak", "valley", "canyon", "temple", "shrine", "cathedral", "castle", "palace", "fort", "park"}
            if cand_lower_words & poi_words:
                score += 25

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

            # A single-word hashtag must not be an uncorroborated generic social tag.
            # Require it to be in KNOWN_GEOGRAPHIC_ENTITIES, end with a travel suffix,
            # or be corroborated by other evidence text (caption, speech, ocr, title).
            if len(tag.split()) == 1:
                cand_lower = tag.lower()
                is_known_geo = cand_lower in KNOWN_GEOGRAPHIC_ENTITIES_LOWER or cand_lower in COUNTRIES
                has_loc_suffix = any(cand_lower.endswith(sfx) for sfx in ("island", "beach", "lake", "mountain", "falls", "valley", "canyon", "city", "park"))
                is_corroborated = (
                    cand_lower in metadata.get("caption", "").lower()
                    or cand_lower in speech_text.lower()
                    or cand_lower in ocr_text.lower()
                    or cand_lower in metadata.get("title", "").lower()
                )
                if not (is_known_geo or has_loc_suffix or is_corroborated):
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
