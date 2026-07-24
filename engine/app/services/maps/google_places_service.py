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
                "places.location"
            ),
        }

        body = {
            "textQuery": query
        }

        response = requests.post(
            self.url,
            headers=headers,
            json=body,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        places = data.get("places", [])

        results = []

        for place in places:

            display_name = (
                place.get("displayName", {})
                .get("text", "")
            )

            formatted_address = place.get(
                "formattedAddress",
                "",
            )

            location = place.get(
                "location",
                {},
            )

            google_maps_url = (
                "https://www.google.com/maps/place/"
                f"?q=place_id:{place.get('id')}"
            )

            results.append(
                {
                    "id": place.get("id"),
                    "display_name": display_name,
                    "formatted_address": formatted_address,
                    "latitude": location.get("latitude"),
                    "longitude": location.get("longitude"),
                    "google_maps_url": google_maps_url,
                }
            )

        return results