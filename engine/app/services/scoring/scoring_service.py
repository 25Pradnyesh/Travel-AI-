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
    "hike",
    "trail",
}


class ScoringService:

    def tokenize(self, text: str):

        return re.findall(
            r"[a-zA-Z]+",
            text.lower(),
        )

    def generate_ngrams(
        self,
        words,
        n,
    ):

        return [
            " ".join(words[i:i + n])
            for i in range(
                len(words) - n + 1
            )
        ]

    def build_search_space(
        self,
        text,
    ):

        words = self.tokenize(text)

        return list(
            chain(
                words,
                self.generate_ngrams(words, 2),
                self.generate_ngrams(words, 3),
            )
        )

    def score_index(
        self,
        token,
        index,
        high,
        medium,
        low,
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

    def confidence(
        self,
        score,
    ):

        if score >= 140:
            return "HIGH"

        if score >= 90:
            return "MEDIUM"

        return "LOW"

    def rank_places(
        self,
        places,
        evidence,
    ):

        title = (
            evidence.get("title") or ""
        ).lower()

        caption = (
            evidence.get("caption") or ""
        ).lower()

        ocr = (
            evidence.get("ocr_text") or ""
        ).lower()

        speech = (
            evidence.get("speech_text") or ""
        ).lower()

        hashtags = " ".join(
            evidence.get("hashtags") or []
        ).lower()

        caption_index = self.build_search_space(
            caption
        )

        ocr_index = self.build_search_space(
            ocr
        )

        speech_index = self.build_search_space(
            speech
        )

        hashtag_index = self.build_search_space(
            hashtags
        )

        ranked = []

        for place in places:

            score = 0

            travel_name = (
                place.get(
                    "travel_name",
                    "",
                ).lower()
            )

            city = (
                place.get(
                    "city",
                    "",
                ).lower()
            )

            region = (
                place.get(
                    "region",
                    "",
                ).lower()
            )

            country = (
                place.get(
                    "country",
                    "",
                ).lower()
            )

            address = (
                place.get(
                    "address",
                    "",
                ).lower()
            )

            verified_query = (
                place.get(
                    "verified_query",
                    "",
                ).lower()
            )

            searchable = " ".join([
                travel_name,
                city,
                region,
                country,
                address,
                verified_query,
            ])

            # ------------------------
            # Exact matches
            # ------------------------

            if travel_name in caption:
                score += 50

            if city and city in caption:
                score += 35

            if region and region in caption:
                score += 35

            if country and country in caption:
                score += 25

            if verified_query in caption:
                score += 40

            if address in caption:
                score += 20

            if travel_name in title:
                score += 20

            if travel_name in ocr:
                score += 30

            if travel_name in speech:
                score += 25

            # ------------------------
            # Fuzzy travel name
            # ------------------------

            if fuzz.partial_ratio(
                travel_name,
                caption,
            ) >= 90:

                score += 30

            if fuzz.partial_ratio(
                city,
                caption,
            ) >= 90:

                score += 20

            if region:

                if fuzz.partial_ratio(
                    region,
                    caption,
                ) >= 90:

                    score += 20

            # ------------------------
            # Token scoring
            # ------------------------

            tokens = self.tokenize(
                searchable
            )

            for token in tokens:

                if len(token) <= 3:
                    continue

                score += self.score_index(
                    token,
                    caption_index,
                    20,
                    12,
                    6,
                )

                score += self.score_index(
                    token,
                    ocr_index,
                    15,
                    8,
                    4,
                )

                score += self.score_index(
                    token,
                    speech_index,
                    10,
                    6,
                    3,
                )

                score += self.score_index(
                    token,
                    hashtag_index,
                    10,
                    6,
                    3,
                )

            # ------------------------
            # Country consistency
            # ------------------------

            for known_country in COUNTRIES:

                if known_country in caption:

                    if known_country == country:

                        score += 20

                    else:

                        score -= 15

            # ------------------------
            # Travel keywords
            # ------------------------

            for keyword in TRAVEL_KEYWORDS:

                if keyword in searchable:

                    score += 5

            # ------------------------
            # Multi-word bonus
            # ------------------------

            if len(travel_name.split()) > 1:
                score += 15

            ranked.append(
                {
                    "place": place,
                    "score": score,
                    "confidence": self.confidence(
                        score
                    ),
                }
            )

        ranked.sort(
            key=lambda x: x["score"],
            reverse=True,
        )

        return ranked