import os

import requests


class GooglePlaceDetailsService:

    def __init__(self):

        self.api_key = os.getenv(
            "GOOGLE_PLACES_API_KEY"
        )

        self.url = (
            "https://places.googleapis.com/v1/places/"
        )

        self.field_mask = ",".join(
            [
                "id",
                "displayName",
                "formattedAddress",
                "location",
                "primaryType",
                "types",
                "rating",
                "userRatingCount",
                "googleMapsUri",
                "websiteUri",
                "nationalPhoneNumber",
                "regularOpeningHours",
                "priceLevel",
                "editorialSummary",
                "photos",
                "businessStatus",
                "accessibilityOptions",
            ]
        )

    # ==================================================
    # Fetch Place Details
    # ==================================================

    def get_details(
        self,
        place_id: str,
    ):

        if not place_id:
            return None

        headers = {

            "X-Goog-Api-Key": self.api_key,

            "X-Goog-FieldMask": self.field_mask,

        }

        try:

            response = requests.get(

                f"{self.url}{place_id}",

                headers=headers,

                timeout=10,

            )

            response.raise_for_status()

        except requests.RequestException as e:

            print(
                f"❌ Google Place Details Error: {e}"
            )

            return None

        data = response.json()

        return {

            "id": data.get(
                "id",
            ),

            "display_name": (
                data.get(
                    "displayName",
                    {},
                ).get(
                    "text",
                    "",
                )
            ),

            "formatted_address": data.get(
                "formattedAddress",
                "",
            ),

            "latitude": (
                data.get(
                    "location",
                    {},
                ).get(
                    "latitude",
                )
            ),

            "longitude": (
                data.get(
                    "location",
                    {},
                ).get(
                    "longitude",
                )
            ),

            "primary_type": data.get(
                "primaryType",
                "",
            ),

            "types": data.get(
                "types",
                [],
            ),

            "rating": data.get(
                "rating",
                0.0,
            ),

            "user_rating_count": data.get(
                "userRatingCount",
                0,
            ),

            "google_maps_url": data.get(
                "googleMapsUri",
                "",
            ),

            "website": data.get(
                "websiteUri",
                "",
            ),

            "phone": data.get(
                "nationalPhoneNumber",
                "",
            ),

            "opening_hours": (
                data.get(
                    "regularOpeningHours",
                    {},
                ).get(
                    "weekdayDescriptions",
                    [],
                )
            ),

            "price_level": data.get(
                "priceLevel",
                "",
            ),

            "editorial_summary": (
                data.get(
                    "editorialSummary",
                    {},
                ).get(
                    "text",
                    "",
                )
            ),

            "photos": [

                photo.get(
                    "name",
                )

                for photo in data.get(
                    "photos",
                    [],
                )

            ],

            "business_status": data.get(
                "businessStatus",
                "",
            ),

            "accessibility": data.get(
                "accessibilityOptions",
                {},
            ),

        }