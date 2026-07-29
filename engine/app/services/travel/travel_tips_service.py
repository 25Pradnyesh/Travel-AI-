class TravelTipsService:

    CATEGORY_TIPS = {

        "Mountain": [

            "Carry layered clothing.",

            "Wear proper hiking shoes.",

            "Start hikes early in the morning.",

            "Check trail conditions before visiting.",

        ],

        "Lake": [

            "Visit during sunrise or sunset for the best views.",

            "Carry a light jacket even in summer.",

            "Respect protected natural areas.",

        ],

        "Beach": [

            "Carry sunscreen and sunglasses.",

            "Stay hydrated.",

            "Avoid peak afternoon sun.",

        ],

        "Island": [

            "Book ferries in advance during peak season.",

            "Carry cash for small local businesses.",

        ],

        "Waterfall": [

            "Wear waterproof footwear.",

            "Be cautious of slippery rocks.",

        ],

        "Forest": [

            "Carry insect repellent.",

            "Stay on marked trails.",

        ],

        "National Park": [

            "Arrive early to avoid crowds.",

            "Respect wildlife and park rules.",

        ],

        "Village": [

            "Support local businesses.",

            "Respect local customs and traditions.",

        ],

        "City": [

            "Use public transport whenever possible.",

            "Keep valuables secure in crowded places.",

        ],

        "Temple": [

            "Dress modestly.",

            "Follow photography restrictions.",

        ],

        "Destination": [

            "Check local regulations before visiting.",

        ],

    }

    SEASON_TIPS = {

        "Summer": [

            "Carry plenty of water.",

            "Wear breathable clothing.",

        ],

        "Winter": [

            "Pack warm clothing.",

            "Check weather forecasts before travelling.",

        ],

        "Spring": [

            "Ideal season for photography.",

        ],

        "Autumn": [

            "Expect fewer crowds.",

        ],

        "Monsoon": [

            "Carry waterproof gear.",

            "Expect slippery roads and trails.",

        ],

        "Festival Season": [

            "Book accommodation early.",

        ],

    }

    COUNTRY_TIPS = {

        "Japan": [

            "Carry some cash.",

            "Respect public etiquette.",

        ],

        "India": [

            "Carry cash in remote areas.",

            "Stay hydrated.",

        ],

        "Switzerland": [

            "Public transport is highly reliable.",

        ],

        "Austria": [

            "Book mountain cable cars in advance during peak season.",

        ],

        "Norway": [

            "Weather changes quickly in the mountains.",

        ],

    }

    # ==================================================
    # Generate Tips
    # ==================================================

    def generate(
        self,
        place: dict,
        season: dict,
    ):

        category = place.get(
            "category",
            "Destination",
        )

        country = place.get(
            "country",
            "",
        )

        peak = season.get(
            "peak_season",
            "",
        )

        tips = []

        tips.extend(

            self.CATEGORY_TIPS.get(

                category,

                [],

            )

        )

        tips.extend(

            self.SEASON_TIPS.get(

                peak,

                [],

            )

        )

        tips.extend(

            self.COUNTRY_TIPS.get(

                country,

                [],

            )

        )

        # Remove duplicates

        seen = set()

        unique = []

        for tip in tips:

            key = tip.lower()

            if key in seen:

                continue

            seen.add(key)

            unique.append(tip)

        return unique[:8]