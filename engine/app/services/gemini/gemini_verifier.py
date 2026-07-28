from engine.app.services.gemini.gemini_service import (
    GeminiService,
)
from engine.app.services.gemini.gemini_vision_service import (
    GeminiVisionService,
)
from engine.app.services.gemini.text_prompt_builder import (
    PromptBuilder,
)
from engine.app.services.gemini.text_response_parser import (
    ResponseParser,
)


class GeminiVerifier:

    def __init__(self):

        self.text_model = GeminiService()

        self.vision_model = GeminiVisionService()

        self.prompt_builder = PromptBuilder()

        self.parser = ResponseParser()

    # ==================================================
    # Decide Whether Gemini Should Run
    # ==================================================

    def should_verify(
        self,
        ranked_places: list,
    ):

        if not ranked_places:
            return False

        if len(ranked_places) == 1:
            return False

        top = ranked_places[0]["score"]

        second = ranked_places[1]["score"]

        if top >= 95:
            return False

        if (top - second) <= 8:
            return True

        if top < 90:
            return True

        return False

    # ==================================================
    # Text Verification
    # ==================================================

    def verify_text(
        self,
        evidence: dict,
        ranked_places: list,
    ):

        prompt = self.prompt_builder.build(

            evidence=evidence,

            ranked_places=ranked_places,

        )

        response = self.text_model.verify_location(
            prompt,
        )

        return self.parser.parse(

            response=response,

            ranked_places=ranked_places,

        )

    # ==================================================
    # Vision Verification
    # ==================================================

    def verify_vision(
        self,
        image_path: str,
        evidence: dict,
        ranked_places: list,
    ):

        candidate_names = [

            item["place"]["travel_name"]

            for item in ranked_places

        ]

        return self.vision_model.verify(

            image_path=image_path,

            evidence=evidence,

            candidates=candidate_names,

        )

    # ==================================================
    # Main Verification
    # ==================================================

    def verify(
        self,
        evidence: dict,
        ranked_places: list,
        image_path: str | None = None,
    ):

        if not ranked_places:

            return None

        print(
            "\n========== GEMINI ==========\n"
        )

        text_result = self.verify_text(

            evidence,

            ranked_places,

        )

        vision_result = None

        if image_path:

            vision_result = self.verify_vision(

                image_path,

                evidence,

                ranked_places,

            )

        winner = text_result.get(
            "winner",
        )

        if winner:

            winner["place"]["gemini_verified"] = True

            winner["place"]["gemini_reason"] = text_result.get(
                "reason",
            )

            if vision_result:

                winner["place"]["vision_confidence"] = vision_result.get(
                    "confidence",
                )

                winner["place"]["vision_reason"] = vision_result.get(
                    "reason",
                )

                winner["place"]["visual_clues"] = vision_result.get(
                    "visual_clues",
                    [],
                )

                winner["place"]["vision_best_match"] = vision_result.get(
                    "best_match",
                )

        print(
            "=================================\n"
        )

        return {

            "winner": winner,

            "confidence": text_result.get(
                "confidence",
            ),

            "reason": text_result.get(
                "reason",
            ),

            "vision": vision_result,

        }