import re


STOP_WORDS = {
    "following",
    "follow",
    "followers",
    "reels",
    "reel",
    "sponsored",
    "original",
    "audio",
    "liked",
    "likes",
    "comment",
    "comments",
    "share",
    "save",
    "instagram",
    "meta",
    "live",
    "subscribe",
    "watch",
    "watching",
    "video",
    "videos",
    "tap",
    "more",
    "view",
    "views",
    "loading",
    "reply",
    "messages",
}


JUNK_WORDS = {
    "rec",
    "hd",
    "hdr",
    "uhd",
    "fps",
    "4k",
    "8k",
    "fhd",
    "1080p",
    "720p",
    "60fps",
}


class OCRCleaner:

    def clean(
        self,
        text: str,
    ):

        if not text:
            return ""

        text = text.strip()

        # -------------------------
        # Remove URLs
        # -------------------------

        text = re.sub(
            r"http\S+|www\S+",
            " ",
            text,
        )

        # -------------------------
        # Remove usernames
        # -------------------------

        text = re.sub(
            r"@\w+",
            " ",
            text,
        )

        # -------------------------
        # Remove hashtags
        # -------------------------

        text = re.sub(
            r"#",
            " ",
            text,
        )

        # -------------------------
        # Remove timestamps
        # 00:14
        # 1:52
        # 12:35
        # -------------------------

        text = re.sub(
            r"\b\d{1,2}:\d{2}\b",
            " ",
            text,
        )

        # -------------------------
        # Remove page indicators
        # 1/8
        # 2/10
        # -------------------------

        text = re.sub(
            r"\b\d+/\d+\b",
            " ",
            text,
        )

        # -------------------------
        # Keep letters numbers commas
        # -------------------------

        text = re.sub(
            r"[^A-Za-z0-9,\s]",
            " ",
            text,
        )

        text = re.sub(
            r"\s+",
            " ",
            text,
        ).strip()

        if not text:
            return ""

        words = []

        for word in text.split():

            lower = word.lower()

            if lower in STOP_WORDS:
                continue

            if lower in JUNK_WORDS:
                continue

            if len(word) == 1:
                continue

            if (
                word.isupper()
                and len(word) <= 3
            ):
                continue

            if word.isdigit():
                continue

            words.append(word)

        # -------------------------
        # Remove duplicate words
        # -------------------------

        seen = set()

        cleaned = []

        for word in words:

            key = word.lower()

            if key in seen:
                continue

            seen.add(key)

            cleaned.append(word)

        return " ".join(cleaned)