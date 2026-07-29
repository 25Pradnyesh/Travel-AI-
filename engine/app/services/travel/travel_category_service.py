class TravelCategoryService:

    CATEGORY_RULES = {

        "Mountain": {
            "mountain_peak",
            "mountain",
            "peak",
            "hill",
        },

        "Lake": {
            "lake",
        },

        "Beach": {
            "beach",
        },

        "Island": {
            "island",
        },

        "Waterfall": {
            "waterfall",
        },

        "Forest": {
            "forest",
        },

        "National Park": {
            "national_park",
            "park",
        },

        "Village": {
            "village",
            "hamlet",
        },

        "Town": {
            "town",
        },

        "City": {
            "locality",
            "city",
        },

        "Temple": {
            "temple",
            "hindu_temple",
            "church",
            "mosque",
            "synagogue",
            "place_of_worship",
        },

        "Castle": {
            "castle",
        },

        "Museum": {
            "museum",
        },

        "Bridge": {
            "bridge",
        },

        "Trail": {
            "hiking_area",
            "trail",
        },

        "Canyon": {
            "canyon",
            "gorge",
        },

        "Desert": {
            "desert",
        },

        "Glacier": {
            "glacier",
        },

    }

    # ==================================================
    # Main
    # ==================================================

    def classify(
        self,
        place: dict,
    ):

        types = {

            t.lower()

            for t in place.get(
                "types",
                [],
            )

        }

        primary = place.get(
            "primary_type",
            "",
        ).lower()

        searchable = " ".join(

            [

                place.get(
                    "travel_name",
                    "",
                ),

                place.get(
                    "editorial_summary",
                    "",
                ),

                primary,

                " ".join(types),

            ]

        ).lower()

        # ------------------------------------------
        # Google Types
        # ------------------------------------------

        for category, keywords in self.CATEGORY_RULES.items():

            if primary in keywords:

                return category

            if any(

                keyword in types

                for keyword in keywords

            ):

                return category

        # ------------------------------------------
        # Text Matching
        # ------------------------------------------

        for category, keywords in self.CATEGORY_RULES.items():

            for keyword in keywords:

                if keyword.replace(
                    "_",
                    " ",
                ) in searchable:

                    return category

        # ------------------------------------------
        # Heuristics
        # ------------------------------------------

        if "unesco" in searchable:

            return "Heritage Site"

        if "volcano" in searchable:

            return "Volcano"

        if "ski" in searchable:

            return "Ski Resort"

        if "coast" in searchable:

            return "Coast"

        return "Destination"

    # ==================================================
    # Emoji (Frontend)
    # ==================================================

    def emoji(
        self,
        category: str,
    ):

        mapping = {

            "Mountain": "🏔️",

            "Lake": "🏞️",

            "Beach": "🏖️",

            "Island": "🏝️",

            "Waterfall": "💦",

            "Forest": "🌲",

            "National Park": "🌿",

            "Village": "🏘️",

            "Town": "🏡",

            "City": "🏙️",

            "Temple": "🛕",

            "Castle": "🏰",

            "Museum": "🏛️",

            "Bridge": "🌉",

            "Trail": "🥾",

            "Canyon": "🏜️",

            "Desert": "🏜️",

            "Glacier": "🧊",

            "Heritage Site": "🏛️",

            "Volcano": "🌋",

            "Ski Resort": "🎿",

            "Coast": "🌊",

            "Destination": "📍",

        }

        return mapping.get(
            category,
            "📍",
        )