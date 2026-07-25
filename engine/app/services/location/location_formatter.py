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
            # IDs
            # =====================================

            "id": place.get("id"),

            # =====================================
            # Original Google Data
            # =====================================

            "name": display_name,

            "verified_query": query,

            # =====================================
            # Structured Location
            # =====================================

            "city": query_components["city"],

            "region": query_components["region"],

            "state": state,

            "country": country,

            "travel_name": travel_name,

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
            # Google Maps
            # =====================================

            "google_maps_url": place.get(
                "google_maps_url",
            ),

            # =====================================
            # Google Intelligence
            # =====================================

            "primary_type": place.get(
                "primary_type",
                "",
            ),

            "types": place.get(
                "types",
                [],
            ),

            "rating": place.get(
                "rating",
                0.0,
            ),

            "user_rating_count": place.get(
                "user_rating_count",
                0,
            ),

            "business_status": place.get(
                "business_status",
                "",
            ),

            "viewport": place.get(
                "viewport",
                {},
            ),

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

            city = parts[0]

            region = ", ".join(
                parts[1:],
            )

            return {

                "city": city,

                "region": region,

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
    ) -> str:

        pieces = []

        if city:

            pieces.append(
                city,
            )

        elif display_name:

            pieces.append(
                display_name,
            )

        if region:

            if (
                region.lower()
                != country.lower()
            ):

                pieces.append(
                    region,
                )

        if (

            country

            and country.lower()

            not in [

                part.lower()

                for part in pieces

            ]

        ):

            pieces.append(
                country,
            )

        return ", ".join(
            pieces,
        )