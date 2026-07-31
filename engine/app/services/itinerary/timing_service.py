class TimingService:

    def recommend(
        self,
        place: dict,
    ):

        season = place.get(

            "best_season",

            "All Year",

        )

        category = place.get(

            "category",

            "",

        )

        if category == "Temple":

            return {

                "best_time_of_day": "Morning",

                "best_season": season,

            }

        if category == "Beach":

            return {

                "best_time_of_day": "Sunrise / Sunset",

                "best_season": season,

            }

        return {

            "best_time_of_day": "Daytime",

            "best_season": season,

        }