class TravelTipsService:

    def __init__(self):

        # ==================================================
        # Weather Tips
        # ==================================================

        self.weather_rules = {

            "hot": [

                "Carry plenty of water throughout the day.",
                "Wear sunscreen and sunglasses.",
                "Plan outdoor sightseeing during early morning or evening.",

            ],

            "cold": [

                "Dress in warm layers.",
                "Carry gloves and a jacket.",
                "Expect colder temperatures after sunset.",

            ],

            "rain": [

                "Carry a compact umbrella.",
                "Use waterproof footwear.",
                "Keep electronics protected from rain.",

            ],

            "snow": [

                "Wear insulated winter clothing.",
                "Walk carefully on icy surfaces.",
                "Check road conditions before travelling.",

            ],

            "wind": [

                "Carry a light windproof jacket.",
                "Secure hats and loose belongings outdoors.",

            ],

        }

        # ==================================================
        # Category Tips
        # ==================================================

        self.category_rules = {

            "beach": [

                "Carry swimwear and sunscreen.",
                "Avoid strong afternoon sunlight.",
                "Stay hydrated.",

            ],

            "mountain": [

                "Carry trekking shoes.",
                "Weather can change rapidly.",
                "Start hikes early in the morning.",

            ],

            "city": [

                "Use public transport whenever possible.",
                "Keep valuables secure in crowded areas.",
                "Wear comfortable walking shoes.",

            ],

            "forest": [

                "Carry insect repellent.",
                "Stay on marked trails.",
                "Avoid feeding wildlife.",

            ],

            "desert": [

                "Carry extra drinking water.",
                "Avoid afternoon heat.",
                "Protect yourself from sun exposure.",

            ],

            "lake": [

                "Check boating conditions before visiting.",
                "Be careful near slippery rocks.",
                "Carry waterproof footwear.",

            ],

            "waterfall": [

                "Rocks can be slippery.",
                "Protect cameras from water spray.",

            ]

        }

        # ==================================================
        # Safety Tips
        # ==================================================

        self.safety_rules = {

            "general": [

                "Keep emergency contacts available.",
                "Carry a valid ID.",
                "Respect local laws and customs.",

            ]

        }

        # ==================================================
        # Photography Tips
        # ==================================================

        self.photo_rules = {

            "beach": "Golden hour offers the best beach photos.",

            "mountain": "Visit during sunrise for clearer mountain views.",

            "city": "Blue hour creates excellent city skyline photographs.",

            "forest": "Morning light produces softer forest photography.",

            "lake": "Early morning usually provides calm reflections.",

            "waterfall": "Cloudy weather produces smoother waterfall photos.",

        }

        # ==================================================
        # Best Time Of Day
        # ==================================================

        self.best_time = {

            "beach": "Sunrise or Sunset",

            "mountain": "Early Morning",

            "city": "Morning & Evening",

            "forest": "Morning",

            "lake": "Sunrise",

            "waterfall": "Morning",

            "desert": "Early Morning",

        }

    # ==================================================
    # Helpers
    # ==================================================

    def normalize(

        self,

        value,

    ):

        if value is None:

            return ""

        return str(value).strip().lower()

    def add_unique(

        self,

        destination,

        values,

    ):

        if not values:

            return

        for value in values:

            if value not in destination:

                destination.append(value)


    # ==================================================
    # Weather Tips
    # ==================================================

    def build_weather_tips(

        self,

        weather: str,

    ):

        tips = []

        weather = self.normalize(

            weather,

        )

        for rule, values in self.weather_rules.items():

            if rule in weather:

                self.add_unique(

                    tips,

                    values,

                )

        return tips

    # ==================================================
    # Category Tips
    # ==================================================

    def build_category_tips(

        self,

        category: str,

    ):

        tips = []

        category = self.normalize(

            category,

        )

        for rule, values in self.category_rules.items():

            if rule in category:

                self.add_unique(

                    tips,

                    values,

                )

        return tips

    # ==================================================
    # Safety Tips
    # ==================================================

    def build_safety_tips(

        self,

        place: dict,

    ):

        tips = []

        self.add_unique(

            tips,

            self.safety_rules["general"],

        )

        weather = self.normalize(

            place.get(

                "weather",

            )

            or

            place.get(

                "weather_summary",

            )

        )

        category = self.normalize(

            place.get(

                "category",

            )

        )

        if "rain" in weather:

            tips.append(

                "Roads and walking paths may be slippery.",

            )

        if "snow" in weather:

            tips.append(

                "Watch for icy roads and reduced visibility.",

            )

        if "mountain" in category:

            tips.append(

                "Carry enough drinking water while trekking.",

            )

        if "beach" in category:

            tips.append(

                "Do not ignore warning flags before swimming.",

            )

        if "forest" in category:

            tips.append(

                "Avoid isolated trails after sunset.",

            )

        return list(

            dict.fromkeys(

                tips,

            )

        )


    # ==================================================
    # Photography Tips
    # ==================================================

    def build_photo_tips(

        self,

        category: str,

    ):

        category = self.normalize(

            category,

        )

        for rule, tip in self.photo_rules.items():

            if rule in category:

                return tip

        return "Explore different angles and visit during golden hour."

    # ==================================================
    # Local Tips
    # ==================================================

    def build_local_tips(

        self,

        place: dict,

    ):

        tips = []

        category = self.normalize(

            place.get(

                "category",

            )

        )

        country = self.normalize(

            place.get(

                "country",

            )

        )

        if category == "city":

            tips.extend([

                "Use local public transport whenever possible.",
                "Visit popular attractions early to avoid crowds.",

            ])

        elif category == "beach":

            tips.extend([

                "Carry cash for local beach vendors.",
                "Book water sports in advance during peak season.",

            ])

        elif category == "mountain":

            tips.extend([

                "Start hikes before sunrise.",
                "Carry snacks and sufficient drinking water.",

            ])

        elif category == "lake":

            tips.extend([

                "Boat rides are usually calmer during the morning.",
                "Check weather before renting boats.",

            ])

        elif category == "forest":

            tips.extend([

                "Follow marked trails.",
                "Download offline maps before entering the forest.",

            ])

        if country:

            tips.append(

                f"Respect local customs and etiquette in {country.title()}."

            )

        return list(

            dict.fromkeys(

                tips,

            )

        )

    # ==================================================
    # Transport Recommendation
    # ==================================================

    def build_transport_tip(

        self,

        category: str,

    ):

        category = self.normalize(

            category,

        )

        mapping = {

            "city": "Metro, buses and ride-sharing are the most convenient.",

            "beach": "Renting a scooter or taxi is usually the easiest option.",

            "mountain": "Private taxis or rental cars are recommended.",

            "forest": "A private vehicle is recommended due to limited public transport.",

            "lake": "Local ferries and taxis are commonly available.",

            "desert": "Use guided transport or a 4x4 vehicle.",

        }

        for key, value in mapping.items():

            if key in category:

                return value

        return "Use the most reliable local transport available."

    # ==================================================
    # Things To Avoid
    # ==================================================

    def build_avoid_list(

        self,

        place: dict,

    ):

        avoid = []

        weather = self.normalize(

            place.get(

                "weather",

            )

            or

            place.get(

                "weather_summary",

            )

        )

        category = self.normalize(

            place.get(

                "category",

            )

        )

        if "hot" in weather:

            avoid.append(

                "Avoid long outdoor activities during midday."

            )

        if "rain" in weather:

            avoid.append(

                "Avoid slippery trails and flooded roads."

            )

        if "snow" in weather:

            avoid.append(

                "Avoid driving without winter tyres."

            )

        if "mountain" in category:

            avoid.append(

                "Avoid hiking after sunset."

            )

        if "beach" in category:

            avoid.append(

                "Avoid swimming in rough sea conditions."

            )

        if "forest" in category:

            avoid.append(

                "Avoid leaving marked trails."

            )

        return list(

            dict.fromkeys(

                avoid,

            )

        )

    # ==================================================
    # Generate Travel Intelligence
    # ==================================================

    def generate(

        self,

        place: dict,

        season: dict | None = None,

    ):

        weather = self.normalize(

            place.get(

                "weather",

            )

            or

            place.get(

                "weather_summary",

            )

        )

        category = self.normalize(

            place.get(

                "category",

            )

        )

        travel_tips = []

        self.add_unique(

            travel_tips,

            self.build_weather_tips(

                weather,

            ),

        )

        self.add_unique(

            travel_tips,

            self.build_category_tips(

                category,

            ),

        )

        best_time = self.best_time.get(

            category,

            "Morning",

        )

        if season:

            recommended = season.get(

                "recommended",

            )

            if recommended:

                travel_tips.append(

                    f"Best season to visit: {recommended}."

                )

        return {

            "travel_tips": list(

                dict.fromkeys(

                    travel_tips,

                )

            ),

            "safety_tips": self.build_safety_tips(

                place,

            ),

            "local_tips": self.build_local_tips(

                place,

            ),

            "photography_tip": self.build_photo_tips(

                category,

            ),

            "recommended_transport": self.build_transport_tip(

                category,

            ),

            "avoid": self.build_avoid_list(

                place,

            ),

            "best_time_of_day": best_time,

            "packing_highlights": place.get(

                "packing",

                {},

            ),

        }
