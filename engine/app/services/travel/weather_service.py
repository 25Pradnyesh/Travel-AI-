import os

import requests


class WeatherService:

    def __init__(self):

        self.api_key = os.getenv(
            "OPENWEATHER_API_KEY",
        )

        self.url = (
            "https://api.openweathermap.org/data/2.5/weather"
        )

    # ==================================================
    # Fetch Weather
    # ==================================================

    def get_weather(
        self,
        latitude: float,
        longitude: float,
    ):

        if latitude is None or longitude is None:

            return self.empty()

        if not self.api_key:

            print(
                "⚠️ OPENWEATHER_API_KEY missing."
            )

            return self.empty()

        params = {

            "lat": latitude,

            "lon": longitude,

            "appid": self.api_key,

            "units": "metric",

        }

        try:

            response = requests.get(

                self.url,

                params=params,

                timeout=10,

            )

            response.raise_for_status()

            data = response.json()

        except requests.RequestException as e:

            print(
                f"❌ Weather API Error: {e}"
            )

            return self.empty()

        weather = data.get(
            "weather",
            [{}],
        )[0]

        main = data.get(
            "main",
            {},
        )

        wind = data.get(
            "wind",
            {},
        )

        return {

            "condition": weather.get(
                "main",
                "",
            ),

            "description": weather.get(
                "description",
                "",
            ),

            "icon": weather.get(
                "icon",
                "",
            ),

            "temperature": main.get(
                "temp",
            ),

            "feels_like": main.get(
                "feels_like",
            ),

            "humidity": main.get(
                "humidity",
            ),

            "pressure": main.get(
                "pressure",
            ),

            "visibility": data.get(
                "visibility",
            ),

            "wind_speed": wind.get(
                "speed",
            ),

            "clouds": data.get(
                "clouds",
                {},
            ).get(
                "all",
            ),

        }

    # ==================================================
    # Empty Weather
    # ==================================================

    def empty(
        self,
    ):

        return {

            "condition": "",

            "description": "",

            "icon": "",

            "temperature": None,

            "feels_like": None,

            "humidity": None,

            "pressure": None,

            "visibility": None,

            "wind_speed": None,

            "clouds": None,

        }