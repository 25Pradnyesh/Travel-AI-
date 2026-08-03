import math
import os

import requests


# ==========================================================
# Travel AI Categories
# ==========================================================

TRAVEL_CATEGORIES = {

    "must_visit": [

        "tourist_attraction",

        "historical_landmark",

        "monument",

        "museum",

    ],

    "food": [

        "restaurant",

        "cafe",

        "bakery",

    ],

    "stay": [

        "lodging",

    ],

    "transport": [

        "airport",

        "train_station",

        "bus_station",

    ],

    "shopping": [

        "shopping_mall",

        "market",

    ],

    "nature": [

        "park",

        "natural_feature",

    ],

}


# ==========================================================
# Supported Google Types
# (Prevents invalid API requests)
# ==========================================================

SUPPORTED_PLACE_TYPES = {

    "airport",

    "bakery",

    "bus_station",

    "cafe",

    "historical_landmark",

    "lodging",

    "market",

    "monument",

    "museum",

    "natural_feature",

    "park",

    "restaurant",

    "shopping_mall",

    "tourist_attraction",

    "train_station",

}


class NearbySearchService:

    def __init__(self):

        self.api_key = os.getenv(
            "GOOGLE_PLACES_API_KEY"
        )

        self.url = (
            "https://places.googleapis.com/v1/places:searchNearby"
        )

        self.radius = 10000

        self.max_results = 5

        self.timeout = 15

        # --------------------------------------------------

        # Request everything useful in ONE API call

        # --------------------------------------------------

        self.field_mask = ",".join(

            [

                "places.id",

                "places.displayName",

                "places.formattedAddress",

                "places.location",

                "places.primaryType",

                "places.types",

                "places.rating",

                "places.userRatingCount",

                "places.googleMapsUri",

                "places.editorialSummary",

                "places.photos",

                "places.currentOpeningHours",

                "places.priceLevel",

                "places.websiteUri",

            ]

        )

    # ==========================================================
    # Distance (Haversine)
    # ==========================================================

    def distance_km(

        self,

        lat1,

        lon1,

        lat2,

        lon2,

    ):

        if None in (

            lat1,

            lon1,

            lat2,

            lon2,

        ):

            return None

        r = 6371

        d_lat = math.radians(

            lat2 - lat1

        )

        d_lon = math.radians(

            lon2 - lon1

        )

        a = (

            math.sin(d_lat / 2) ** 2

            +

            math.cos(

                math.radians(lat1)

            )

            *

            math.cos(

                math.radians(lat2)

            )

            *

            math.sin(d_lon / 2) ** 2

        )

        return round(

            r * 2 * math.atan2(

                math.sqrt(a),

                math.sqrt(1 - a),

            ),

            2,

        )

    # ==========================================================
    # Normalize Google Response
    # ==========================================================

    def normalize_place(

        self,

        place,

        latitude,

        longitude,

    ):

        location = place.get(

            "location",

            {},

        )

        photos = place.get(

            "photos",

            [],

        )

        opening = place.get(

            "currentOpeningHours",

            {},

        )

        return {

            "id": place.get("id"),

            "name": place.get(

                "displayName",

                {},

            ).get(

                "text",

                "",

            ),

            "address": place.get(

                "formattedAddress",

                "",

            ),

            "latitude": location.get(

                "latitude"

            ),

            "longitude": location.get(

                "longitude"

            ),

            "distance_km": self.distance_km(

                latitude,

                longitude,

                location.get(

                    "latitude"

                ),

                location.get(

                    "longitude"

                ),

            ),

            "primary_type": place.get(

                "primaryType",

                "",

            ),

            "types": place.get(

                "types",

                [],

            ),

            "rating": place.get(

                "rating",

                0,

            ),

            "user_rating_count": place.get(

                "userRatingCount",

                0,

            ),

            "google_maps_url": place.get(

                "googleMapsUri",

                "",

            ),

            "website": place.get(

                "websiteUri",

                "",

            ),

            "editorial_summary": place.get(

                "editorialSummary",

                {},

            ).get(

                "text",

                "",

            ),

            "opening_hours": opening.get(

                "weekdayDescriptions",

                [],

            ),

            "open_now": opening.get(

                "openNow"

            ),

            "price_level": place.get(

                "priceLevel",

                "",

            ),

            "photo_reference": (

                photos[0].get(

                    "name"

                )

                if photos

                else None

            ),

        }


    # ==========================================================
    # Search One Google Place Type
    # ==========================================================

    def search_single_type(

        self,

        latitude: float,

        longitude: float,

        place_type: str,

    ):

        # --------------------------------------------------
        # Ignore unsupported types
        # --------------------------------------------------

        if place_type not in SUPPORTED_PLACE_TYPES:

            print(
                f"⚠ Unsupported Google Place Type: {place_type}"
            )

            return []

        headers = {

            "Content-Type": "application/json",

            "X-Goog-Api-Key": self.api_key,

            "X-Goog-FieldMask": self.field_mask,

        }

        body = {

            "includedTypes": [

                place_type,

            ],

            "maxResultCount": self.max_results,

            "locationRestriction": {

                "circle": {

                    "center": {

                        "latitude": latitude,

                        "longitude": longitude,

                    },

                    "radius": self.radius,

                }

            },

        }

        print(
            f"🔍 Searching Google Places → {place_type}"
        )

        try:

            response = requests.post(

                self.url,

                headers=headers,

                json=body,

                timeout=self.timeout,

            )

        except requests.RequestException as e:

            print(
                f"❌ Network Error ({place_type})"
            )

            print(e)

            return []

        # --------------------------------------------------
        # API Error
        # --------------------------------------------------

        if not response.ok:

            print(
                "\n========== GOOGLE PLACES ERROR =========="
            )

            print(
                f"Type       : {place_type}"
            )

            print(
                f"Status     : {response.status_code}"
            )

            print(
                f"Response   :\n{response.text}"
            )

            print(
                "=========================================\n"
            )

            return []

        data = response.json()

        places = data.get(

            "places",

            [],

        )

        normalized = []

        seen = set()

        for place in places:

            place_id = place.get(

                "id",

            )

            if not place_id:

                continue

            if place_id in seen:

                continue

            seen.add(

                place_id,

            )

            normalized.append(

                self.normalize_place(

                    place,

                    latitude,

                    longitude,

                )

            )

        # --------------------------------------------------
        # Highest Rated First
        # --------------------------------------------------

        normalized.sort(

            key=lambda x: (

                x.get(

                    "rating",

                    0,

                ),

                x.get(

                    "user_rating_count",

                    0,

                ),

            ),

            reverse=True,

        )

        print(

            f"   ✓ Found {len(normalized)} place(s)"

        )

        return normalized

    # ==========================================================
    # Search One Travel Category
    # ==========================================================

    def search_category(

        self,

        latitude: float,

        longitude: float,

        category: str,

        place_types: list[str],

    ):

        merged = []

        seen = set()

        print(
            f"\n📂 Category : {category}"
        )

        for place_type in place_types:

            results = self.search_single_type(

                latitude,

                longitude,

                place_type,

            )

            for place in results:

                place_id = place["id"]

                if place_id in seen:

                    continue

                seen.add(place_id)

                place["travel_category"] = category

                merged.append(place)

        # --------------------------------------------------
        # Best first
        # --------------------------------------------------

        merged.sort(

            key=lambda place: (

                place.get(

                    "rating",

                    0,

                ),

                place.get(

                    "user_rating_count",

                    0,

                ),

                -(

                    place.get(

                        "distance_km",

                        9999,

                    )

                    or

                    9999

                ),

            ),

            reverse=True,

        )

        return merged

    # ==========================================================
    # Remove Duplicates Across Categories
    # ==========================================================

    def deduplicate(

        self,

        nearby: dict,

    ):

        global_seen = set()

        cleaned = {}

        for category, places in nearby.items():

            cleaned[category] = []

            for place in places:

                place_id = place["id"]

                if place_id in global_seen:

                    continue

                global_seen.add(

                    place_id,

                )

                cleaned[category].append(

                    place,

                )

        return cleaned

    # ==========================================================
    # Statistics
    # ==========================================================

    def build_statistics(

        self,

        nearby,

    ):

        total = 0

        for places in nearby.values():

            total += len(

                places,

            )

        return {

            "categories": len(

                nearby,

            ),

            "places_found": total,

        }

    # ==========================================================
    # Search Everything
    # ==========================================================

    def search(

        self,

        latitude: float,

        longitude: float,

    ):

        if latitude is None or longitude is None:

            return {

                "statistics": {},

                "must_visit": [],

                "food": [],

                "stay": [],

                "transport": [],

                "shopping": [],

                "nature": [],

            }

        print(

            "\n"

            "=============================================\n"

            "        TRAVEL AI - NEARBY SEARCH\n"

            "=============================================\n"

        )

        nearby = {}

        # --------------------------------------------------
        # Search every Travel Category
        # --------------------------------------------------

        for category, place_types in TRAVEL_CATEGORIES.items():

            nearby[category] = self.search_category(

                latitude,

                longitude,

                category,

                place_types,

            )

            print(

                f"✓ {category:<15}"

                f"{len(nearby[category])} place(s)"

            )

        # --------------------------------------------------
        # Global Duplicate Removal
        # --------------------------------------------------

        nearby = self.deduplicate(

            nearby,

        )

        # --------------------------------------------------
        # Trim Results
        # --------------------------------------------------

        for category in nearby:

            nearby[category] = nearby[category][

                : self.max_results

            ]

        # --------------------------------------------------
        # Statistics
        # --------------------------------------------------

        statistics = self.build_statistics(

            nearby,

        )

        print(

            "\n============================================="

        )

        print(

            f"Categories     : {statistics['categories']}"

        )

        print(

            f"Places Found   : {statistics['places_found']}"

        )

        print(

            "=============================================\n"

        )

        # --------------------------------------------------
        # Final Payload
        # --------------------------------------------------

        return {

            "statistics": statistics,

            "must_visit": nearby.get(

                "must_visit",

                [],

            ),

            "food": nearby.get(

                "food",

                [],

            ),

            "stay": nearby.get(

                "stay",

                [],

            ),

            "transport": nearby.get(

                "transport",

                [],

            ),

            "shopping": nearby.get(

                "shopping",

                [],

            ),

            "nature": nearby.get(

                "nature",

                [],

            ),

        }

