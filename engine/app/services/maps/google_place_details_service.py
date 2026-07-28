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

        self.timeout = 10

        self.field_mask = ",".join(
            [
                # Core
                "id",
                "displayName",
                "formattedAddress",
                "location",

                # Classification
                "primaryType",
                "types",

                # Popularity
                "rating",
                "userRatingCount",

                # Maps
                "googleMapsUri",

                # Contact
                "websiteUri",
                "nationalPhoneNumber",

                # Hours
                "regularOpeningHours",
                "currentOpeningHours",

                # Pricing
                "priceLevel",

                # AI Summary
                "editorialSummary",

                # Photos
                "photos",

                # Status
                "businessStatus",

                # Accessibility
                "accessibilityOptions",

                # Plus Code
                "plusCode",

                # Viewport
                "viewport",

                # Timezone
                "utcOffsetMinutes",
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

                timeout=self.timeout,

            )

            response.raise_for_status()

        except requests.RequestException as e:

            print(
                f"❌ Google Place Details Error: {e}"
            )

            return None

        data = response.json()

        location = data.get(
            "location",
            {},
        )

        return {

            # =====================================
            # Identity
            # =====================================

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

            # =====================================
            # Coordinates
            # =====================================

            "latitude": location.get(
                "latitude",
            ),

            "longitude": location.get(
                "longitude",
            ),

            # =====================================
            # Classification
            # =====================================

            "primary_type": data.get(
                "primaryType",
                "",
            ),

            "types": data.get(
                "types",
                [],
            ),

            # =====================================
            # Popularity
            # =====================================

            "rating": float(
                data.get(
                    "rating",
                    0.0,
                )
                or 0.0
            ),

            "user_rating_count": int(
                data.get(
                    "userRatingCount",
                    0,
                )
                or 0
            ),

            # =====================================
            # Maps
            # =====================================

            "google_maps_url": data.get(
                "googleMapsUri",
                "",
            ),

            # =====================================
            # Contact
            # =====================================

            "website": data.get(
                "websiteUri",
                "",
            ),

            "phone": data.get(
                "nationalPhoneNumber",
                "",
            ),

            # =====================================
            # Opening Hours
            # =====================================

            "opening_hours": (
                data.get(
                    "regularOpeningHours",
                    {},
                ).get(
                    "weekdayDescriptions",
                    [],
                )
            ),

            "current_opening_hours": (
                data.get(
                    "currentOpeningHours",
                    {},
                ).get(
                    "weekdayDescriptions",
                    [],
                )
            ),

            # =====================================
            # Pricing
            # =====================================

            "price_level": data.get(
                "priceLevel",
                "",
            ),

            # =====================================
            # Editorial
            # =====================================

            "editorial_summary": (
                data.get(
                    "editorialSummary",
                    {},
                ).get(
                    "text",
                    "",
                )
            ),

            # =====================================
            # Photos
            # =====================================

            "photos": [

                {

                    "name": photo.get(
                        "name",
                    ),

                    "width": photo.get(
                        "widthPx",
                    ),

                    "height": photo.get(
                        "heightPx",
                    ),

                    "author": (
                        photo.get(
                            "authorAttributions",
                            [],
                        )
                    ),

                }

                for photo in data.get(
                    "photos",
                    [],
                )

            ],

            # =====================================
            # Status
            # =====================================

            "business_status": data.get(
                "businessStatus",
                "",
            ),

            # =====================================
            # Accessibility
            # =====================================

            "accessibility": data.get(
                "accessibilityOptions",
                {},
            ),

            # =====================================
            # Plus Code
            # =====================================

            "plus_code": data.get(
                "plusCode",
                {},
            ),

            # =====================================
            # Viewport
            # =====================================

            "viewport": data.get(
                "viewport",
                {},
            ),

            # =====================================
            # Timezone
            # =====================================

            "utc_offset_minutes": data.get(
                "utcOffsetMinutes",
                0,
            ),

        }