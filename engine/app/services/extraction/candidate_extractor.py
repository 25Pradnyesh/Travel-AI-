import re

STOPWORDS = {
    "save",
    "visit",
    "travel",
    "trip",
    "europe",
    "world",
    "hidden",
    "beautiful",
    "amazing",
    "place",
    "destination",
    "adventure",
    "vacation",
}


class CandidateExtractor:

    def extract(self, text: str):

        pattern = r"[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*"

        matches = re.findall(pattern, text)

        candidates = []

        for word in matches:

            if word.lower() in STOPWORDS:
                continue

            if word not in candidates:
                candidates.append(word)

        return candidates