import logging

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

        logging.basicConfig(

            level=logging.INFO,

            format="%(message)s",

        )

    # ==================================================
    # Should Gemini Run?
    # ==================================================

    def should_verify(

        self,

        ranked_places: list,

        image_path: str | None = None,

    ) -> bool:

        if not ranked_places:

            return False

        if image_path:

            return True

        if len(ranked_places) == 1:

            return False

        top = ranked_places[0]["score"]

        second = ranked_places[1]["score"]

        gap = top - second

        if top >= 97:

            return False

        if gap <= 10:

            return True

        if top < 92:

            return True

        return False

    # ==================================================
    # Score Fusion
    # ==================================================

    def merge_scores(

        self,

        current_score: float,

        agrees: bool,

    ) -> float:

        if agrees:

            return min(

                current_score + 5,

                100,

            )

        return max(

            current_score - 5,

            0,

        )


    # ==================================================
    # Text Verification
    # ==================================================

    def run_text_verification(

        self,

        evidence: dict,

        ranked_places: list,

    ) -> dict | None:

        try:

            prompt = self.prompt_builder.build(

                evidence=evidence,

                ranked_places=ranked_places,

            )

            logging.info(

                "\n========== GEMINI TEXT ==========\n"

            )

            response = self.text_model.verify_location(

                prompt,

            )

            if not response:

                logging.warning(

                    "Gemini returned an empty response."

                )

                return None

            parsed = self.parser.parse(

                response=response,

                ranked_places=ranked_places,

            )

            if not parsed:

                logging.warning(

                    "Failed to parse Gemini response."

                )

                return None

            winner = parsed.get(

                "winner",

            )

            if winner is None:

                logging.warning(

                    "Gemini did not select a winner."

                )

                return None

            parsed.setdefault(

                "confidence",

                80,

            )

            parsed.setdefault(

                "reason",

                "Gemini selected the highest-confidence location.",

            )

            return parsed

        except Exception as exc:

            logging.exception(

                "Gemini text verification failed: %s",

                exc,

            )

            return None

    # ==================================================
    # Fallback Winner
    # ==================================================

    def fallback_result(

        self,

        ranked_places: list,

    ) -> dict:

        winner = ranked_places[0]

        winner["place"]["gemini_verified"] = False

        winner["place"]["verification_status"] = "fallback"

        winner["place"]["gemini_reason"] = (

            "Gemini verification unavailable. "

            "Using highest scoring candidate."

        )

        return {

            "winner": winner,

            "confidence": winner.get(

                "score",

                0,

            ),

            "reason": winner["place"][

                "gemini_reason"

            ],

            "vision": None,

        }

    # ==================================================
    # Vision Verification
    # ==================================================

    def run_vision_verification(

        self,

        image_path: str,

        evidence: dict,

        ranked_places: list,

    ) -> dict | None:

        try:

            candidate_names = [

                item["place"].get(

                    "travel_name",

                    item["place"].get(

                        "display_name",

                        "",

                    ),

                )

                for item in ranked_places

            ]

            logging.info(

                "\n========== GEMINI VISION ==========\n"

            )

            response = self.vision_model.verify(

                image_path=image_path,

                evidence=evidence,

                candidates=candidate_names,

            )

            if not response:

                logging.warning(

                    "Gemini Vision returned no response."

                )

                return None

            return response

        except Exception as exc:

            logging.exception(

                "Gemini Vision failed: %s",

                exc,

            )

            return None

    # ==================================================
    # Merge Text + Vision
    # ==================================================

    def merge_verification(

        self,

        winner: dict,

        text_result: dict,

        vision_result: dict | None,

    ) -> dict:

        place = winner["place"]

        place["gemini_verified"] = True

        place["verification_status"] = "verified"

        place["gemini_reason"] = text_result.get(

            "reason",

            "",

        )

        place["text_confidence"] = text_result.get(

            "confidence",

            0,

        )

        if not vision_result:

            place["vision"] = None

            return winner

        vision_match = str(

            vision_result.get(

                "best_match",

                "",

            )

        ).lower()

        travel_name = str(

            place.get(

                "travel_name",

                "",

            )

        ).lower()

        agrees = (

            vision_match != ""

            and

            (

                vision_match in travel_name

                or

                travel_name in vision_match

            )

        )

        place["vision"] = vision_result

        place["vision_agrees"] = agrees

        place["vision_confidence"] = vision_result.get(

            "confidence",

            0,

        )

        place["vision_reason"] = vision_result.get(

            "reason",

            "",

        )

        place["visual_clues"] = vision_result.get(

            "visual_clues",

            [],

        )

        place["detected_landmarks"] = vision_result.get(

            "detected_landmarks",

            [],

        )

        place["detected_country"] = vision_result.get(

            "detected_country",

            "",

        )

        place["detected_region"] = vision_result.get(

            "detected_region",

            "",

        )

        place["vision_best_match"] = vision_match

        winner["score"] = self.merge_scores(

            winner["score"],

            agrees,

        )

        return winner

    # ==================================================
    # Main Verification Pipeline
    # ==================================================

    def verify(

        self,

        evidence: dict,

        ranked_places: list,

        image_path: str | None = None,

    ) -> dict:

        if not ranked_places:

            return {

                "winner": None,

                "confidence": 0,

                "reason": "No ranked places available.",

                "vision": None,

            }

        logging.info(

            "\n========== GEMINI VERIFIER ==========\n"

        )

        # ------------------------------------------
        # Skip Verification if Confidence is High
        # ------------------------------------------

        if not self.should_verify(

            ranked_places,

            image_path,

        ):

            logging.info(

                "Skipping Gemini verification."

            )

            winner = ranked_places[0]

            winner["place"]["gemini_verified"] = False

            winner["place"]["verification_status"] = "skipped"

            winner["place"]["gemini_reason"] = (

                "Scoring confidence already high."

            )

            return {

                "winner": winner,

                "confidence": winner.get(

                    "score",

                    0,

                ),

                "reason": winner["place"][

                    "gemini_reason"

                ],

                "vision": None,

            }

        # ------------------------------------------
        # Text Verification
        # ------------------------------------------

        text_result = self.run_text_verification(

            evidence,

            ranked_places,

        )

        if not text_result:

            logging.warning(

                "Using fallback winner."

            )

            return self.fallback_result(

                ranked_places,

            )

        winner = text_result["winner"]

        # ------------------------------------------
        # Vision Verification (Optional)
        # ------------------------------------------

        vision_result = None

        if image_path:

            vision_result = self.run_vision_verification(

                image_path,

                evidence,

                ranked_places,

            )

        # ------------------------------------------
        # Merge Results
        # ------------------------------------------

        winner = self.merge_verification(

            winner,

            text_result,

            vision_result,

        )

        logging.info(

            "Gemini Winner : %s",

            winner["place"].get(

                "travel_name",

                winner["place"].get(

                    "display_name",

                    "Unknown",

                ),

            ),

        )

        logging.info(

            "Confidence   : %.1f",

            winner["score"],

        )

        logging.info(

            "\n=====================================\n"

        )

        return {

            "winner": winner,

            "confidence": text_result.get(

                "confidence",

                winner["score"],

            ),

            "reason": text_result.get(

                "reason",

                "",

            ),

            "vision": vision_result,

        }

