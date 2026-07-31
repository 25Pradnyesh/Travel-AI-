class TripPlanner:

    def build(
        self,
        place: dict,
    ):

        category = place.get(

            "category",

            "Destination",

        )

        plans = {

            "Mountain": [

                "Reach Early Morning",

                "Explore Trails",

                "Sunset Viewpoint",

            ],

            "Lake": [

                "Morning Walk",

                "Boating",

                "Photography",

            ],

            "Beach": [

                "Sunrise",

                "Water Sports",

                "Sunset",

            ],

            "City": [

                "Breakfast",

                "Sightseeing",

                "Night Market",

            ],

        }

        return plans.get(

            category,

            [

                "Explore",

                "Photography",

                "Relax",

            ],

        )