import math
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
    "pass",
    "canyon",
    "gorge",
}


GOOD_PLACE_TYPES = {

    "natural_feature": 70,

    "tourist_attraction": 65,

    "locality": 55,

    "national_park": 60,

    "park": 45,

    "mountain_peak": 60,

    "campground": 20,

    "administrative_area_level_1": 15,

    "administrative_area_level_2": 10,

}


BAD_PLACE_TYPES = {

    "restaurant",

    "cafe",

    "food",

    "bakery",

    "bar",

    "hotel",

    "lodging",

    "store",

    "shopping_mall",

    "hospital",

    "school",

    "gym",

    "bank",

    "gas_station",

    "car_dealer",

    "supermarket",

}


class ScoringService:

    # ==================================================

    def tokenize(
        self,
        text: str,
    ):

        return re.findall(
            r"[a-zA-Z]+",
            text.lower(),
        )

    # ==================================================

    def generate_ngrams(
        self,
        words,
        n,
    ):

        return [

            " ".join(words[i:i+n])

            for i in range(
                len(words)-n+1
            )

        ]

    # ==================================================

    def build_search_space(
        self,
        text,
    ):

        words = self.tokenize(text)

        return list(

            chain(

                words,

                self.generate_ngrams(
                    words,
                    2,
                ),

                self.generate_ngrams(
                    words,
                    3,
                ),

            )

        )

    # ==================================================

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

            best = max(

                best,

                fuzz.ratio(
                    token,
                    phrase,
                ),

            )

        if best >= 95:
            return high

        if best >= 85:
            return medium

        if best >= 75:
            return low

        return 0

    # ==================================================

    def normalize_score(
        self,
        score,
    ):

        score = max(
            0,
            min(
                score,
                250,
            ),
        )

        return round(
            score / 250 * 100,
            1,
        )

    # ==================================================

    def confidence(
        self,
        normalized_score,
    ):

        if normalized_score >= 95:
            return "VERIFIED"

        if normalized_score >= 90:
            return "VERY_HIGH"

        if normalized_score >= 80:
            return "HIGH"

        if normalized_score >= 70:
            return "MEDIUM"

        if normalized_score >= 60:
            return "LOW"

        return "VERY_LOW"

    # ==================================================

    def popularity_bonus(
        self,
        rating,
        reviews,
    ):

        if not rating:
            return 0

        bonus = rating * 4

        if reviews:

            bonus += math.log10(
                reviews + 1
            ) * 6

        return round(
            bonus,
        )

    # ==================================================

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
            caption,
        )

        ocr_index = self.build_search_space(
            ocr,
        )

        speech_index = self.build_search_space(
            speech,
        )

        hashtag_index = self.build_search_space(
            hashtags,
        )

        ranked = []

        for place in places:

            score = 0

            travel_name = place.get(
                "travel_name",
                "",
            ).lower()

            city = place.get(
                "city",
                "",
            ).lower()

            region = place.get(
                "region",
                "",
            ).lower()

            country = place.get(
                "country",
                "",
            ).lower()

            address = place.get(
                "address",
                "",
            ).lower()

            verified_query = place.get(
                "verified_query",
                "",
            ).lower()

            primary_type = place.get(
                "primary_type",
                "",
            )

            types = place.get(
                "types",
                [],
            )

            rating = place.get(
                "rating",
                0,
            )

            reviews = place.get(
                "user_rating_count",
                0,
            )

            business_status = place.get(
                "business_status",
                "",
            )

            searchable = " ".join([

                travel_name,

                city,

                region,

                country,

                address,

                verified_query,

            ])

            # --------------------
            # Exact Match Signals
            # --------------------

            if verified_query in caption:
                score += 50

            if travel_name in caption:
                score += 40

            if city and city in caption:
                score += 35

            if travel_name in speech:
                score += 30

            if travel_name in ocr:
                score += 25

            if travel_name in title:
                score += 20

            # --------------------
            # Fuzzy
            # --------------------

            if fuzz.partial_ratio(
                verified_query,
                caption,
            ) >= 90:
                score += 25

            if city and fuzz.partial_ratio(
                city,
                caption,
            ) >= 90:
                score += 20

            # --------------------
            # Token Matching
            # --------------------

            for token in self.tokenize(
                searchable,
            ):

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
                    speech_index,
                    18,
                    10,
                    5,
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
                    hashtag_index,
                    10,
                    6,
                    3,
                )

            # --------------------
            # Country Penalty
            # --------------------

            if travel_name == country:
                score -= 50

            # --------------------
            # Tourism Bias
            # --------------------

            if primary_type in GOOD_PLACE_TYPES:

                score += GOOD_PLACE_TYPES[
                    primary_type
                ]

            for t in types:

                if t in GOOD_PLACE_TYPES:

                    score += (

                        GOOD_PLACE_TYPES[t]

                        * 0.4

                    )

            # --------------------
            # Business Penalty
            # --------------------

            if primary_type in BAD_PLACE_TYPES:

                score -= 120

            for t in types:

                if t in BAD_PLACE_TYPES:

                    score -= 60

            # --------------------
            # Closed Place
            # --------------------

            if (
                business_status
                == "CLOSED_PERMANENTLY"
            ):

                score -= 100

            # --------------------
            # Travel Keywords
            # --------------------

            for keyword in TRAVEL_KEYWORDS:

                if keyword in searchable:

                    score += 5

            # --------------------
            # Compound Bonus
            # --------------------

            if len(
                travel_name.split()
            ) > 1:

                score += 15

            # --------------------
            # Popularity
            # --------------------

            score += self.popularity_bonus(

                rating,

                reviews,

            )

            normalized = self.normalize_score(
                score,
            )

            ranked.append(

                {

                    "place": place,

                    "raw_score": round(
                        score,
                        2,
                    ),

                    "score": normalized,

                    "confidence": self.confidence(
                        normalized,
                    ),

                }

            )

        ranked.sort(

            key=lambda x: x["score"],

            reverse=True,

        )

        return ranked