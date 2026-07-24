import os
import requests


class GooglePlacesService:

    def __init__(self):

        self.api_key = os.getenv("GOOGLE_PLACES_API_KEY")

        self.url = (
            "https://places.googleapis.com/v1/places:searchText"
        )

    def search(self, query: str):

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

            parts = [
                part.strip()
                for part in formatted_address.split(",")
                if part.strip()
            ]

            country = parts[-1] if parts else ""

            state = ""

            if len(parts) >= 2:
                state = parts[-2]

            # -----------------------------------------
            # Build our normalized travel name
            # -----------------------------------------

            if "," in query:
                travel_name = query.strip()

                if (
                    country
                    and country.lower()
                    not in travel_name.lower()
                ):
                    travel_name = (
                        f"{travel_name}, {country}"
                    )

            elif country:

                travel_name = (
                    f"{display_name}, {country}"
                )

            else:

                travel_name = display_name

            google_maps_url = (
                "https://www.google.com/maps/place/"
                f"?q=place_id:{place.get('id')}"
            )

            results.append(
                {
                    "id": place.get("id"),
                    "name": display_name,
                    "travel_name": travel_name,
                    "country": country,
                    "state": state,
                    "address": formatted_address,
                    "latitude": location.get("latitude"),
                    "longitude": location.get("longitude"),
                    "google_maps_url": google_maps_url,
                }
            )

        return results