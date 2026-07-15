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
            "X-Goog-FieldMask":
                "places.id,"
                "places.displayName,"
                "places.formattedAddress,"
                "places.location",
        }

        body = {
            "textQuery": query
        }

        response = requests.post(
            self.url,
            headers=headers,
            json=body,
        )

        data = response.json()

        places = data.get("places", [])

        if not places:
            return None

        place = places[0]

        return {
            "id": place.get("id"),
            "name": place["displayName"]["text"],
            "address": place.get("formattedAddress"),
            "latitude": place["location"]["latitude"],
            "longitude": place["location"]["longitude"],
        }