class SeasonService:

    CATEGORY_SEASONS = {

        "Mountain": {

            "best_months": [
                "May",
                "June",
                "July",
                "August",
                "September",
            ],

            "peak_season": "Summer",

            "avoid": "Winter",

        },

        "Lake": {

            "best_months": [
                "May",
                "June",
                "July",
                "August",
            ],

            "peak_season": "Summer",

            "avoid": "Winter",

        },

        "Beach": {

            "best_months": [
                "November",
                "December",
                "January",
                "February",
            ],

            "peak_season": "Winter",

            "avoid": "Monsoon",

        },

        "Island": {

            "best_months": [
                "November",
                "December",
                "January",
                "February",
                "March",
            ],

            "peak_season": "Winter",

            "avoid": "Cyclone Season",

        },

        "Waterfall": {

            "best_months": [
                "July",
                "August",
                "September",
            ],

            "peak_season": "Monsoon",

            "avoid": "Dry Season",

        },

        "Forest": {

            "best_months": [
                "October",
                "November",
                "December",
                "January",
                "February",
            ],

            "peak_season": "Winter",

            "avoid": "Heavy Monsoon",

        },

        "National Park": {

            "best_months": [
                "October",
                "November",
                "December",
                "January",
                "February",
                "March",
            ],

            "peak_season": "Winter",

            "avoid": "Monsoon",

        },

        "Village": {

            "best_months": [
                "April",
                "May",
                "June",
                "September",
                "October",
            ],

            "peak_season": "Spring",

            "avoid": "Extreme Winter",

        },

        "City": {

            "best_months": [
                "March",
                "April",
                "October",
                "November",
            ],

            "peak_season": "Spring",

            "avoid": "Peak Summer",

        },

        "Temple": {

            "best_months": [
                "October",
                "November",
                "December",
                "January",
                "February",
            ],

            "peak_season": "Festival Season",

            "avoid": "Peak Summer",

        },

        "Desert": {

            "best_months": [
                "November",
                "December",
                "January",
                "February",
            ],

            "peak_season": "Winter",

            "avoid": "Summer",

        },

        "Glacier": {

            "best_months": [
                "June",
                "July",
                "August",
            ],

            "peak_season": "Summer",

            "avoid": "Winter",

        },

    }

    DEFAULT = {

        "best_months": [

            "March",

            "April",

            "October",

            "November",

        ],

        "peak_season": "Spring",

        "avoid": "Extreme Weather",

    }

    # ==================================================
    # Main
    # ==================================================

    def get(
        self,
        category: str,
        latitude: float | None = None,
        longitude: float | None = None,
    ):

        season = self.CATEGORY_SEASONS.get(

            category,

            self.DEFAULT,

        )

        if latitude is not None and longitude is not None:
            try:
                from engine.app.services.places.open_meteo_client import OpenMeteoClient
                client = OpenMeteoClient()
                hist_weather = client.get_historical_best_months(latitude, longitude)
                if hist_weather and hist_weather.get("best_months"):
                    return {
                        "best_months": hist_weather["best_months"],
                        "peak_months": hist_weather.get("peak_months", hist_weather["best_months"][:3]),
                        "shoulder_months": hist_weather.get("shoulder_months", hist_weather["best_months"][3:]),
                        "avoid_months": hist_weather.get("avoid_months", []),
                        "peak_season": season["peak_season"],
                        "avoid_season": ", ".join(hist_weather.get("avoid_months", [])) or season["avoid"],
                        "recommended": ", ".join(hist_weather["best_months"]),
                        "weather_basis": "based on historical weather",
                        "weather_source": "Open-Meteo Historical Weather",
                    }
            except Exception:
                pass

        return {

            "best_months": season["best_months"],

            "peak_months": season["best_months"][:3],

            "shoulder_months": season["best_months"][3:],

            "avoid_months": [season["avoid"]],

            "peak_season": season["peak_season"],

            "avoid_season": season["avoid"],

            "recommended": ", ".join(

                season["best_months"]

            ),

            "weather_basis": "category heuristic",

        }