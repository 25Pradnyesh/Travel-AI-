import re


FILLER_PHRASES = {

    "hey guys",
    "hello guys",
    "welcome back",
    "welcome",
    "thanks for watching",
    "thank you for watching",
    "don't forget to subscribe",
    "dont forget to subscribe",
    "please subscribe",
    "subscribe",
    "like and subscribe",
    "like this video",
    "follow me",
    "follow us",
    "follow for more",
    "check the link in bio",
    "link in bio",
    "bio",
    "comment below",
    "leave a comment",
    "smash that like button",

}


FILLER_WORDS = {

    "um",
    "uh",
    "umm",
    "uhh",
    "ah",
    "oh",
    "yeah",
    "okay",
    "ok",
    "well",
    "actually",
    "basically",
    "literally",
    "honestly",
    "simply",
    "really",
    "very",
    "guys",
    "everyone",

}


class SpeechCleaner:

    def __init__(self):

        pass

    # ==================================================
    # Clean Transcript
    # ==================================================

    def clean(
        self,
        text: str,
    ) -> str:

        if not text:
            return ""

        # ------------------------------------------
        # Lower noise
        # ------------------------------------------

        text = text.replace(
            "\n",
            " ",
        )

        # URLs

        text = re.sub(
            r"http\S+|www\S+",
            " ",
            text,
        )

        # @mentions

        text = re.sub(
            r"@\w+",
            " ",
            text,
        )

        # hashtags (keep word)

        text = re.sub(
            r"#([A-Za-z0-9_]+)",
            r" \1 ",
            text,
        )

        # remove emojis / symbols

        text = re.sub(
            r"[^\w\s,.-]",
            " ",
            text,
        )

        # ------------------------------------------
        # Remove filler phrases
        # ------------------------------------------

        lowered = text.lower()

        for phrase in FILLER_PHRASES:

            lowered = lowered.replace(
                phrase,
                " ",
            )

        text = lowered

        # ------------------------------------------
        # Remove filler words
        # ------------------------------------------

        words = []

        for word in text.split():

            if word.lower() in FILLER_WORDS:
                continue

            words.append(word)

        # ------------------------------------------
        # Remove repeated consecutive words
        # Example:
        # Hallstatt Hallstatt
        # Austria Austria
        # ------------------------------------------

        deduplicated = []

        previous = None

        for word in words:

            if previous == word.lower():
                continue

            deduplicated.append(word)

            previous = word.lower()

        cleaned = " ".join(
            deduplicated
        )

        cleaned = re.sub(
            r"\s+",
            " ",
            cleaned,
        )

        return cleaned.strip()

    # ==================================================
    # Clean Whisper Segments
    # ==================================================

    def clean_segments(
        self,
        segments: list,
    ):

        cleaned_segments = []

        for segment in segments:

            text = self.clean(
                segment.get(
                    "text",
                    "",
                )
            )

            if not text:
                continue

            updated = segment.copy()

            updated["text"] = text

            cleaned_segments.append(
                updated
            )

        return cleaned_segments