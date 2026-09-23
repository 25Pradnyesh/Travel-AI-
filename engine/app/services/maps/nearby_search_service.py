import concurrent.futures
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
                f"[WARN] Unsupported Google Place Type: {place_type}"
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
            f"[NEARBY] Searching Google Places -> {place_type}"
        )

        try:

            response = requests.post(

                self.url,

                headers=headers,

                json=body,

                timeout=self.timeout,

            )

        except requests.RequestException as e:
            status_code = getattr(getattr(e, "response", None), "status_code", "network_error")
            print(
                f"[ERROR] Nearby Search Network Error ({place_type}): {type(e).__name__} (status: {status_code})"
            )
            return []
        except Exception as e:
            print(
                f"[ERROR] Nearby Search Error ({place_type}): {type(e).__name__}"
            )
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
                f"Error      : Upstream request failed with status {response.status_code}"
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

            f"   - Found {len(normalized)} place(s)"

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
        print(f"\n[NEARBY] Category : {category}")

        if not place_types:
            return []

        # Bounded concurrency across place types within this category
        type_results = []
        if len(place_types) <= 1:
            for place_type in place_types:
                type_results.append(
                    self.search_single_type(
                        latitude,
                        longitude,
                        place_type,
                    )
                )
        else:
            with concurrent.futures.ThreadPoolExecutor(
                max_workers=min(4, len(place_types))
            ) as executor:
                future_to_type = {
                    executor.submit(
                        self.search_single_type,
                        latitude,
                        longitude,
                        pt,
                    ): pt
                    for pt in place_types
                }
                results_by_type = {}
                for future in concurrent.futures.as_completed(future_to_type):
                    pt = future_to_type[future]
                    try:
                        results_by_type[pt] = future.result()
                    except Exception as exc:
                        print(f"[ERROR] Error searching place type '{pt}': {exc}")
                        results_by_type[pt] = []

                # Preserve deterministic place_types order
                for pt in place_types:
                    type_results.append(results_by_type.get(pt, []))

        merged = []
        seen = set()

        for results in type_results:
            for place in results:
                place_id = place.get("id")
                if not place_id or place_id in seen:
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
        # Search Travel Categories Concurrently
        # --------------------------------------------------
        category_results = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            future_to_cat = {
                executor.submit(
                    self.search_category,
                    latitude,
                    longitude,
                    cat,
                    ptypes,
                ): cat
                for cat, ptypes in TRAVEL_CATEGORIES.items()
            }
            for future in concurrent.futures.as_completed(future_to_cat):
                cat = future_to_cat[future]
                try:
                    category_results[cat] = future.result()
                except Exception as exc:
                    print(f"[ERROR] Error searching category '{cat}': {exc}")
                    category_results[cat] = []

        # Preserve exact TRAVEL_CATEGORIES order
        for category in TRAVEL_CATEGORIES:
            nearby[category] = category_results.get(category, [])
            print(
                f" - {category:<15}"
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

