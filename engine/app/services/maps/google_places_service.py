import os
import requests


class GooglePlacesService:

    def __init__(self):

        self.api_key = os.getenv(
            "GOOGLE_PLACES_API_KEY"
        )

        self.url = (
            "https://places.googleapis.com/v1/places:searchText"
        )

        self.max_results = 5

    def search(
        self,
        query: str,
    ):

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": (
                "places.id,"
                "places.displayName,"
                "places.formattedAddress,"
                "places.location,"
                "places.types,"
                "places.primaryType"
            ),
        }

        body = {
            "textQuery": query,
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
                f"❌ Google Places Error: {e}"
            )

            return []

        data = response.json()

        places = data.get(
            "places",
            [],
        )

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
                place.get(
                    "displayName",
                    {},
                ).get(
                    "text",
                    "",
                )
            )

            formatted_address = place.get(
                "formattedAddress",
                "",
            )

            location = place.get(
                "location",
                {},
            )

            types = place.get(
                "types",
                [],
            )

            primary_type = place.get(
                "primaryType",
                "",
            )

            google_maps_url = (
                "https://www.google.com/maps/place/"
                f"?q=place_id:{place_id}"
            )

            results.append(
                {
                    "id": place_id,
                    "display_name": display_name,
                    "formatted_address": formatted_address,
                    "latitude": location.get(
                        "latitude"
                    ),
                    "longitude": location.get(
                        "longitude"
                    ),
                    "types": types,
                    "primary_type": primary_type,
                    "google_maps_url": google_maps_url,
                }
            )

            if len(results) >= self.max_results:
                break

        return results