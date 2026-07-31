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

from engine.app.services.itinerary.itinerary_service import (
    ItineraryService,
)


class TravelIntelligenceService:

    def __init__(self):

        self.category = TravelCategoryService()

        self.season = SeasonService()

        self.budget = BudgetEstimator()

        self.tips = TravelTipsService()

        self.itinerary = ItineraryService()

    # ==================================================
    # Travel Intelligence
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
        # Season Intelligence
        # ------------------------------------------

        season = self.season.get(
            category,
        )

        place.update(
            season,
        )

        # ------------------------------------------
        # Budget Intelligence
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
        # Itinerary Intelligence
        # ------------------------------------------

        place = self.itinerary.enrich(
            place,
        )

        # ------------------------------------------
        # AI Travel Summary
        # ------------------------------------------

        place["travel_summary"] = self.build_summary(
            place,
        )

        return place

    # ==================================================
    # Summary Builder
    # ==================================================

    def build_summary(
        self,
        place: dict,
    ):

        summary = [

            f"{place.get('category_emoji', '📍')} {place.get('category', 'Destination')}",

            f"📅 {place.get('best_season', 'All Year')}",

            f"💰 {place.get('budget_level', 'Unknown')}",

            f"🕒 {place.get('recommended_trip_days', '1 Day')}",

        ]

        return " • ".join(summary)

    # ==================================================
    # Export
    # ==================================================

    def export(
        self,
        place: dict,
    ):

        return {

            "travel_name": place.get(
                "travel_name",
            ),

            "country": place.get(
                "country",
            ),

            "category": place.get(
                "category",
            ),

            "category_emoji": place.get(
                "category_emoji",
            ),

            "best_season": place.get(
                "best_season",
            ),

            "recommended_trip_days": place.get(
                "recommended_trip_days",
            ),

            "budget_level": place.get(
                "budget_level",
            ),

            "estimated_daily_budget": place.get(
                "estimated_daily_budget",
            ),

            "travel_tips": place.get(
                "travel_tips",
                [],
            ),

            "activities": place.get(
                "activities",
                [],
            ),

            "packing_list": place.get(
                "packing_list",
                {},
            ),

            "timing": place.get(
                "timing",
                {},
            ),

            "sample_itinerary": place.get(
                "sample_itinerary",
                [],
            ),

            "travel_summary": place.get(
                "travel_summary",
            ),

        }