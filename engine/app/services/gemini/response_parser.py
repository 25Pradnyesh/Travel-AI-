class ResponseParser:

    # ==================================================
    # Parse Gemini Response
    # ==================================================

    def parse(
        self,
        response: dict,
        ranked_places: list,
    ):

        # ------------------------------------------
        # Invalid response
        # ------------------------------------------

        if not response:

            return self.fallback(
                ranked_places,
                reason="Gemini returned no response.",
            )

        # ------------------------------------------
        # Validate selected_rank
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
                reason="Invalid selected_rank.",
            )

        if (
            selected_rank < 1
            or
            selected_rank > len(ranked_places)
        ):

            return self.fallback(
                ranked_places,
                reason="selected_rank out of range.",
            )

        selected = ranked_places[
            selected_rank - 1
        ]

        # ------------------------------------------
        # Confidence
        # ------------------------------------------

        confidence = response.get(
            "confidence",
            0.5,
        )

        try:

            confidence = float(
                confidence
            )

        except Exception:

            confidence = 0.5

        confidence = max(
            0.0,
            min(
                confidence,
                1.0,
            ),
        )

        # ------------------------------------------
        # Reason
        # ------------------------------------------

        reason = response.get(
            "reason",
            "",
        )

        if not isinstance(
            reason,
            str,
        ):

            reason = ""

        # ------------------------------------------
        # Final Parsed Output
        # ------------------------------------------

        return {

            "gemini_verified": True,

            "selected_rank": selected_rank,

            "confidence": confidence,

            "reason": reason,

            "winner": selected,

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

                "confidence": 0.0,

                "reason": reason,

                "winner": None,

            }

        return {

            "gemini_verified": False,

            "selected_rank": 1,

            "confidence": 0.0,

            "reason": reason,

            "winner": ranked_places[0],

        }