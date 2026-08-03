import os
import requests


class GooglePlacesService:

    def __init__(self):

        self.api_key = os.getenv("GOOGLE_PLACES_API_KEY")

        self.url = (
            "https://places.googleapis.com/v1/places:searchText"
        )

        self.max_results = 5

    # ==================================================
    # Google Places Search
    # ==================================================

    def search(
        self,
        query: str,
    ):

        query = (query or "").strip()

        if not query:
            return []

        if not self.api_key:

            print("❌ GOOGLE_PLACES_API_KEY not found.")

            return []

        headers = {

            "Content-Type": "application/json",

            "X-Goog-Api-Key": self.api_key,

            "X-Goog-FieldMask": ",".join(

                [

                    "places.id",

                    "places.displayName",

                    "places.formattedAddress",

                    "places.location",

                    "places.types",

                    "places.primaryType",

                    "places.rating",

                    "places.userRatingCount",

                    "places.businessStatus",

                    "places.googleMapsUri",

                    "places.viewport",

                ]

            ),

        }

        body = {

            "textQuery": query,

            "pageSize": self.max_results,

        }

        try:

            response = requests.post(

                self.url,

                headers=headers,

                json=body,

                timeout=15,

            )

            if not response.ok:

                print("\n========== GOOGLE SEARCH ERROR ==========")
                print(f"Query : {query}")
                print(f"Status: {response.status_code}")
                print(response.text)
                print("=========================================\n")

                return []

            data = response.json()

        except requests.RequestException as e:

            print(f"❌ Google Places Error: {e}")

            return []

        places = data.get("places", [])

        results = []

        seen = set()

        for place in places:

            place_id = place.get("id")

            if not place_id:
                continue

            if place_id in seen:
                continue

            seen.add(place_id)

            display_name = (
                place.get("displayName", {})
                .get("text", "")
            )

            location = place.get(
                "location",
                {},
            )

            results.append(

                {

                    "id": place_id,

                    "display_name": display_name,

                    "formatted_address": place.get(
                        "formattedAddress",
                        "",
                    ),

                    "latitude": location.get(
                        "latitude"
                    ),

                    "longitude": location.get(
                        "longitude"
                    ),

                    "types": place.get(
                        "types",
                        [],
                    ),

                    "primary_type": place.get(
                        "primaryType",
                        "",
                    ),

                    "rating": place.get(
                        "rating",
                        0.0,
                    ),

                    "user_rating_count": place.get(
                        "userRatingCount",
                        0,
                    ),

                    "business_status": place.get(
                        "businessStatus",
                        "",
                    ),

                    "viewport": place.get(
                        "viewport",
                        {},
                    ),

                    "google_maps_url": (

                        place.get(
                            "googleMapsUri"
                        )

                        or

                        f"https://www.google.com/maps/place/?q=place_id:{place_id}"

                    ),

                }

            )

        return results