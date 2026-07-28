from timezonefinder import TimezoneFinder
import pycountry


COUNTRY_METADATA = {

    "Austria": {
        "continent": "Europe",
        "currency": "EUR",
        "languages": ["German"],
    },

    "Switzerland": {
        "continent": "Europe",
        "currency": "CHF",
        "languages": [
            "German",
            "French",
            "Italian",
            "Romansh",
        ],
    },

    "Italy": {
        "continent": "Europe",
        "currency": "EUR",
        "languages": ["Italian"],
    },

    "France": {
        "continent": "Europe",
        "currency": "EUR",
        "languages": ["French"],
    },

    "Germany": {
        "continent": "Europe",
        "currency": "EUR",
        "languages": ["German"],
    },

    "Japan": {
        "continent": "Asia",
        "currency": "JPY",
        "languages": ["Japanese"],
    },

    "Norway": {
        "continent": "Europe",
        "currency": "NOK",
        "languages": ["Norwegian"],
    },

    "Spain": {
        "continent": "Europe",
        "currency": "EUR",
        "languages": ["Spanish"],
    },

    "Iceland": {
        "continent": "Europe",
        "currency": "ISK",
        "languages": ["Icelandic"],
    },

    "India": {
        "continent": "Asia",
        "currency": "INR",
        "languages": [
            "Hindi",
            "English",
        ],
    },

}


class GeoEnrichmentService:

    def __init__(self):

        self.timezone_finder = TimezoneFinder()

    # ==================================================
    # Country Lookup
    # ==================================================

    def get_country_code(
        self,
        country: str,
    ):

        if not country:
            return ""

        try:

            match = pycountry.countries.lookup(
                country,
            )

            return match.alpha_2

        except LookupError:

            return ""

    # ==================================================
    # Timezone
    # ==================================================

    def get_timezone(
        self,
        latitude,
        longitude,
    ):

        if latitude is None:
            return ""

        if longitude is None:
            return ""

        return (

            self.timezone_finder.timezone_at(

                lat=latitude,

                lng=longitude,

            )

            or ""

        )

    # ==================================================
    # Enrichment
    # ==================================================

    def enrich(
        self,
        location: dict,
    ):

        enriched = location.copy()

        country = enriched.get(
            "country",
            "",
        )

        latitude = enriched.get(
            "latitude",
        )

        longitude = enriched.get(
            "longitude",
        )

        metadata = COUNTRY_METADATA.get(
            country,
            {},
        )

        enriched.update(

            {

                # ==============================
                # Geography
                # ==============================

                "country_code": self.get_country_code(
                    country,
                ),

                "continent": metadata.get(
                    "continent",
                    "",
                ),

                # ==============================
                # Currency
                # ==============================

                "currency": metadata.get(
                    "currency",
                    enriched.get(
                        "currency",
                    ),
                ),

                # ==============================
                # Language
                # ==============================

                "languages": metadata.get(
                    "languages",
                    [],
                ),

                # ==============================
                # Time
                # ==============================

                "timezone": self.get_timezone(

                    latitude,

                    longitude,

                ),

                # ==============================
                # Reserved
                # (Upcoming Phases)
                # ==============================

                "weather": enriched.get(
                    "weather",
                ),

                "forecast": enriched.get(
                    "forecast",
                ),

                "best_season": enriched.get(
                    "best_season",
                ),

                "nearby_city": enriched.get(
                    "nearby_city",
                ),

                "nearby_airport": enriched.get(
                    "nearby_airport",
                ),

                "nearby_landmarks": enriched.get(
                    "nearby_landmarks",
                    [],
                ),

                "nearby_attractions": enriched.get(
                    "nearby_attractions",
                    [],
                ),

                "nearby_hotels": enriched.get(
                    "nearby_hotels",
                    [],
                ),

                "nearby_restaurants": enriched.get(
                    "nearby_restaurants",
                    [],
                ),

                "tourism_score": enriched.get(
                    "tourism_score",
                ),

                "hidden_gem_score": enriched.get(
                    "hidden_gem_score",
                ),

            }

        )

        return enriched