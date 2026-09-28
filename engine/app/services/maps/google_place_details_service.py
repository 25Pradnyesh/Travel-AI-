import os

import requests


class GooglePlaceDetailsService:

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_PLACES_API_KEY")
        self.url = "https://places.googleapis.com/v1/places/"
        self.timeout = 10
        self.last_error: dict | None = None
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
        self.last_error = None

        if not place_id:
            return None

        if not self.api_key:
            self.last_error = {
                "status": "missing_api_key",
                "message": "GOOGLE_PLACES_API_KEY not configured.",
            }
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
            data = response.json()

        except requests.RequestException as e:
            status_code = getattr(getattr(e, "response", None), "status_code", "network_error")
            self.last_error = {
                "status": status_code,
                "error_type": type(e).__name__,
                "message": f"Place details request failed: {type(e).__name__}",
            }
            print(
                f"❌ Google Place Details Error: {type(e).__name__} (status: {status_code})"
            )
            return None
        except Exception as e:
            self.last_error = {
                "status": "malformed_response",
                "error_type": type(e).__name__,
                "message": f"Failed to parse Place details: {type(e).__name__}",
            }
            print(
                f"❌ Google Place Details Error: {type(e).__name__}"
            )
            return None

        if not isinstance(data, dict):
            return None

        # Defensive parsing for location
        location_obj = data.get("location")
        latitude = None
        longitude = None
        if isinstance(location_obj, dict):
            latitude = location_obj.get("latitude")
            longitude = location_obj.get("longitude")

        # Defensive parsing for displayName
        display_obj = data.get("displayName")
        display_name = ""
        if isinstance(display_obj, dict):
            display_name = str(display_obj.get("text") or "").strip()

        # Defensive parsing for types
        raw_types = data.get("types")
        types = [str(t) for t in raw_types if t] if isinstance(raw_types, list) else []

        # Defensive parsing for regularOpeningHours
        reg_hours = data.get("regularOpeningHours")
        opening_hours = []
        if isinstance(reg_hours, dict):
            raw_desc = reg_hours.get("weekdayDescriptions")
            if isinstance(raw_desc, list):
                opening_hours = [str(d) for d in raw_desc if d]

        # Defensive parsing for currentOpeningHours
        cur_hours = data.get("currentOpeningHours")
        current_opening_hours = []
        if isinstance(cur_hours, dict):
            raw_desc = cur_hours.get("weekdayDescriptions")
            if isinstance(raw_desc, list):
                current_opening_hours = [str(d) for d in raw_desc if d]

        # Defensive parsing for editorialSummary
        editorial = data.get("editorialSummary")
        editorial_summary = ""
        if isinstance(editorial, dict):
            editorial_summary = str(editorial.get("text") or "").strip()

        # Defensive parsing for photos
        raw_photos = data.get("photos")
        photos = []
        if isinstance(raw_photos, list):
            for photo in raw_photos:
                if not isinstance(photo, dict):
                    continue
                author_raw = photo.get("authorAttributions")
                author_list = author_raw if isinstance(author_raw, list) else []
                photos.append(
                    {
                        "name": photo.get("name"),
                        "width": photo.get("widthPx"),
                        "height": photo.get("heightPx"),
                        "author": author_list,
                    }
                )

        # Defensive parsing for accessibilityOptions
        access_obj = data.get("accessibilityOptions")
        accessibility = access_obj if isinstance(access_obj, dict) else {}

        # Defensive parsing for plusCode
        plus_obj = data.get("plusCode")
        plus_code = plus_obj if isinstance(plus_obj, dict) else {}

        # Defensive parsing for viewport
        viewport_obj = data.get("viewport")
        viewport = viewport_obj if isinstance(viewport_obj, dict) else {}

        # Defensive parsing for rating & reviews
        rating = 0.0
        try:
            rating = float(data.get("rating") or 0.0)
        except (ValueError, TypeError):
            pass

        user_rating_count = 0
        try:
            user_rating_count = int(data.get("userRatingCount") or 0)
        except (ValueError, TypeError):
            pass

        utc_offset = 0
        try:
            utc_offset = int(data.get("utcOffsetMinutes") or 0)
        except (ValueError, TypeError):
            pass

        return {
            # =====================================
            # Identity
            # =====================================
            "id": data.get("id"),
            "display_name": display_name,
            "formatted_address": str(data.get("formattedAddress") or ""),

            # =====================================
            # Coordinates
            # =====================================
            "latitude": latitude,
            "longitude": longitude,

            # =====================================
            # Classification
            # =====================================
            "primary_type": str(data.get("primaryType") or ""),
            "types": types,

            # =====================================
            # Popularity
            # =====================================
            "rating": rating,
            "user_rating_count": user_rating_count,

            # =====================================
            # Maps
            # =====================================
            "google_maps_url": str(data.get("googleMapsUri") or f"https://www.google.com/maps/place/?q=place_id:{place_id}"),

            # =====================================
            # Contact
            # =====================================
            "website": str(data.get("websiteUri") or ""),
            "phone": str(data.get("nationalPhoneNumber") or ""),

            # =====================================
            # Opening Hours
            # =====================================
            "opening_hours": opening_hours,
            "current_opening_hours": current_opening_hours,

            # =====================================
            # Pricing
            # =====================================
            "price_level": str(data.get("priceLevel") or ""),

            # =====================================
            # Editorial
            # =====================================
            "editorial_summary": editorial_summary,

            # =====================================
            # Photos
            # =====================================
            "photos": photos,

            # =====================================
            # Status
            # =====================================
            "business_status": str(data.get("businessStatus") or ""),

            # =====================================
            # Accessibility
            # =====================================
            "accessibility": accessibility,

            # =====================================
            # Plus Code
            # =====================================
            "plus_code": plus_code,

            # =====================================
            # Viewport
            # =====================================
            "viewport": viewport,

            # =====================================
            # Timezone
            # =====================================
            "utc_offset_minutes": utc_offset,
        }