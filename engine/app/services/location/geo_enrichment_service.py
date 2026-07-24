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

    def enrich(
        self,
        location: dict,
    ):

        country = location.get("country", "")

        latitude = location.get("latitude")

        longitude = location.get("longitude")

        metadata = COUNTRY_METADATA.get(
            country,
            {},
        )

        iso = pycountry.countries.get(
            name=country
        )

        country_code = ""

        if iso:
            country_code = iso.alpha_2

        timezone = ""

        if (
            latitude is not None
            and longitude is not None
        ):

            timezone = (
                self.timezone_finder.timezone_at(
                    lat=latitude,
                    lng=longitude,
                )
                or ""
            )

        enriched = location.copy()

        enriched.update(
            {
                "country_code": country_code,
                "continent": metadata.get(
                    "continent",
                    "",
                ),
                "currency": metadata.get(
                    "currency",
                    "",
                ),
                "languages": metadata.get(
                    "languages",
                    [],
                ),
                "timezone": timezone,
            }
        )

        return enriched