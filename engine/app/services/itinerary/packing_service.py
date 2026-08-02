class PackingService:

    def suggest(
        self,
        place: dict,
    ):

        packing = {

            "Essentials": [

                "Phone Charger",
                "Power Bank",
                "Water Bottle",
                "Passport / ID",
                "Cash / Cards",
                "Medicines",

            ]

        }

        weather = str(

            place.get(
                "weather"
            )
            or place.get(
                "weather_summary"
            )
            or ""

        ).lower()

        category = str(

            place.get(
                "category"
            )
            or ""

        ).strip().lower()

        # ==========================================
        # Winter
        # ==========================================

        if any(

            word in weather

            for word in [

                "snow",
                "cold",
                "winter",
                "freezing",

            ]

        ):

            packing["Winter"] = [

                "Jacket",
                "Thermals",
                "Gloves",
                "Beanie",
                "Wool Socks",

            ]

        # ==========================================
        # Rain
        # ==========================================

        if any(

            word in weather

            for word in [

                "rain",
                "monsoon",
                "wet",

            ]

        ):

            packing["Rain"] = [

                "Umbrella",
                "Rain Jacket",
                "Waterproof Shoes",

            ]

        # ==========================================
        # Beach
        # ==========================================

        if category == "beach":

            packing["Beach"] = [

                "Swimwear",
                "Flip Flops",
                "Sunscreen",
                "Beach Towel",
                "Sunglasses",

            ]

        # ==========================================
        # Mountains
        # ==========================================

        elif category == "mountain":

            packing["Hiking"] = [

                "Trekking Shoes",
                "Rain Jacket",
                "Flashlight",
                "Snacks",
                "First Aid Kit",

            ]

        # ==========================================
        # City
        # ==========================================

        elif category == "city":

            packing["City"] = [

                "Comfortable Shoes",
                "Day Backpack",
                "Portable Charger",

            ]

        # ==========================================
        # Desert
        # ==========================================

        elif category == "desert":

            packing["Desert"] = [

                "Hat",
                "Sunscreen",
                "Extra Water",
                "Light Clothing",

            ]

        # ==========================================
        # Forest
        # ==========================================

        elif category == "forest":

            packing["Forest"] = [

                "Insect Repellent",
                "Hiking Boots",
                "Flashlight",

            ]

        return packing