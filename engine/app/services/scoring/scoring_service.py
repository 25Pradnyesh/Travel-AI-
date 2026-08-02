import math
import re
from itertools import chain

from rapidfuzz import fuzz


COUNTRIES = {
    "india",
    "japan",
    "france",
    "italy",
    "germany",
    "norway",
    "switzerland",
    "iceland",
    "spain",
    "austria",
}


TRAVEL_KEYWORDS = {
    "lake",
    "mountain",
    "peak",
    "beach",
    "waterfall",
    "river",
    "forest",
    "island",
    "park",
    "national",
    "trail",
    "hike",
    "valley",
    "summit",
    "glacier",
    "canyon",
    "gorge",
    "cliff",
    "viewpoint",
    "lookout",
    "bridge",
    "coast",
    "bay",
    "temple",
    "castle",
    "fort",
    "monument",
    "museum",
    "volcano",
    "harbor",
    "waterfront",
    "pier",
    "desert",
    "cave",
}


GOOD_PLACE_TYPES = {
    "natural_feature": 70,
    "tourist_attraction": 65,
    "national_park": 60,
    "mountain_peak": 60,
    "locality": 55,
    "park": 45,
    "campground": 20,
    "administrative_area_level_1": 15,
    "administrative_area_level_2": 10,
}


