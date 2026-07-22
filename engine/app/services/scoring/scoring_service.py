import re
from itertools import chain

from rapidfuzz import fuzz


COUNTRIES = {
    "austria",
    "italy",
    "france",
    "switzerland",
    "india",
    "japan",
    "norway",
    "germany",
    "spain",
    "iceland",
}

TRAVEL_KEYWORDS = {
    "valley",
    "lake",
    "beach",
    "waterfall",
    "mountain",
    "peak",
    "river",
    "forest",
    "glacier",
    "island",
    "park",
    "national",
}


class ScoringService:

    def tokenize(self, text: str) -> list[str]:
        """
        Converts text into lowercase words.
        Removes punctuation.
        """

        return re.findall(r"[a-zA-Z]+", text.lower())

    def generate_ngrams(self, words: list[str], n: int):

        return [
            " ".join(words[i:i+n])
            for i in range(len(words) - n + 1)
        ]

    def build_search_space(self, text: str):

        words = self.tokenize(text)

        return list(
            chain(
                words,
                self.generate_ngrams(words, 2),
                self.generate_ngrams(words, 3),
            )
        )

    def fuzzy_match(self, candidate: str, text: str) -> int:

        return fuzz.partial_ratio(
            candidate.lower(),
            text.lower(),
        )

    def score_against_index(
        self,
        token: str,
        index: list[str],
        high: int,
        medium: int,
        low: int,
    ):

        best = 0

        for phrase in index:

            similarity = fuzz.ratio(
                token,
                phrase,
            )

            if similarity > best:
                best = similarity

        if best >= 95:
            return high

        if best >= 85:
            return medium

        if best >= 75:
            return low

        return 0

    def rank(self, candidates, evidence):

        title = (evidence.get("title") or "").lower()
        caption = (evidence.get("caption") or "").lower()
        hashtags = " ".join(
            evidence.get("hashtags") or []
        ).lower()
        ocr = (evidence.get("ocr_text") or "").lower()
        speech = (evidence.get("speech_text") or "").lower()

        # -----------------------------------
        # Build indexes ONCE
        # -----------------------------------

        caption_index = self.build_search_space(caption)
        ocr_index = self.build_search_space(ocr)
        speech_index = self.build_search_space(speech)
        hashtag_index = self.build_search_space(hashtags)

        ranked = []

        for candidate in candidates:

            score = 0

            candidate_lower = candidate.lower()
            tokens = self.tokenize(candidate_lower)

            # -----------------------------------
            # Exact Matches
            # -----------------------------------

            if candidate_lower in title:
                score += 30

            if candidate_lower in caption:
                score += 50

            if candidate_lower in ocr:
                score += 40

            if candidate_lower in speech:
                score += 30

            if candidate_lower in hashtags:
                score += 25

            # -----------------------------------
            # Fuzzy Whole Candidate
            # -----------------------------------

            if self.fuzzy_match(candidate_lower, caption) >= 90:
                score += 20

            if self.fuzzy_match(candidate_lower, ocr) >= 90:
                score += 15

            if self.fuzzy_match(candidate_lower, speech) >= 90:
                score += 10

            # -----------------------------------
            # Token Matching
            # -----------------------------------

            for token in tokens:

                if len(token) <= 3:
                    continue

                score += self.score_against_index(
                    token,
                    caption_index,
                    20,
                    12,
                    6,
                )

                score += self.score_against_index(
                    token,
                    ocr_index,
                    15,
                    8,
                    4,
                )

                score += self.score_against_index(
                    token,
                    speech_index,
                    10,
                    6,
                    3,
                )

                score += self.score_against_index(
                    token,
                    hashtag_index,
                    10,
                    6,
                    3,
                )

            # -----------------------------------
            # Country Bonus
            # -----------------------------------

            for country in COUNTRIES:

                if (
                    country in candidate_lower
                    and country in caption
                ):
                    score += 20

            # -----------------------------------
            # Travel Keyword Bonus
            # -----------------------------------

            for keyword in TRAVEL_KEYWORDS:

                if keyword in candidate_lower:
                    score += 5

            # -----------------------------------
            # Multi-word Bonus
            # -----------------------------------

            if len(tokens) > 1:
                score += 15

            # -----------------------------------
            # Penalties
            # -----------------------------------

            if "studio" in candidate_lower:
                score -= 50

            if "video" in candidate_lower:
                score -= 50

            ranked.append(
                {
                    "name": candidate,
                    "score": score,
                }
            )

        ranked.sort(
            key=lambda x: x["score"],
            reverse=True,
        )

        return ranked