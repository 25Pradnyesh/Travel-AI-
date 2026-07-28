class LocationFormatter:

    # ==================================================
    # Main Formatter
    # ==================================================

    def format(
        self,
        query: str,
        place: dict,
    ):

        display_name = (
            place.get(
                "display_name",
                "",
            )
            .strip()
        )

        address = (
            place.get(
                "formatted_address",
                "",
            )
            .strip()
        )

        parts = [

            part.strip()

            for part in address.split(",")

            if part.strip()

        ]

        country = ""
        state = ""
        locality = ""

        if len(parts) >= 1:
            country = parts[-1]

        if len(parts) >= 2:
            state = parts[-2]

        if len(parts) >= 3:
            locality = parts[-3]

        query_parts = self.extract_query_components(
            query,
        )

        travel_name = self.build_travel_name(

            city=query_parts["city"],

            region=query_parts["region"],

            display_name=display_name,

            country=country,

        )

        return {

            # ==================================================
            # Identity
            # ==================================================

            "id": place.get("id"),

            "verified_query": query,

            "name": display_name,

            "travel_name": travel_name,

            # ==================================================
            # Structured Location
            # ==================================================

            "city": query_parts["city"],

            "region": query_parts["region"],

            "locality": locality,

            "state": state,

            "country": country,

            # ==================================================
            # Coordinates
            # ==================================================

            "latitude": place.get(
                "latitude",
            ),

            "longitude": place.get(
                "longitude",
            ),

            # ==================================================
            # Address
            # ==================================================

            "address": address,

            "plus_code": place.get(
                "plus_code",
                {},
            ),

            "viewport": place.get(
                "viewport",
                {},
            ),

            # ==================================================
            # Google
            # ==================================================

            "google_maps_url": place.get(
                "google_maps_url",
                "",
            ),

            "website": place.get(
                "website",
                "",
            ),

            "phone": place.get(
                "phone",
                "",
            ),

            # ==================================================
            # Classification
            # ==================================================

            "primary_type": place.get(
                "primary_type",
                "",
            ),

            "types": place.get(
                "types",
                [],
            ),

            "business_status": place.get(
                "business_status",
                "",
            ),

            # ==================================================
            # Popularity
            # ==================================================

            "rating": float(
                place.get(
                    "rating",
                    0.0,
                )
                or 0.0
            ),

            "user_rating_count": int(
                place.get(
                    "user_rating_count",
                    0,
                )
                or 0
            ),

            "price_level": place.get(
                "price_level",
                "",
            ),

            # ==================================================
            # Travel Metadata
            # ==================================================

            "editorial_summary": place.get(
                "editorial_summary",
                "",
            ),

            "opening_hours": place.get(
                "opening_hours",
                [],
            ),

            "current_opening_hours": place.get(
                "current_opening_hours",
                [],
            ),

            "photos": place.get(
                "photos",
                [],
            ),

            "accessibility": place.get(
                "accessibility",
                {},
            ),

            "utc_offset_minutes": place.get(
                "utc_offset_minutes",
                0,
            ),

            # ==================================================
            # Nearby Intelligence
            # ==================================================

            "nearby_city": None,

            "nearby_airport": None,

            "nearby_railway": None,

            "nearby_landmarks": [],

            "nearby_attractions": [],

            "nearby_hotels": [],

            "nearby_restaurants": [],

            # ==================================================
            # Travel Intelligence
            # ==================================================

            "weather": None,

            "forecast": None,

            "best_season": None,

            "currency": place.get(
                "currency",
            ),

            "languages": place.get(
                "languages",
                [],
            ),

            "timezone": place.get(
                "timezone",
            ),

            "country_code": place.get(
                "country_code",
            ),

            "continent": place.get(
                "continent",
            ),

            "visa_required": None,

            # ==================================================
            # AI Layer
            # ==================================================

            "tourism_score": None,

            "hidden_gem_score": None,

            "gemini_verified": False,

            "gemini_reason": None,

            "confidence_reason": None,

        }

    # ==================================================
    # Query Parser
    # ==================================================

    def extract_query_components(
        self,
        query: str,
    ):

        query = query.strip()

        if not query:

            return {

                "city": "",

                "region": "",

            }

        if "," in query:

            parts = [

                part.strip()

                for part in query.split(",")

                if part.strip()

            ]

            return {

                "city": parts[0],

                "region": ", ".join(
                    parts[1:]
                ),

            }

        return {

            "city": query,

            "region": "",

        }

    # ==================================================
    # Frontend Display Name
    # ==================================================

    def build_travel_name(
        self,
        city: str,
        region: str,
        display_name: str,
        country: str,
    ):

        pieces = []

        if city:

            pieces.append(city)

        elif display_name:

            pieces.append(display_name)

        if (

            region

            and

            country

            and

            region.lower() != country.lower()

        ):

            pieces.append(region)

        if (

            country

            and

            country.lower()

            not in [

                piece.lower()

                for piece in pieces

            ]

        ):

            pieces.append(country)

        return ", ".join(pieces)