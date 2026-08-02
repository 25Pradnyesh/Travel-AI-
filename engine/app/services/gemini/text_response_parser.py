class ResponseParser:

    # ==================================================
    # Parse Gemini Response
    # ==================================================

    def parse(
        self,
        response: dict,
        ranked_places: list,
    ):

        if not response:

            return self.fallback(

                ranked_places,

                "Gemini returned no response.",

            )

        # ------------------------------------------
        # Selected Rank
        # ------------------------------------------

        selected_rank = response.get(
            "selected_rank",
        )

        if not isinstance(
            selected_rank,
            int,
        ):

            return self.fallback(

                ranked_places,

                "Invalid selected_rank.",

            )

        if (

            selected_rank < 1

            or

            selected_rank > len(
                ranked_places,
            )

        ):

            return self.fallback(

                ranked_places,

                "selected_rank out of range.",

            )

        winner = ranked_places[
            selected_rank - 1
        ]

        # ------------------------------------------
        # Confidence
        # ------------------------------------------

        confidence = response.get(
            "confidence",
            0,
        )

        try:

            confidence = int(
                confidence,
            )

        except Exception:

            confidence = 0

        confidence = max(
            0,
            min(
                confidence,
                100,
            ),
        )

        # ------------------------------------------
        # Reason
        # ------------------------------------------

        reason = str(

            response.get(
                "reason",
                "",
            )

        ).strip()

        # ------------------------------------------
        # Matched Sources
        # ------------------------------------------

        matched_sources = response.get(
            "matched_sources",
            [],
        )

        if not isinstance(
            matched_sources,
            list,
        ):

            matched_sources = []

        matched_sources = [

            str(source).strip().lower()

            for source in matched_sources

            if str(source).strip()

        ]

        # ------------------------------------------
        # Attach Metadata
        # ------------------------------------------

        winner["place"]["gemini_confidence"] = confidence

        winner["place"]["gemini_reason"] = reason

        winner["place"]["matched_sources"] = matched_sources

        winner["place"]["gemini_verified"] = (

            confidence >= 80

        )

        # Small confidence bonus

        if confidence >= 90:

            winner["score"] += 5

        elif confidence >= 80:

            winner["score"] += 3

        elif confidence < 50:

            winner["score"] -= 5

        return {

            "gemini_verified": True,

            "selected_rank": selected_rank,

            "confidence": confidence,

            "reason": reason,

            "matched_sources": matched_sources,

            "winner": winner,

        }

    # ==================================================
    # Fallback
    # ==================================================

    def fallback(
        self,
        ranked_places,
        reason: str,
    ):

        if not ranked_places:

            return {

                "gemini_verified": False,

                "selected_rank": None,

                "confidence": 0,

                "reason": reason,

                "matched_sources": [],

                "winner": None,

            }

        winner = ranked_places[0]

        winner["place"]["gemini_verified"] = False

        winner["place"]["gemini_reason"] = reason

        winner["place"]["gemini_confidence"] = 0

        winner["place"]["matched_sources"] = []

        return {

            "gemini_verified": False,

            "selected_rank": 1,

            "confidence": 0,

            "reason": reason,

            "matched_sources": [],

            "winner": winner,

        }