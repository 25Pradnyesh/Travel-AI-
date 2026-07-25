from engine.app.services.gemini.gemini_service import (
    GeminiService,
)
from engine.app.services.gemini.prompt_builder import (
    PromptBuilder,
)
from engine.app.services.gemini.response_parser import (
    ResponseParser,
)


class GeminiVerifier:

    def __init__(self):

        self.gemini = GeminiService()

        self.prompt_builder = PromptBuilder()

        self.parser = ResponseParser()

    # ==================================================
    # Verify Rule Engine Results
    # ==================================================

    def verify(
        self,
        evidence: dict,
        ranked_places: list,
    ):

        if not ranked_places:

            return None

        print(
            "\n========== GEMINI VERIFICATION ==========\n"
        )

        # ------------------------------------------
        # Build Prompt
        # ------------------------------------------

        prompt = self.prompt_builder.build(

            evidence=evidence,

            ranked_places=ranked_places,

        )

        # ------------------------------------------
        # Gemini
        # ------------------------------------------

        response = self.gemini.verify_location(
            prompt,
        )

        # ------------------------------------------
        # Parse
        # ------------------------------------------

        parsed = self.parser.parse(

            response=response,

            ranked_places=ranked_places,

        )

        winner = parsed.get(
            "winner",
        )

        if winner:

            place = winner["place"]

            print(
                f"✅ Gemini Selected : {place['travel_name']}"
            )

            print(
                f"🎯 Confidence : {parsed['confidence']}"
            )

            print(
                f"💡 Reason : {parsed['reason']}"
            )

        else:

            print(
                "⚠️ Gemini returned no valid winner."
            )

        print(
            "\n=========================================\n"
        )

        return parsed

    # ==================================================
    # Decide if Gemini should run
    # ==================================================

    def should_verify(
        self,
        ranked_places: list,
    ):

        if not ranked_places:

            return False

        # Already extremely confident
        if ranked_places[0]["score"] >= 95:

            return False

        # Only one candidate
        if len(ranked_places) == 1:

            return False

        top_score = ranked_places[0]["score"]

        second_score = ranked_places[1]["score"]

        difference = top_score - second_score

        # Very close candidates
        if difference <= 8:

            return True

        # Rule engine not confident
        if top_score < 90:

            return True

        return False