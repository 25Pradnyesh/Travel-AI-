class ActivityService:

    ACTIVITIES = {

        "Mountain": [
            "Hiking",
            "Camping",
            "Photography",
            "Sunrise Viewpoint",
            "Rock Climbing",
        ],

        "Lake": [
            "Boating",
            "Kayaking",
            "Photography",
            "Picnic",
            "Nature Walk",
        ],

        "Beach": [
            "Swimming",
            "Surfing",
            "Snorkeling",
            "Sunset Walk",
            "Beach Volleyball",
        ],

        "Island": [
            "Island Hopping",
            "Boat Tours",
            "Snorkeling",
            "Scuba Diving",
            "Photography",
        ],

        "Village": [
            "Local Food",
            "Photography",
            "Walking Tour",
            "Cultural Experience",
            "Shopping",
        ],

        "City": [
            "Sightseeing",
            "Museums",
            "Street Food",
            "Shopping",
            "Nightlife",
        ],

        "Temple": [
            "Temple Visit",
            "Meditation",
            "Photography",
            "Local Culture",
        ],

        "Forest": [
            "Nature Walk",
            "Bird Watching",
            "Camping",
            "Photography",
        ],

        "Waterfall": [
            "Photography",
            "Picnic",
            "Swimming",
            "Nature Walk",
        ],

        "Glacier": [
            "Ice Walk",
            "Photography",
            "Guided Tours",
        ],

        "National Park": [
            "Wildlife Safari",
            "Camping",
            "Photography",
            "Nature Trail",
        ],

    }

    # ===============================================

    def suggest(
        self,
        category: str,
    ):

        return self.ACTIVITIES.get(

            category,

            [

                "Photography",

                "Sightseeing",

            ],

        )