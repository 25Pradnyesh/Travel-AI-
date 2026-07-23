import re


STOP_WORDS = {
    "this",
    "that",
    "there",
    "where",
    "everyone",
    "honestly",
    "highly",
    "recommend",
    "going",
    "small",
    "walk",
    "hike",
    "place",
    "places",
    "beautiful",
    "amazing",
    "visit",
    "today",
    "kind",
    "frame",
    "green",
    "river",
    "wooden",
    "houses",
    "background",
    "childhood",
    "drawing",
    "real",
}


class CandidateService:

    def extract_location_phrases(
        self,
        text: str,
    ):

        text = text.replace("#", " ")
        text = text.replace("📍", " ")

        words = re.findall(
            r"[A-Za-z]+",
            text,
        )

        phrases = []

        current = []

        for word in words:

            if len(word) <= 2:
                continue

            if word.lower() in STOP_WORDS:
                continue

            if word[0].isupper():

                current.append(word)

            else:

                if current:
                    phrases.append(
                        " ".join(current)
                    )
                    current = []

        if current:
            phrases.append(
                " ".join(current)
            )

        return phrases

    def generate(
        self,
        metadata: dict,
        ocr_text: str,
    ):

        candidates = []

        caption = metadata.get("caption") or ""

        candidates.extend(
            self.extract_location_phrases(
                caption
            )
        )

        if ocr_text:

            candidates.extend(
                self.extract_location_phrases(
                    ocr_text
                )
            )

        title = metadata.get("title") or ""

        if title:

            candidates.extend(
                self.extract_location_phrases(
                    title
                )
            )

        hashtags = metadata.get("tags") or []

        candidates.extend(hashtags)

        unique = []

        for candidate in candidates:

            candidate = candidate.strip()

            if (
                len(candidate) > 2
                and candidate not in unique
            ):
                unique.append(candidate)

        return unique