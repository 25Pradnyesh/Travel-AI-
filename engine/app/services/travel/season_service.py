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
    ):

        season = self.CATEGORY_SEASONS.get(

            category,

            self.DEFAULT,

        )

        return {

            "best_months": season["best_months"],

            "peak_season": season["peak_season"],

            "avoid_season": season["avoid"],

            "recommended": ", ".join(

                season["best_months"]

            ),

        }