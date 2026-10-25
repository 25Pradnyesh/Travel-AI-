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

DOCUMENTED_STAY_RULES = {
    # Destination scope and categories
    "island": "3–5 Days",
    "archipelago": "3–5 Days",
    "region": "3–5 Days",
    "province": "3–5 Days",
    "beach": "3–4 Days",
    "national park": "2–3 Days",
    "nature reserve": "2–3 Days",
    "mountain": "2–3 Days",
    "lake": "2–3 Days",
    "forest": "2–3 Days",
    "city": "2–3 Days",
    "village": "1–2 Days",
    "temple": "1 Day",
    "waterfall": "1 Day",
    "glacier": "1–2 Days",
    "desert": "2–3 Days",
}

MAJOR_METROPOLISES = {
    "paris", "tokyo", "rome", "london", "new york", "kyoto", "seoul",
    "berlin", "barcelona", "amsterdam", "bangkok", "singapore", "sydney",
    "vienna", "prague", "florence", "venice", "madrid", "istanbul",
}


def compute_documented_stay(place: dict) -> str | None:
    """
    Computes documented recommended visit duration based on destination scope:
    - Island / Archipelago / Region / Province: 3–5 Days (e.g. Jeju Island, Bali)
    - Major Metropolis / World City / Capital: 3–4 Days (e.g. Paris, Tokyo, Rome, Kyoto, Seoul)
    - City / Historic Town: 2–3 Days
    - National Park / Mountain / Nature Reserve: 2–3 Days
    - Beach Resort / Coastal Area: 3–4 Days
    - Point of Interest / Temple / Landmark / Waterfall: 1 Day
    - Otherwise: None (hidden, never fabricate generic ranges)
    """
    if not isinstance(place, dict):
        return None

    existing = place.get("recommended_trip_days")
    if existing and isinstance(existing, str) and existing.strip() and existing.strip() != "1-3 Days":
        return existing.strip()

    name = (place.get("name") or place.get("travel_name") or place.get("display_name") or "").lower().strip()
    category = (place.get("category") or "").lower().strip()
    types = [str(t).lower() for t in (place.get("types") or [])]

    # 1. Major metropolises
    for metro in MAJOR_METROPOLISES:
        if metro in name:
            return "3–4 Days"

    # 2. Category lookup
    if category in DOCUMENTED_STAY_RULES:
        return DOCUMENTED_STAY_RULES[category]

    # 3. Type / Name heuristics
    if "island" in name or "archipelago" in name or "island" in types:
        return "3–5 Days"
    if any(t in {"national_park", "natural_feature", "park"} for t in types):
        return "2–3 Days"
    if any(t in {"city", "locality", "administrative_area_level_2"} for t in types):
        return "2–3 Days"
    if any(t in {"tourist_attraction", "place_of_worship", "museum", "point_of_interest", "landmark"} for t in types):
        return "1 Day"

    return None


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
            latitude=place.get("latitude"),
            longitude=place.get("longitude"),
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
        # Documented Stay Duration
        # ------------------------------------------
        place["recommended_trip_days"] = compute_documented_stay(place)

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

        ]

        stay = place.get('recommended_trip_days')
        if stay:
            summary.append(f"🕒 {stay}")

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

            "budget_basis": place.get(
                "budget_basis",
                "estimate",
            ),
            "budget_model": place.get("budget_model"),
            "currency": place.get("currency", "USD"),
            "best_season": place.get("best_season"),
            "recommended_window": place.get("recommended_window"),
            "recommended_reason": place.get("recommended_reason"),
            "temperature_range": place.get("temperature_range"),
            "season_cards": place.get("season_cards", []),
            "climate_summary": place.get("climate_summary"),
            "weather_basis": place.get(
                "weather_basis",
            ),
            "weather_source": place.get(
                "weather_source",
            ),
            "peak_months": place.get(
                "peak_months",
                [],
            ),
            "shoulder_months": place.get(
                "shoulder_months",
                [],
            ),
            "avoid_months": place.get(
                "avoid_months",
                [],
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