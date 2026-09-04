import copy
import logging
from pathlib import Path

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

logger = logging.getLogger(__name__)


class GeminiVerifier:

    def __init__(self):

        self.text_model = GeminiService()
        self.vision_model = GeminiVisionService()
        self.prompt_builder = PromptBuilder()
        self.parser = ResponseParser()

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

        # If a valid image is supplied, vision verification is valuable
        if image_path and Path(image_path).exists():
            return True

        # Only one candidate available
        if len(ranked_places) == 1:
            top_score = ranked_places[0].get("score", 0)
            # If already extremely confident, no verification needed
            if top_score >= 95:
                return False
            return True

        top_score = ranked_places[0].get("score", 0)
        second_score = ranked_places[1].get("score", 0)
        gap = top_score - second_score

        # Rule engine is decisively confident
        if top_score >= 97 and gap >= 15:
            return False

        # Close call or moderate confidence
        if gap <= 10 or top_score < 92:
            return True

        return True

    # ==================================================
    # Confidence Level Calculator
    # ==================================================

    def calculate_confidence_level(
        self,
        score: float,
        verification_status: str,
        gemini_confidence: float = 0.0,
    ) -> str:

        if verification_status == "VERIFIED" and (score >= 90 or gemini_confidence >= 0.85):
            return "VERIFIED"

        if score >= 90:
            return "VERY_HIGH"
        if score >= 80:
            return "HIGH"
        if score >= 70:
            return "MEDIUM"
        if score >= 60:
            return "LOW"
        return "VERY_LOW"

    # ==================================================
    # Text Verification
    # ==================================================

    def run_text_verification(
        self,
        evidence: dict,
        top_candidates: list,
    ) -> dict:

        try:
            prompt = self.prompt_builder.build(
                evidence=evidence,
                ranked_places=top_candidates,
            )

            logger.info("[GEMINI] Prompt constructed. Requesting Gemini verification...")
            response = self.text_model.verify_location(prompt)

            if not response:
                logger.warning("[GEMINI] Empty response received from text model.")
                return self.parser.empty(
                    reason="Gemini returned an empty response.",
                    status="failed",
                )

            parsed = self.parser.parse(
                response=response,
                ranked_places=top_candidates,
            )
            return parsed

        except Exception as exc:
            logger.error("[GEMINI] Text verification exception: %s", type(exc).__name__)
            return self.parser.empty(
                reason=f"Gemini text verification exception: {type(exc).__name__}",
                status="failed",
            )

    # ==================================================
    # Vision Verification
    # ==================================================

    def run_vision_verification(
        self,
        image_path: str,
        evidence: dict,
        top_candidates: list,
    ) -> dict | None:

        try:
            logger.info("[GEMINI] Running vision verification on frame...")
            response = self.vision_model.verify(
                image_path=image_path,
                evidence=evidence,
                candidates=top_candidates,
            )
            logger.info("[GEMINI] Vision verification complete")
            return response

        except Exception as exc:
            logger.error("[GEMINI] Vision verification error: %s", type(exc).__name__)
            return None

    # ==================================================
    # Decision Matrix: Text + Vision + Scoring
    # ==================================================

    def resolve_decision(
        self,
        top_candidates: list,
        text_result: dict,
        vision_result: dict | None,
    ) -> tuple[dict, str, float, str]:
        """
        Determines the final winner, verification_status, final_confidence, and reason.
        Returns: (winner_item, verification_status, gemini_confidence, gemini_reason)
        """
        scoring_top = top_candidates[0]
        text_status = text_result.get("status", "failed")
        text_winner_idx = text_result.get("winner_index")
        gemini_conf = text_result.get("confidence", 0.0)
        gemini_reason = text_result.get("reason", "")

        # --------------------------------------------------
        # Case 1: Gemini failed or unavailable
        # --------------------------------------------------
        if text_status == "failed" or not self.text_model.available:
            logger.info("[GEMINI] Gemini unavailable or failed. Using scoring fallback.")
            winner = copy.deepcopy(scoring_top)
            return winner, "FAILED", 0.0, "Gemini verification unavailable. Used scoring fallback."

        # --------------------------------------------------
        # Case 2: Gemini returned no winner (insufficient evidence)
        # --------------------------------------------------
        if text_winner_idx is None:
            logger.info("[GEMINI] Gemini found insufficient evidence. Retaining scoring top candidate.")
            winner = copy.deepcopy(scoring_top)
            return winner, "PARTIAL", gemini_conf, gemini_reason or "Insufficient evidence for full verification."

        # --------------------------------------------------
        # Case 3: Gemini agrees with scoring top candidate (index 1)
        # --------------------------------------------------
        if text_winner_idx == 1:
            winner = copy.deepcopy(scoring_top)
            logger.info("[GEMINI] Gemini agrees with scoring candidate #1.")

            # Assess vision alignment
            vision_agrees = False
            if vision_result and vision_result.get("matches_candidate"):
                v_idx = vision_result.get("matched_index")
                if v_idx == 1 or not v_idx:
                    vision_agrees = True

            if gemini_conf >= 0.80:
                verification_status = "VERIFIED"
                score_boost = 5.0
                if vision_agrees:
                    score_boost += 2.0
                winner["score"] = min(100.0, winner.get("score", 0.0) + score_boost)
            elif gemini_conf >= 0.50:
                verification_status = "PARTIAL"
                winner["score"] = min(100.0, winner.get("score", 0.0) + 2.0)
            else:
                verification_status = "PARTIAL"

            return winner, verification_status, gemini_conf, gemini_reason

        # --------------------------------------------------
        # Case 4: Gemini disagrees (selects candidate k > 1)
        # --------------------------------------------------
        gemini_selected = top_candidates[text_winner_idx - 1]
        score_top = scoring_top.get("score", 0.0)
        score_gemini = gemini_selected.get("score", 0.0)
        gap = score_top - score_gemini

        logger.info(
            "[GEMINI] Disagreement: Scoring chose #1 (%s, score=%.1f), Gemini chose #%d (%s, score=%.1f, conf=%.2f)",
            scoring_top["place"].get("travel_name", "Unknown"),
            score_top,
            text_winner_idx,
            gemini_selected["place"].get("travel_name", "Unknown"),
            score_gemini,
            gemini_conf,
        )

        # Vision support check for the Gemini candidate
        vision_supports_gemini = False
        if vision_result and vision_result.get("matches_candidate"):
            if vision_result.get("matched_index") == text_winner_idx:
                vision_supports_gemini = True

        # Switch condition: High Gemini confidence and reasonable score gap
        should_switch = (
            gemini_conf >= 0.80
            and (gap <= 25.0 or score_gemini >= 65.0 or vision_supports_gemini)
        )

        if should_switch:
            logger.info(
                "[GEMINI] Switching to candidate #%d based on strong Gemini verification (conf=%.2f).",
                text_winner_idx,
                gemini_conf,
            )
            winner = copy.deepcopy(gemini_selected)
            boost = min(10.0, round(gemini_conf * 10, 1))
            winner["score"] = min(100.0, winner.get("score", 0.0) + boost)

            status = "VERIFIED" if gemini_conf >= 0.85 else "PARTIAL"
            return winner, status, gemini_conf, gemini_reason
        else:
            logger.info(
                "[GEMINI] Retaining scoring candidate #1 due to large score gap (%.1f) or moderate confidence (%.2f).",
                gap,
                gemini_conf,
            )
            winner = copy.deepcopy(scoring_top)
            # Slight penalty on agreement confidence due to disagreement
            status = "PARTIAL"
            return winner, status, gemini_conf, f"Gemini suggested alternative #{text_winner_idx} but scoring #1 retained. Reason: {gemini_reason}"

    # ==================================================
    # Attach Verified Metadata to Winner Place
    # ==================================================

    def attach_verified_metadata(
        self,
        winner: dict,
        verification_status: str,
        gemini_confidence: float,
        gemini_reason: str,
        vision_result: dict | None,
    ) -> dict:

        place = winner["place"]

        # Preserve all original Google Place and scoring metadata
        place["verification_status"] = verification_status
        place["gemini_verified"] = (verification_status == "VERIFIED")
        place["gemini_confidence"] = gemini_confidence
        place["gemini_reason"] = gemini_reason

        # Attach Vision details if available
        if vision_result:
            place["vision"] = vision_result
            place["visual_clues"] = vision_result.get("visual_clues", [])
            place["detected_landmarks"] = vision_result.get("detected_landmarks", [])
            place["detected_country"] = vision_result.get("detected_country", "")
            place["detected_region"] = vision_result.get("detected_region", "")
            place["vision_confidence"] = vision_result.get("confidence", 0.0)
            place["vision_reason"] = vision_result.get("reason", "")
        else:
            place.setdefault("vision", None)
            place.setdefault("visual_clues", [])
            place.setdefault("detected_landmarks", [])

        # Update final confidence level
        final_confidence_str = self.calculate_confidence_level(
            score=winner.get("score", 0.0),
            verification_status=verification_status,
            gemini_confidence=gemini_confidence,
        )
        winner["confidence"] = final_confidence_str
        place["confidence"] = final_confidence_str

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
                "confidence": 0.0,
                "reason": "No ranked places available.",
                "verification_status": "FAILED",
                "vision": None,
            }

        logger.info("[GEMINI] Starting verification")

        # ------------------------------------------
        # STEP 5: Top 5 Candidates Selection
        # ------------------------------------------
        top_candidates = ranked_places[:5]
        logger.info("[GEMINI] Candidates received: %d", len(top_candidates))

        # ------------------------------------------
        # Optimization Check: Skip if already certain
        # ------------------------------------------
        if not self.should_verify(top_candidates, image_path):
            logger.info("[GEMINI] Skipping verification (confidence already high)")
            winner = copy.deepcopy(top_candidates[0])
            winner["place"]["verification_status"] = "SKIPPED"
            winner["place"]["gemini_verified"] = False
            winner["place"]["gemini_reason"] = "Scoring confidence already high."
            winner["place"]["gemini_confidence"] = None

            final_conf = self.calculate_confidence_level(
                score=winner.get("score", 0.0),
                verification_status="SKIPPED",
            )
            winner["confidence"] = final_conf
            winner["place"]["confidence"] = final_conf

            print(f"[LOCATION] Final destination: {winner['place'].get('travel_name', 'Unknown')}")
            print("[LOCATION] Verification status: SKIPPED")

            return {
                "winner": winner,
                "confidence": winner.get("score", 0.0),
                "reason": "Scoring confidence already high.",
                "verification_status": "SKIPPED",
                "vision": None,
            }

        # ------------------------------------------
        # Text Verification
        # ------------------------------------------
        text_result = self.run_text_verification(
            evidence=evidence,
            top_candidates=top_candidates,
        )
        logger.info("[GEMINI] Text verification complete")

        # ------------------------------------------
        # Vision Verification (if frame available)
        # ------------------------------------------
        vision_result = None
        if image_path and Path(image_path).exists():
            vision_result = self.run_vision_verification(
                image_path=image_path,
                evidence=evidence,
                top_candidates=top_candidates,
            )
        else:
            logger.info("[GEMINI] Vision verification: skipped (no frame available)")

        # ------------------------------------------
        # Deterministic Decision Logic (Text + Vision + Scoring)
        # ------------------------------------------
        winner, status, gemini_conf, gemini_reason = self.resolve_decision(
            top_candidates=top_candidates,
            text_result=text_result,
            vision_result=vision_result,
        )

        winner = self.attach_verified_metadata(
            winner=winner,
            verification_status=status,
            gemini_confidence=gemini_conf,
            gemini_reason=gemini_reason,
            vision_result=vision_result,
        )

        winner_name = (
            winner["place"].get("travel_name")
            or winner["place"].get("display_name")
            or "Unknown"
        )

        logger.info("[GEMINI] Winner: %s", winner_name)
        logger.info("[GEMINI] Confidence: %.2f", gemini_conf)
        print(f"[LOCATION] Final destination: {winner_name}")
        print(f"[LOCATION] Verification status: {status}")

        return {
            "winner": winner,
            "confidence": gemini_conf,
            "reason": gemini_reason,
            "verification_status": status,
            "vision": vision_result,
        }

