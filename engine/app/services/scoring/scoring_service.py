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
    "slovenia",
    "kazakhstan",
    "usa",
    "united states",
    "uk",
    "united kingdom",
    "england",
    "china",
    "australia",
    "canada",
    "indonesia",
    "thailand",
    "vietnam",
    "mexico",
    "brazil",
    "portugal",
    "greece",
    "turkey",
    "egypt",
    "morocco",
    "south africa",
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
    "church": 50,
    "place_of_worship": 50,
    "historical_landmark": 50,
    "park": 45,
    "campground": 20,
    "administrative_area_level_1": 15,
    "administrative_area_level_2": 10,
}


BAD_PLACE_TYPES = {
    # Food & Dining
    "restaurant",
    "food",
    "cafe",
    "bar",
    "bakery",
    "meal_takeaway",
    "meal_delivery",

    # Lodging
    "hotel",
    "lodging",
    "motel",

    # Retail & Commercial
    "store",
    "shopping_mall",
    "supermarket",
    "convenience_store",
    "grocery_store",
    "clothing_store",
    "shoe_store",
    "electronics_store",
    "home_goods_store",
    "furniture_store",
    "hardware_store",
    "florist",
    "pet_store",
    "liquor_store",

    # Healthcare & Education
    "hospital",
    "doctor",
    "dentist",
    "pharmacy",
    "veterinary_care",
    "school",
    "university",
    "preschool",

    # Fitness & Beauty
    "gym",
    "beauty_salon",
    "hair_care",
    "spa",

    # Financial & Legal
    "bank",
    "atm",
    "accounting",
    "insurance_agency",
    "lawyer",
    "real_estate_agency",

    # Automotive & Utility
    "gas_station",
    "car_dealer",
    "car_repair",
    "car_wash",
    "car_rental",
    "laundry",
    "dry_cleaning",
    "storage",
    "moving_company",
    "plumber",
    "electrician",
    "roofing_contractor",
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

        for raw_item in places:
            if not isinstance(raw_item, dict):
                continue
            place = raw_item.get("place", raw_item)
            if not isinstance(place, dict):
                continue

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
                if len(verified_query.split()) > 1:
                    score += 50
                elif primary_type in GOOD_PLACE_TYPES or any(t in GOOD_PLACE_TYPES for t in types):
                    score += 35
                else:
                    score += 15
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

            # Caption Primacy Bonus: Primary subjects are introduced in the opening hook
            pos = caption.find(verified_query) if verified_query else -1
            if pos == -1 and travel_name:
                first_part = travel_name.split(",")[0].strip()
                pos = caption.find(first_part)
            if pos != -1 and pos < 120:
                score += 25

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

            for token in set(self.tokenize(searchable)):

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

            # Extract distinct mentioned countries with word boundary matching
            evidence_countries = set()
            for known_country in COUNTRIES:
                pattern = r"\b" + re.escape(known_country) + r"\b"
                if re.search(pattern, combined_sources):
                    evidence_countries.add(known_country)

            place_country = (country or "").lower().strip()
            place_aliases = {place_country} if place_country else set()
            if place_country in ("usa", "united states"):
                place_aliases.update({"usa", "united states"})
            elif place_country in ("uk", "united kingdom", "england"):
                place_aliases.update({"uk", "united kingdom", "england"})

            if evidence_countries and place_country:
                # If the place's country matches ANY country mentioned in evidence
                if evidence_countries.intersection(place_aliases):
                    score += 25
                else:
                    # Evidence explicitly mentions other country/countries and this place does not match
                    score -= 90

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
            # Only penalize commercial types if the place has no tourist/cultural/landmark status
            # ==========================================================

            has_landmark_status = any(
                t in GOOD_PLACE_TYPES
                or t in (
                    "tourist_attraction",
                    "historical_landmark",
                    "art_gallery",
                    "museum",
                    "cultural_center",
                    "performing_arts_theater",
                    "place_of_worship",
                    "church",
                    "shrine",
                    "synagogue",
                    "monastery",
                    "temple",
                    "botanical_garden",
                    "campground",
                    "mountain_peak",
                    "viewpoint",
                    "state_park",
                    "natural_feature",
                    "locality",
                    "park",
                )
                for t in types
            )

            if not has_landmark_status:
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
                x.get("raw_score", 0),
                min(x["place"].get("user_rating_count", 0), 10000),
                x["place"].get("rating", 0),
                str(x["place"].get("id", "")),
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