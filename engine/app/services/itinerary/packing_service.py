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

            ]

        }

        weather = place.get(

            "weather",

            "",

        ).lower()

        category = place.get(

            "category",

            "",

        )

        if "snow" in weather:

            packing["Winter"] = [

                "Jacket",

                "Thermals",

                "Gloves",

                "Beanie",

            ]

        if category == "Beach":

            packing["Beach"] = [

                "Swimwear",

                "Flip Flops",

                "Sunscreen",

                "Towel",

            ]

        if category == "Mountain":

            packing["Hiking"] = [

                "Trekking Shoes",

                "Rain Jacket",

                "Flashlight",

                "Snacks",

            ]

        return packing