BAD_PLACE_TYPES = {
    "restaurant",
    "food",
    "cafe",
    "bar",
    "bakery",
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

    def __init__(self):
        pass

    # ==========================================================
    # Tokenizer
    # ==========================================================

    def tokenize(self, text: str):

        if not text:
            return []

        return re.findall(
            r"[A-Za-z]+",
            text.lower(),
        )

    # ==========================================================
    # Ngrams
    # ==========================================================

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

    # ==========================================================
    # Search Index
    # ==========================================================

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

    # ==========================================================
    # Token Score
    # ==========================================================

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

    # ==========================================================
    # Popularity
    # ==========================================================

    def popularity_bonus(

        self,

        rating,

        reviews,

    ):

        if not rating:
            return 0

        bonus = rating * 6

        if reviews:

            bonus += min(

                math.log10(
                    reviews + 1
                ) * 8,

                30,

            )

        return round(

            bonus,

            2,

        )

    # ==========================================================
    # Normalize
    # ==========================================================

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

    # ==========================================================
    # Confidence
    # ==========================================================

    def confidence(

        self,

        score,

    ):

        if score >= 95:
            return "VERIFIED"

        if score >= 90:
            return "VERY_HIGH"

        if score >= 80:
            return "HIGH"

        if score >= 70:
            return "MEDIUM"

        if score >= 60:
            return "LOW"

        return "VERY_LOW"

    # ==========================================================
    # Ranking
    # ==========================================================

    def rank_places(

        self,

        places,

        evidence,

    ):

        title = (evidence.get("title") or "").lower()

        caption = (evidence.get("caption") or "").lower()

        speech = (evidence.get("speech_text") or "").lower()

        ocr = (evidence.get("ocr_text") or "").lower()

        hashtags = " ".join(

            evidence.get("hashtags") or []

        ).lower()

        title_index = self.build_search_space(title)

        caption_index = self.build_search_space(caption)

        speech_index = self.build_search_space(speech)

        ocr_index = self.build_search_space(ocr)

        hashtag_index = self.build_search_space(hashtags)

        ranked = []

        for place in places:

            score = 0

            matched_sources = set()

            matched_terms = set()

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
            ).lower()

            types = [

                t.lower()

                for t in place.get(
                    "types",
                    [],
                )

            ]

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

            editorial_summary = place.get(
                "editorial_summary",
                "",
            )

            photos = place.get(
                "photos",
                [],
            )

            website = place.get(
                "website",
                "",
            )

            price_level = place.get(
                "price_level",
                None,
            )

            nearby_landmarks = " ".join(
                place.get(
                    "nearby_landmarks",
                    []
                )
            )

            searchable = " ".join(filter(None, [
                travel_name,
                city,
                region,
                country,
                address,
                verified_query,
                editorial_summary,
                nearby_landmarks,
            ]))

            # ==========================================================
            # Exact Match Signals
            # ==========================================================

            if verified_query and verified_query in caption:
                score += 50
                matched_sources.add("caption")
                matched_terms.add(verified_query)

            if travel_name and travel_name in caption:
                score += 40
                matched_sources.add("caption")
                matched_terms.add(travel_name)

            if city and city in caption:
                score += 35
                matched_sources.add("caption")
                matched_terms.add(city)

            if travel_name and travel_name in speech:
                score += 30
                matched_sources.add("speech")
                matched_terms.add(travel_name)

            if travel_name and travel_name in ocr:
                score += 25
                matched_sources.add("ocr")
                matched_terms.add(travel_name)

            if travel_name and travel_name in title:
                score += 20
                matched_sources.add("title")
                matched_terms.add(travel_name)

            # ==========================================================
            # Fuzzy Matching
            # ==========================================================

            if (
                verified_query
                and
                fuzz.partial_ratio(
                    verified_query,
                    caption,
                ) >= 90
            ):
                score += 25
                matched_sources.add("caption")
                matched_terms.add(verified_query)

            if (
                city
                and
                fuzz.partial_ratio(
                    city,
                    caption,
                ) >= 90
            ):
                score += 20
                matched_sources.add("caption")
                matched_terms.add(city)

                # ==========================================================
                # Token Matching
                # ==========================================================

                for token in self.tokenize(searchable):

                    if len(token) <= 3:
                        continue

                    # ----------------------------
                    # Title
                    # ----------------------------

                    gained = self.score_index(
                        token,
                        title_index,
                        15,
                        8,
                        4,
                    )

                    if gained:
                        matched_sources.add("title")
                        matched_terms.add(token)

                    score += gained

                    # ----------------------------
                    # Caption
                    # ----------------------------

                    gained = self.score_index(
                        token,
                        caption_index,
                        20,
                        12,
                        6,
                    )

                    if gained:
                        matched_sources.add("caption")
                        matched_terms.add(token)

                    score += gained

                    # ----------------------------
                    # Speech
                    # ----------------------------

                    gained = self.score_index(
                        token,
                        speech_index,
                        18,
                        10,
                        5,
                    )

                    if gained:
                        matched_sources.add("speech")
                        matched_terms.add(token)

                    score += gained

                    # ----------------------------
                    # OCR
                    # ----------------------------

                    gained = self.score_index(
                        token,
                        ocr_index,
                        15,
                        8,
                        4,
                    )

                    if gained:
                        matched_sources.add("ocr")
                        matched_terms.add(token)

                    score += gained

                    # ----------------------------
                    # Hashtags
                    # ----------------------------

                    gained = self.score_index(
                        token,
                        hashtag_index,
                        10,
                        6,
                        3,
                    )

                    if gained:
                        matched_sources.add("hashtags")
                        matched_terms.add(token)

                    score += gained


            # ==========================================================
            # Country Consistency
            # ==========================================================

            if (
                travel_name == country
                and
                primary_type != "country"
            ):
                score -= 50

            combined_sources = " ".join([
                caption,
                speech,
                ocr,
            ])

            for known_country in COUNTRIES:

                if known_country in combined_sources:

                    if known_country == country:
                        score += 10
                    else:
                        score -= 8

            # ==========================================================
            # Tourism Bias
            # ==========================================================

            if primary_type in GOOD_PLACE_TYPES:

                score += GOOD_PLACE_TYPES[
                    primary_type
                ]

            for t in types:

                if t in GOOD_PLACE_TYPES:

                    score += (
                        GOOD_PLACE_TYPES[t] * 0.4
                    )

            # ==========================================================
            # Business Penalty
            # ==========================================================

            if primary_type in BAD_PLACE_TYPES:
                score -= 120

            for t in types:

                if t in BAD_PLACE_TYPES:
                    score -= 60

            if (
                business_status ==
                "CLOSED_PERMANENTLY"
            ):
                score -= 100

            # ==========================================================
            # Travel Keywords
            # ==========================================================

            for keyword in TRAVEL_KEYWORDS:

                if (
                    keyword in searchable
                    and
                    keyword in combined_sources
                ):
                    score += 5
            # ==========================================================
            # Name Complexity Bonus
            # ==========================================================

            words = travel_name.split()

            if len(words) == 2:
                score += 12

            elif len(words) >= 3:
                score += 20
            

            # ==========================================================
            # Popularity
            # ==========================================================

            score += self.popularity_bonus(
                rating,
                reviews,
            )

            # ==========================================================
            # Editorial Summary
            # ==========================================================

            if editorial_summary:
                score += 15

            # ==========================================================
            # Photos
            # ==========================================================

            if photos:

                score += min(
                    len(photos) * 2,
                    12,
                )

            # ==========================================================
            # Official Website
            # ==========================================================

            if website:
                score += 4

            # ==========================================================
            # Price Level
            # ==========================================================

            if price_level is not None:
                score += 2

            # ==========================================================
            # Cross Evidence Bonus
            # ==========================================================

            evidence_bonus = len(
                matched_sources
            ) * 5

            score += evidence_bonus

            # ==========================================================
            # Normalize
            # ==========================================================

            normalized = self.normalize_score(
                score,
            )

            # ==========================================================
            # Store Evidence
            # ==========================================================

            place["matched_sources"] = sorted(
                matched_sources,
            )

            place["matched_terms"] = sorted(
                matched_terms,
            )

            place["evidence_count"] = len(
                matched_sources,
            )

            place["match_strength"] = normalized

            # ==========================================================
            # Append
            # ==========================================================

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

        # ==========================================================
        # Final Ranking
        # ==========================================================

        ranked.sort(
            key=lambda x: (
                x["score"],
                x["place"].get(
                    "rating",
                    0,
                ),
                x["place"].get(
                    "user_rating_count",
                    0,
                ),
            ),
            reverse=True,
        )

        # ==========================================================
        # Rank Numbers
        # ==========================================================

        for index, item in enumerate(
            ranked,
            start=1,
        ):

            item["rank"] = index

        # ==========================================================
        # Debug Logging
        # ==========================================================

        print(
            "\n========== SCORING ==========\n"
        )

        for item in ranked:

            place = item["place"]

            print(
                f"{item['rank']}. "
                f"{place.get('travel_name','Unknown')} "
                f"| Score={item['score']} "
                f"| Raw={item['raw_score']} "
                f"| {item['confidence']}"
            )

            print(
                f"   Sources : "
                f"{', '.join(place.get('matched_sources', []))}"
            )

            print(
                f"   Terms   : "
                f"{', '.join(place.get('matched_terms', []))}"
            )

        print(
            "\n====================================\n"
        )

        return ranked