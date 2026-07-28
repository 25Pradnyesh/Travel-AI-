import os

import requests


NEARBY_CATEGORIES = {

    "landmarks": [
        "tourist_attraction",
        "natural_feature",
    ],

    "viewpoints": [
        "tourist_attraction",
    ],

    "airports": [
        "airport",
    ],

    "railway": [
        "train_station",
    ],

    "hotels": [
        "lodging",
    ],

    "restaurants": [
        "restaurant",
    ],

}


class NearbySearchService:

    def __init__(self):

        self.api_key = os.getenv(
            "GOOGLE_PLACES_API_KEY"
        )

        self.url = (
            "https://places.googleapis.com/v1/places:searchNearby"
        )

        self.max_results = 5

        self.radius = 10000

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

            ]
        )

    # ==================================================
    # Search One Category
    # ==================================================

    def search_category(

        self,

        latitude: float,

        longitude: float,

        included_types: list[str],

    ):

        headers = {

            "Content-Type": "application/json",

            "X-Goog-Api-Key": self.api_key,

            "X-Goog-FieldMask": self.field_mask,

        }

        body = {

            "includedTypes": included_types,

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

        try:

            response = requests.post(

                self.url,

                headers=headers,

                json=body,

                timeout=10,

            )

            response.raise_for_status()

        except requests.RequestException as e:

            print(
                f"❌ Nearby Search Error: {e}"
            )

            return []

        places = response.json().get(
            "places",
            [],
        )

        results = []

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

            results.append(

                {

                    "id": place_id,

                    "name": (

                        place.get(
                            "displayName",
                            {},
                        ).get(
                            "text",
                            "",
                        )

                    ),

                    "address": place.get(
                        "formattedAddress",
                        "",
                    ),

                    "latitude": (

                        place.get(
                            "location",
                            {},
                        ).get(
                            "latitude",
                        )

                    ),

                    "longitude": (

                        place.get(
                            "location",
                            {},
                        ).get(
                            "longitude",
                        )

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
                        0.0,
                    ),

                    "user_rating_count": place.get(
                        "userRatingCount",
                        0,
                    ),

                    "google_maps_url": place.get(
                        "googleMapsUri",
                        "",
                    ),

                }

            )

        return results

    # ==================================================
    # Search Everything
    # ==================================================

    def search(

        self,

        latitude: float,

        longitude: float,

    ):

        if latitude is None:

            return {}

        if longitude is None:

            return {}

        nearby = {}

        print(
            "\n========== NEARBY SEARCH ==========\n"
        )

        for category, types in NEARBY_CATEGORIES.items():

            places = self.search_category(

                latitude,

                longitude,

                types,

            )

            nearby[category] = places

            print(
                f"{category.title()} : {len(places)}"
            )

        print(
            "\n===============================\n"
        )

        return nearby