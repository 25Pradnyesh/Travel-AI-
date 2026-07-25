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

        if len(parts) >= 1:
            country = parts[-1]

        if len(parts) >= 3:
            state = parts[-2]

        query_components = self.extract_query_components(
            query,
        )

        travel_name = self.build_travel_name(

            city=query_components["city"],

            region=query_components["region"],

            display_name=display_name,

            country=country,

        )

        formatted = {

            # =====================================
            # Identity
            # =====================================

            "id": place.get("id"),

            "name": display_name,

            "travel_name": travel_name,

            "verified_query": query,

            # =====================================
            # Structured Location
            # =====================================

            "city": query_components["city"],

            "region": query_components["region"],

            "state": state,

            "country": country,

            # =====================================
            # Coordinates
            # =====================================

            "latitude": place.get(
                "latitude",
            ),

            "longitude": place.get(
                "longitude",
            ),

            # =====================================
            # Address
            # =====================================

            "address": address,

            # =====================================
            # Google
            # =====================================

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

            # =====================================
            # Google Place Intelligence
            # =====================================

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

            # =====================================
            # Rich Travel Metadata
            # =====================================

            "editorial_summary": place.get(
                "editorial_summary",
                "",
            ),

            "opening_hours": place.get(
                "opening_hours",
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

            # =====================================
            # Reserved
            # (future enrichment)
            # =====================================

            "tourism_score": 0,

            "hidden_gem_score": 0,

            "nearby_airport": None,

            "nearby_city": None,

            "nearest_landmarks": [],

            "weather": None,

            "best_season": None,

            "visa_required": None,

        }

        return formatted

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
    # Display Name
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

            region.lower()
            != country.lower()

        ):

            pieces.append(region)

        if (

            country

            and

            country.lower()

            not in [

                p.lower()

                for p in pieces

            ]

        ):

            pieces.append(country)

        return ", ".join(pieces)