from engine.app.services.itinerary.activity_service import (
    ActivityService,
)

from engine.app.services.itinerary.packing_service import (
    PackingService,
)

from engine.app.services.itinerary.timing_service import (
    TimingService,
)

from engine.app.services.itinerary.trip_planner import (
    TripPlanner,
)


class ItineraryService:

    def __init__(self):

        self.activity = ActivityService()

        self.packing = PackingService()

        self.timing = TimingService()

        self.trip = TripPlanner()

    # ==================================================

    def enrich(
        self,
        place: dict,
    ):

        place["activities"] = self.activity.suggest(

            place.get(

                "category",

                "",

            )

        )

        place["packing_list"] = self.packing.suggest(

            place,

        )

        place["timing"] = self.timing.recommend(

            place,

        )

        place["sample_itinerary"] = self.trip.build(

            place,

        )

        return place