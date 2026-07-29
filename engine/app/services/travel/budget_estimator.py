class BudgetEstimator:

    COUNTRY_MULTIPLIER = {

        "India": 0.60,

        "Japan": 1.70,

        "Switzerland": 2.30,

        "Austria": 1.90,

        "Germany": 1.70,

        "France": 1.80,

        "Italy": 1.70,

        "Spain": 1.50,

        "Norway": 2.40,

        "Iceland": 2.60,

    }

    CATEGORY_MULTIPLIER = {

        "City": 1.20,

        "Village": 0.90,

        "Mountain": 1.10,

        "Lake": 1.05,

        "Beach": 1.15,

        "Island": 1.35,

        "National Park": 1.00,

        "Waterfall": 0.95,

        "Temple": 0.85,

        "Forest": 0.95,

        "Glacier": 1.30,

        "Castle": 1.10,

        "Museum": 1.00,

        "Bridge": 0.90,

        "Trail": 1.00,

        "Canyon": 1.20,

        "Heritage Site": 1.10,

        "Volcano": 1.30,

        "Ski Resort": 1.60,

        "Coast": 1.10,

        "Destination": 1.00,

    }

    DEFAULT_CURRENCY = "USD"

    # ==================================================
    # Estimate Budget
    # ==================================================

    def estimate(
        self,
        place: dict,
    ):

        country = place.get(
            "country",
            "",
        )

        category = place.get(
            "category",
            "Destination",
        )

        rating = place.get(
            "rating",
            0,
        )

        reviews = place.get(
            "user_rating_count",
            0,
        )

        multiplier = (

            self.COUNTRY_MULTIPLIER.get(
                country,
                1.0,
            )

            *

            self.CATEGORY_MULTIPLIER.get(
                category,
                1.0,
            )

        )

        # Premium destinations

        if rating >= 4.8:

            multiplier *= 1.10

        elif rating < 4.0:

            multiplier *= 0.95

        # Popular destinations

        if reviews > 100000:

            multiplier *= 1.10

        elif reviews > 10000:

            multiplier *= 1.05

        base_budget = 100

        estimated_daily_budget = round(
            base_budget * multiplier,
        )

        return {

            "budget_level": self.level(
                estimated_daily_budget,
            ),

            "estimated_daily_budget": estimated_daily_budget,

            "currency": place.get(
                "currency",
                self.DEFAULT_CURRENCY,
            ),

            "recommended_trip_days": self.trip_days(
                category,
            ),

        }

    # ==================================================
    # Budget Level
    # ==================================================

    def level(
        self,
        budget: int,
    ):

        if budget < 80:
            return "Budget"

        if budget < 140:
            return "Moderate"

        if budget < 220:
            return "Premium"

        return "Luxury"

    # ==================================================
    # Recommended Trip Duration
    # ==================================================

    def trip_days(
        self,
        category: str,
    ):

        mapping = {

            "Mountain": "2–4 Days",

            "Lake": "1–2 Days",

            "Beach": "3–5 Days",

            "Island": "4–7 Days",

            "Village": "1–2 Days",

            "Town": "1–2 Days",

            "City": "3–4 Days",

            "National Park": "2–3 Days",

            "Temple": "Half Day",

            "Forest": "1–2 Days",

            "Waterfall": "Half Day",

            "Glacier": "2–4 Days",

            "Castle": "2–3 Hours",

            "Museum": "2–4 Hours",

            "Bridge": "1–2 Hours",

            "Trail": "Half Day",

            "Canyon": "1–2 Days",

            "Heritage Site": "1 Day",

            "Volcano": "1–2 Days",

            "Ski Resort": "3–5 Days",

            "Coast": "2–3 Days",

            "Destination": "2 Days",

        }

        return mapping.get(
            category,
            "2 Days",
        )