class PackingService:

    def __init__(self):

        self.essentials = [

            "Phone Charger",
            "Power Bank",
            "Water Bottle",
            "Passport / ID",
            "Cash / Cards",
            "Medicines",

        ]

        self.weather_rules = {

            "winter": [

                "Jacket",
                "Thermals",
                "Gloves",
                "Beanie",
                "Wool Socks",

            ],

            "rain": [

                "Umbrella",
                "Rain Jacket",
                "Waterproof Shoes",

            ],

            "hot": [

                "Cap",
                "Sunglasses",
                "Light Clothing",
                "Sunscreen",

            ],

            "wind": [

                "Windbreaker"

            ]

        }

        self.category_rules = {

            "beach": [

                "Swimwear",
                "Flip Flops",
                "Beach Towel",
                "Sunscreen"

            ],

            "mountain": [

                "Trekking Shoes",
                "First Aid Kit",
                "Flashlight",
                "Rain Jacket",
                "Energy Snacks"

            ],

            "city": [

                "Comfortable Shoes",
                "Day Backpack",
                "Portable Charger"

            ],

            "forest": [

                "Insect Repellent",
                "Hiking Boots",
                "Flashlight"

            ],

            "desert": [

                "Hat",
                "Extra Water",
                "Lip Balm",
                "Sunscreen"

            ],

            "lake": [

                "Quick Dry Clothes",
                "Water Shoes"

            ],

            "snow": [

                "Snow Boots",
                "Gloves",
                "Thermals"

            ]

        }
        self.adventure_categories = {

            "mountain",
            "forest",
            "desert",
            "lake",
            "waterfall",
            "canyon",
            "national park",

        }
        
    def normalize(
        self,
        value: object,
    ) -> str:
        
        if value is None:
            return ""

        return str(value).strip().lower()

    def add_items(

        self,

        items: dict,

        section: str,

        values: list,

    ):

        if not values:

            return

        existing = items.get(

            section,

            [],

        )

        items[section] = list(

            dict.fromkeys(

                existing + values

            )

        )

    def suggest(

        self,

        place: dict,

    ):

        weather = self.normalize(

            place.get("weather")

            or place.get("weather_summary")

        )

        category = self.normalize(

            place.get("category")

        )

        items = {
            "Essentials": list(dict.fromkeys(self.essentials))
        }

        # ==========================================
        # Weather Rules
        # ==========================================

        weather_keywords = {

            "winter": [

                "winter",
                "snow",
                "cold",
                "freezing",
                "ice",

            ],

            "rain": [

                "rain",
                "monsoon",
                "wet",
                "storm",

            ],

            "hot": [

                "hot",
                "summer",
                "sunny",
                "warm",

            ],

            "wind": [

                "wind",
                "windy",

            ],

        }

        weather_tokens = set(weather.split())

        for rule, keywords in weather_keywords.items():

            if any(

                keyword in weather_tokens

                or keyword in weather

                for keyword in keywords

            ):

                self.add_items(

                    items,

                    rule.title(),

                    self.weather_rules.get(

                        rule,

                        [],

                    ),

                )


        # ==========================================
        # Category Rules
        # ==========================================

        for rule, values in self.category_rules.items():

            if rule in category:

                self.add_items(

                    items,

                    rule.title(),

                    values,

                )



        # ==========================================
        # Trip Duration
        # ==========================================

        trip_days = place.get(

            "recommended_trip_days",

            1,

        )

        try:

            trip_days = int(trip_days)

        except Exception:

            trip_days = 1

        if trip_days >= 5:

            self.add_items(

                items,

                "Extended Trip",

                [

                    "Extra Clothes",
                    "Laundry Bag",
                    "Travel Detergent",
                    "Extra Chargers",

                ],

            )

        # ==========================================
        # International Travel
        # ==========================================

        international = place.get(

            "international",

            False,

        )

        if international:

            self.add_items(

                items,

                "International",

                [

                    "Passport",
                    "Visa Documents",
                    "Travel Insurance",
                    "Universal Adapter",
                    "Foreign Currency",

                ],

            )

        # ==========================================
        # High Altitude
        # ==========================================

        elevation = place.get(

            "elevation",

            0,

        )

        try:

            elevation = float(elevation)

        except Exception:

            elevation = 0

        if elevation >= 2500:

            self.add_items(

                items,

                "High Altitude",

                [

                    "Lip Balm",
                    "Moisturizer",
                    "Sunglasses",
                    "Water Bottle",

                ],

            )

        # ==========================================
        # Adventure Destinations
        # ==========================================

        ADVENTURE_CATEGORIES = {

            "mountain",
            "forest",
            "desert",
            "lake",
            "waterfall",
            "canyon",
            "national park",

        }

        if any(
            adventure in category
            for adventure in self.adventure_categories
        ):


            self.add_items(

                items,

                "Adventure",

                [

                    "First Aid Kit",
                    "Pocket Knife",
                    "Offline Maps",
                    "Power Bank",

                ],

            )

        # ==========================================
        # Remove Empty Sections
        # ==========================================

        items = {

            key: value

            for key, value in items.items()

            if value

        }

        return items

