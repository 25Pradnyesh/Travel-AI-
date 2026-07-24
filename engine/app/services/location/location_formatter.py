class LocationFormatter:

    def format(
        self,
        query: str,
        place: dict,
    ):

        display_name = (
            place.get("display_name", "")
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
            query
        )

        travel_name = self.build_travel_name(
            city=query_components["city"],
            region=query_components["region"],
            display_name=display_name,
            country=country,
        )

        return {
            "id": place.get("id"),

            # Google
            "name": display_name,

            # User / AI verified query
            "verified_query": query,

            # Structured travel object
            "city": query_components["city"],
            "region": query_components["region"],
            "state": state,
            "country": country,

            # Frontend display
            "travel_name": travel_name,

            # Google metadata
            "address": address,
            "latitude": place.get("latitude"),
            "longitude": place.get("longitude"),
            "google_maps_url": place.get(
                "google_maps_url"
            ),
        }

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

            region = ", ".join(parts[1:])

            return {
                "city": city,
                "region": region,
            }

        return {
            "city": query,
            "region": "",
        }

    def build_travel_name(
        self,
        city: str,
        region: str,
        display_name: str,
        country: str,
    ) -> str:

        pieces = []

        if city:
            pieces.append(city)

        elif display_name:
            pieces.append(display_name)

        if region:

            if region.lower() != country.lower():
                pieces.append(region)

        if (
            country
            and country.lower()
            not in [
                piece.lower()
                for piece in pieces
            ]
        ):
            pieces.append(country)

        return ", ".join(pieces)