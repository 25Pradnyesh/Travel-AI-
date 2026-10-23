import math
import re
from itertools import chain
from typing import Any

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
    "faroe islands",
    "venezuela",
    "georgia",
    "kyrgyzstan",
    "lithuania",
    "south korea",
    "korea",
    "ireland",
    "scotland",
    "wales",
    "peru",
    "chile",
    "argentina",
    "colombia",
}


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
    "lake": 65,
    "waterfall": 65,
    "water": 60,
    "national_park": 60,
    "mountain_peak": 60,
    "beach": 60,
    "island": 60,
    "valley": 55,
    "viewpoint": 55,
    "temple": 55,
    "castle": 55,
    "locality": 55,
    "church": 50,
    "place_of_worship": 50,
    "historical_landmark": 50,
    "monument": 50,
    "historic": 50,
    "city": 50,
    "park": 45,
    "town": 45,
    "village": 40,
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

    # Corporate & Office Workspaces
    "corporate_office",
    "office",
    "coworking_space",
    "company",
    "local_government_office",
}


class ScoringService:

    SOURCE_TRUST_WEIGHTS = {
        "pin": 25,
        "hashtags": 20,
        "caption": 15,
        "title": 10,
        "ocr": 5,
        "speech": 3,
    }

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
        score: float,
    ) -> float:
        """
        Continuous non-saturating scoring function.
        Damps high scores smoothly toward 99.5 without hard clipping at 100,
        ensuring specificity and tie-breaker bonuses maintain distinct ordering.
        """
        if score <= 0:
            return 0.0
        if score <= 75:
            return round(score, 1)
        # Asymptotic smooth scaling: 75 -> 75, 120 -> 84.8, 160 -> 90.6, 220 -> 95.8, 300 -> 98.4
        scaled = 75.0 + 24.5 * (1.0 - math.exp(-(score - 75.0) / 80.0))
        return round(min(scaled, 99.5), 1)

    # ==========================================================
    # Confidence
    # ==========================================================

    def confidence(
        self,
        score: float,
        evidence_count: int = 1,
        is_country_only: bool = False,
    ) -> str:
        if is_country_only and score >= 75:
            return "MEDIUM"
        if score >= 90:
            return "VERY_HIGH"
        if score >= 80:
            return "HIGH"
        if score >= 65:
            return "MEDIUM"
        if score >= 45:
            return "LOW"
        return "VERY_LOW"

    def _check_containment(self, place_b: Any, place_a: Any) -> bool:
        """
        Determines whether place_b is geographically or hierarchically contained inside place_a.
        E.g., Varenna (village/town) is contained inside Lake Como (water/region).
        """
        if not place_b or not place_a or place_b is place_a:
            return False

        # Support direct bbox list comparison [south, north, west, east]
        if isinstance(place_b, (list, tuple)) and isinstance(place_a, (list, tuple)):
            if len(place_b) == 4 and len(place_a) == 4:
                try:
                    s_b, n_b, w_b, e_b = float(place_b[0]), float(place_b[1]), float(place_b[2]), float(place_b[3])
                    s_a, n_a, w_a, e_a = float(place_a[0]), float(place_a[1]), float(place_a[2]), float(place_a[3])
                    return s_a <= s_b and n_b <= n_a and w_a <= w_b and e_b <= e_a
                except (ValueError, TypeError):
                    return False
            return False

        if not isinstance(place_a, dict) or not isinstance(place_b, dict):
            return False

        name_a = (place_a.get("travel_name") or place_a.get("display_name") or "").lower().strip()
        name_b = (place_b.get("travel_name") or place_b.get("display_name") or "").lower().strip()
        if not name_a or not name_b or name_a == name_b:
            return False

        # 1. Bounding box containment: bbox of place_a [south, north, west, east]
        bbox_a = place_a.get("boundingbox")
        lat_b = place_b.get("latitude")
        lon_b = place_b.get("longitude")
        if bbox_a and len(bbox_a) == 4 and lat_b is not None and lon_b is not None:
            try:
                s, n, w, e = float(bbox_a[0]), float(bbox_a[1]), float(bbox_a[2]), float(bbox_a[3])
                if s <= lat_b <= n and w <= lon_b <= e:
                    return True
            except (ValueError, TypeError):
                pass

        # 2. Address / display_name hierarchy
        addr_b = (place_b.get("formatted_address") or place_b.get("display_name") or "").lower()
        reg_b = (place_b.get("region") or "").lower()
        city_b = (place_b.get("city") or "").lower()
        if name_a in addr_b or name_a in reg_b or name_a in city_b:
            return True

        # 3. Known parent-child relationships (e.g., Lake Como containing Varenna, Bellagio, Menaggio)
        if ("como" in name_a or "lake como" in name_a) and any(
            t in name_b for t in ["varenna", "bellagio", "menaggio", "lenno", "tremezzo", "cernobbio"]
        ):
            return True

        return False

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

        # Identify explicit countries declared in author evidence (title / caption)
        author_text = f"{title} {caption}".lower()
        all_countries = {c.lower() for c in COUNTRIES if len(c) > 3}
        declared_countries = {
            c for c in all_countries if c in author_text
        }

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

            rating = place.get("rating") or 0.0

            reviews = place.get("user_rating_count") or 0

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

            vq_in_caption = bool(verified_query and verified_query in caption)
            if vq_in_caption:
                if len(verified_query.split()) > 1:
                    score += 50
                elif primary_type in GOOD_PLACE_TYPES or any(t in GOOD_PLACE_TYPES for t in types):
                    score += 35
                else:
                    score += 15
                matched_sources.add("caption")
                matched_terms.add(verified_query)

            tn_in_caption = bool(travel_name and travel_name in caption)
            if tn_in_caption:
                # If verified_query already matched caption and is identical to travel_name, avoid double counting full bonus
                if vq_in_caption and verified_query.strip().lower() == travel_name.strip().lower():
                    score += 10
                else:
                    score += 40
                matched_sources.add("caption")
                matched_terms.add(travel_name)

            if city and city in caption:
                # If city is identical to travel_name or verified_query, avoid duplicate full bonus
                if (travel_name and city.strip().lower() == travel_name.strip().lower()) or (verified_query and city.strip().lower() == verified_query.strip().lower()):
                    score += 10
                else:
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
            # Geographic Consistency & Country Alignment
            # ==========================================================
            if declared_countries:
                if country and country in declared_countries:
                    score += 35
                    matched_sources.add("caption" if country in caption else "title")
                    matched_terms.add(country)
                elif country and country in all_countries and country not in declared_countries:
                    # Penalize direct geographic contradiction (e.g. caption states "Switzerland", place is in "India")
                    score -= 75

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

            # Name and locality proper token matching (excluding generic words to prevent runaway inflation)
            name_locality_str = f"{travel_name} {city} {region} {verified_query}"
            candidate_proper_tokens = {
                t for t in self.tokenize(name_locality_str)
                if t not in GENERIC_LOCATION_WORDS and len(t) > 3
            }

            token_gain = 0
            for token in candidate_proper_tokens:
                g = self.score_index(token, caption_index, 15, 8, 4)
                if g:
                    matched_sources.add("caption")
                    matched_terms.add(token)
                    token_gain += g

                g = self.score_index(token, title_index, 10, 6, 3)
                if g:
                    matched_sources.add("title")
                    matched_terms.add(token)
                    token_gain += g

                g = self.score_index(token, speech_index, 12, 8, 4)
                if g:
                    matched_sources.add("speech")
                    matched_terms.add(token)
                    token_gain += g

                g = self.score_index(token, ocr_index, 10, 6, 3)
                if g:
                    matched_sources.add("ocr")
                    matched_terms.add(token)
                    token_gain += g

                g = self.score_index(token, hashtag_index, 8, 5, 2)
                if g:
                    matched_sources.add("hashtags")
                    matched_terms.add(token)
                    token_gain += g

            # Cap total token matching bonus to 35 points
            score += min(token_gain, 35)

            # Check if candidate place has any proper name match in evidence
            cand_tokens = {
                t for t in self.tokenize(travel_name)
                if t not in GENERIC_LOCATION_WORDS and len(t) > 3
            }
            has_proper_match = any(
                t in caption or t in speech or t in ocr or t in title or t in hashtags
                for t in cand_tokens
            )
            # If place name has proper tokens, but NONE matched the evidence (e.g. only "lake" matched)
            if cand_tokens and not has_proper_match:
                score -= 60

            # ==========================================================
            # Country Consistency
            # ==========================================================

            first_component = travel_name.split(",")[0].strip().lower()
            first_clean = re.sub(r"['’]s$", "", first_component).strip()
            is_country = (
                first_clean in COUNTRIES
                or travel_name in COUNTRIES
                or (country and first_clean == country)
                or primary_type in ("country", "administrative_area_level_1")
            )

            if is_country:
                score -= 60

            combined_sources = " ".join([
                caption,
                speech,
                ocr,
                hashtags,
            ])

            COUNTRY_ALIASES_MAP = {
                "italy": {"italy", "italia", "italian"},
                "france": {"france", "french", "français"},
                "germany": {"germany", "german", "deutschland"},
                "spain": {"spain", "spanish", "españa"},
                "switzerland": {"switzerland", "swiss", "suisse", "schweiz"},
                "china": {"china", "chinese"},
                "south korea": {"south korea", "korea", "korean"},
                "japan": {"japan", "japanese"},
                "india": {"india", "indian"},
                "canada": {"canada", "canadian"},
                "usa": {"usa", "united states", "american", "america"},
                "uk": {"uk", "united kingdom", "england", "british", "scotland", "wales"},
                "austria": {"austria", "austrian", "österreich"},
                "greece": {"greece", "greek"},
                "norway": {"norway", "norwegian"},
                "mexico": {"mexico", "mexican"},
                "brazil": {"brazil", "brazilian", "brasil"},
                "portugal": {"portugal", "portuguese"},
            }

            evidence_countries = set()
            for base_c, aliases in COUNTRY_ALIASES_MAP.items():
                for al in aliases:
                    pattern = r"\b" + re.escape(al) + r"\b"
                    if re.search(pattern, combined_sources):
                        evidence_countries.add(base_c)
                        break

            for known_country in COUNTRIES:
                pattern = r"\b" + re.escape(known_country) + r"\b"
                if re.search(pattern, combined_sources):
                    evidence_countries.add(known_country)

            place_country = (country or "").lower().strip()
            place_canonical = place_country
            for base_c, aliases in COUNTRY_ALIASES_MAP.items():
                if place_country in aliases or place_country == base_c:
                    place_canonical = base_c
                    break

            has_country_contradiction = False
            if evidence_countries and place_canonical:
                if place_canonical in evidence_countries:
                    score += 35
                    matched_sources.add("caption" if place_canonical in caption else "hashtags")
                else:
                    # Place country contradicts evidence country (e.g. Canada vs Italy, USA vs France)
                    score -= 150
                    has_country_contradiction = True

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

            # Source trust: pin (25) > hashtags (20) > caption (15) > title (10) > ocr (5) > speech (3)
            source_trust = 0
            if "pin" in matched_sources:
                source_trust += 25
            if "hashtags" in matched_sources:
                source_trust += 20
            if "caption" in matched_sources:
                source_trust += 15
            if "title" in matched_sources:
                source_trust += 10
            if "ocr" in matched_sources:
                source_trust += 5
            if "speech" in matched_sources:
                source_trust += 3
            score += source_trust

            # If candidate directly contradicts verified evidence country, strictly cap raw score
            if has_country_contradiction:
                score = min(score, 45.0)

            # ==========================================================
            # Normalize
            # ==========================================================

            normalized = self.normalize_score(
                score,
            )

            # ==========================================================
            # Store Evidence
            # ==========================================================

            combined_sources = set(matched_sources) | set(place.get("matched_sources") or [])
            place["matched_sources"] = sorted(
                combined_sources,
            )

            place["matched_terms"] = sorted(
                matched_terms,
            )

            place["evidence_count"] = len(
                combined_sources,
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
                    "source_trust": source_trust,
                    "specificity_level": 0,
                    "confidence": self.confidence(
                        normalized,
                        evidence_count=len(combined_sources),
                        is_country_only=is_country,
                    ),
                }
            )

        # ==========================================================
        # Specificity & Containment Pass
        # If candidate B lies inside candidate A (bbox or address hierarchy),
        # candidate B is the granular destination and receives a specificity boost (+35),
        # while A becomes the parent region descriptor.
        # Example: Varenna lies on Lake Como; Varenna wins over Lake Como.
        # ==========================================================
        for i, item_b in enumerate(ranked):
            place_b = item_b["place"]
            for j, item_a in enumerate(ranked):
                if i == j:
                    continue
                place_a = item_a["place"]
                if self._check_containment(place_b, place_a):
                    item_b["specificity_level"] = item_b.get("specificity_level", 0) + 1
                    item_b["raw_score"] += 35.0
                    item_b["score"] = self.normalize_score(item_b["raw_score"])
                    item_b["confidence"] = self.confidence(
                        item_b["score"],
                        evidence_count=len(place_b.get("matched_sources", [])),
                        is_country_only=False,
                    )
                    if not place_b.get("region"):
                        place_b["region"] = place_a.get("travel_name") or place_a.get("name")
                    place_a["is_container"] = True

        # ==========================================================
        # Stable Deduplication of Ranked Candidates
        # ==========================================================

        deduped_ranked = []
        seen_keys = {}
        for item in ranked:
            p = item["place"]
            tname = (p.get("travel_name") or p.get("display_name") or "").strip()
            pcountry = (p.get("country") or "").strip()
            nkey = (
                re.sub(r"[^\w\s]", "", tname.lower()).strip()
                + "::"
                + re.sub(r"[^\w\s]", "", pcountry.lower()).strip()
            )
            if nkey in seen_keys:
                existing = seen_keys[nkey]
                ex_src = set(existing["place"].get("matched_sources", []))
                new_src = set(p.get("matched_sources", []))
                merged_src = sorted(ex_src | new_src)
                existing["place"]["matched_sources"] = merged_src
                existing["place"]["evidence_count"] = len(merged_src)
                if item["score"] > existing["score"]:
                    existing["score"] = item["score"]
                    existing["raw_score"] = item["raw_score"]
                    existing["confidence"] = item["confidence"]
                    existing["source_trust"] = item["source_trust"]
                    existing["specificity_level"] = item["specificity_level"]
                continue
            seen_keys[nkey] = item
            deduped_ranked.append(item)
        ranked = deduped_ranked

        # ==========================================================
        # Final Ranking with Strict Tie-Breakers
        # ==========================================================

        ranked.sort(
            key=lambda x: (
                x["score"],
                x.get("specificity_level", 0),
                x.get("source_trust", 0),
                x.get("raw_score", 0),
                float(x["place"].get("importance") or 0.0),
                len(x["place"].get("matched_sources", [])),
                min(x["place"].get("user_rating_count") or 0, 10000),
                x["place"].get("rating") or 0.0,
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

    def score_candidates(
        self,
        places: list,
        evidence: Any = None,
    ):
        """
        Helper alias to rank places against text or evidence dict.
        """
        if isinstance(evidence, str):
            evidence = {"caption": evidence}
        elif evidence is None:
            evidence = {}
        return self.rank_places(places, evidence)