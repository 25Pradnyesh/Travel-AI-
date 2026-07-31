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
        image_path: str | None = None,
    ):

        if not ranked_places:
            return False

        if image_path:
            return True

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

    def run_text_verification(
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

    def run_vision_verification(
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

        # ------------------------------------------
        # Text Verification
        # ------------------------------------------

        text_result = self.run_text_verification(

            evidence,

            ranked_places,

        )

        winner = text_result.get(
            "winner",
        )

        if not winner:

            return None

        # ------------------------------------------
        # Vision Verification
        # ------------------------------------------

        vision_result = None

        if image_path:

            vision_result = self.run_vision_verification(

                image_path,

                evidence,

                ranked_places,

            )

        # ------------------------------------------
        # Merge Vision + Text
        # ------------------------------------------

        if vision_result:

            text_name = winner["place"].get(
                "travel_name",
                "",
            ).lower()

            vision_name = vision_result.get(
                "best_match",
                "",
            ).lower()

            agrees = (

                vision_name != ""

                and

                (
                    vision_name in text_name
                    or
                    text_name in vision_name
                )

            )

            winner["place"]["vision_agrees"] = agrees

            if agrees:

                winner["score"] += 5

            else:

                winner["score"] = max(
                    winner["score"] - 5,
                    0,
                )

        # ------------------------------------------
        # Store Metadata
        # ------------------------------------------

        winner["place"]["gemini_verified"] = True

        winner["place"]["gemini_reason"] = text_result.get(
            "reason",
            "",
        )

        winner["place"]["text_confidence"] = text_result.get(
            "confidence",
            0,
        )

        winner["place"]["verification_status"] = (

            "verified"

            if text_result.get(
                "confidence",
                0,
            ) >= 85

            else "estimated"

        )

        winner["place"]["vision"] = vision_result

        if vision_result:

            winner["place"]["vision_confidence"] = vision_result.get(
                "confidence",
                0,
            )

            winner["place"]["vision_reason"] = vision_result.get(
                "reason",
                "",
            )

            winner["place"]["vision_best_match"] = vision_result.get(
                "best_match",
                "",
            )

            winner["place"]["visual_clues"] = vision_result.get(
                "visual_clues",
                [],
            )

            winner["place"]["detected_landmarks"] = vision_result.get(
                "detected_landmarks",
                [],
            )

            winner["place"]["detected_country"] = vision_result.get(
                "detected_country",
                "",
            )

            winner["place"]["detected_region"] = vision_result.get(
                "detected_region",
                "",
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