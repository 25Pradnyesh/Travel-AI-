from engine.app.services.travel.budget_estimator import (
    BudgetEstimator,
)
from engine.app.services.travel.season_service import (
    SeasonService,
)
from engine.app.services.travel.travel_category_service import (
    TravelCategoryService,
)
from engine.app.services.travel.travel_tips_service import (
    TravelTipsService,
)


class TravelIntelligenceService:

    def __init__(self):

        self.category = TravelCategoryService()

        self.season = SeasonService()

        self.budget = BudgetEstimator()

        self.tips = TravelTipsService()

    # ==================================================
    # Build Travel Intelligence
    # ==================================================

    def enrich(
        self,
        place: dict,
    ):

        place = place.copy()

        # ------------------------------------------
        # Category
        # ------------------------------------------

        category = self.category.classify(
            place,
        )

        place["category"] = category

        place["category_emoji"] = self.category.emoji(
            category,
        )

        # ------------------------------------------
        # Season
        # ------------------------------------------

        season = self.season.get(
            category,
        )

        place.update(
            season,
        )

        # ------------------------------------------
        # Budget
        # ------------------------------------------

        budget = self.budget.estimate(
            place,
        )

        place.update(
            budget,
        )

        # ------------------------------------------
        # Travel Tips
        # ------------------------------------------

        place["travel_tips"] = self.tips.generate(

            place,

            season,

        )

        # ------------------------------------------
        # Travel Summary
        # ------------------------------------------

        place["travel_summary"] = self.build_summary(
            place,
        )

        return place

    # ==================================================
    # Summary
    # ==================================================

    def build_summary(
        self,
        place: dict,
    ):

        parts = [

            f"{place.get('category_emoji','📍')} {place.get('category','Destination')}",

            f"Best: {place.get('recommended','')}",

            f"Budget: {place.get('budget_level','Unknown')}",

            f"Trip: {place.get('recommended_trip_days','')}",

        ]

        return " • ".join(

            part

            for part in parts

            if part

        )