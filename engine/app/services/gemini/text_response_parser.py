import json
import logging
import re


logger = logging.getLogger(__name__)


class ResponseParser:

    # ==================================================
    # Parse Gemini Response
    # ==================================================

    def parse(
        self,
        response: dict | str | None,
        ranked_places: list,
    ) -> dict:

        if not ranked_places:
            return self.empty(
                reason="No candidate places provided for verification.",
                status="failed",
            )

        if not response:
            return self.empty(
                reason="Gemini returned an empty response.",
                status="failed",
            )

        # ------------------------------------------
        # If string, clean and extract JSON
        # ------------------------------------------
        data = None

        if isinstance(response, str):
            raw_text = response.strip()

            # 1. Remove markdown fences (```json ... ``` or ``` ... ```)
            fence_match = re.search(
                r"```(?:json)?\s*([\s\S]*?)\s*```",
                raw_text,
                re.IGNORECASE,
            )
            if fence_match:
                candidate_json = fence_match.group(1).strip()
            else:
                candidate_json = raw_text

            # 2. Try direct json load
            try:
                data = json.loads(candidate_json)
            except json.JSONDecodeError:
                # 3. Fallback: search for first balanced {...}
                bracket_match = re.search(r"\{[\s\S]*\}", candidate_json)
                if bracket_match:
                    try:
                        data = json.loads(bracket_match.group(0))
                    except json.JSONDecodeError:
                        data = None

            if not isinstance(data, dict):
                logger.warning(
                    "[GEMINI] Failed to decode JSON from text response: %s",
                    raw_text[:200],
                )
                return self.empty(
                    reason="Gemini returned malformed JSON.",
                    status="failed",
                )
        elif isinstance(response, dict):
            data = response
        else:
            return self.empty(
                reason=f"Unexpected response type: {type(response).__name__}",
                status="failed",
            )

        # ------------------------------------------
        # Winner Index Validation
        # ------------------------------------------
        raw_winner = data.get("winner")
        if raw_winner is None:
            # Check legacy keys just in case
            raw_winner = data.get("selected_rank")

        winner_index = None

        if raw_winner is not None:
            try:
                winner_index = int(raw_winner)
            except (ValueError, TypeError):
                logger.warning(
                    "[GEMINI] Invalid winner index type: %r",
                    raw_winner,
                )
                winner_index = None

        # Validate range: 1-indexed against ranked_places
        if winner_index is not None:
            if winner_index < 1 or winner_index > len(ranked_places):
                logger.warning(
                    "[GEMINI] Winner index %d out of range (1..%d)",
                    winner_index,
                    len(ranked_places),
                )
                return self.empty(
                    reason=f"Winner index {winner_index} out of candidate range (1..{len(ranked_places)}).",
                    status="failed",
                )

        # ------------------------------------------
        # Confidence Normalization (0.0 to 1.0)
        # ------------------------------------------
        raw_conf = data.get("confidence", 0.0)
        confidence = self.normalize_confidence(raw_conf)

        # ------------------------------------------
        # Reason Validation
        # ------------------------------------------
        reason = str(data.get("reason") or "").strip()
        if not reason:
            if winner_index is not None:
                reason = f"Candidate {winner_index} selected as best explanation of evidence."
            else:
                reason = "Insufficient evidence to verify any candidate."

        # ------------------------------------------
        # Construct Parsed Result
        # ------------------------------------------
        if winner_index is None:
            return {
                "winner": None,
                "winner_index": None,
                "confidence": confidence,
                "reason": reason,
                "status": "no_winner",
            }

        winner_candidate = ranked_places[winner_index - 1]

        return {
            "winner": winner_candidate,
            "winner_index": winner_index,
            "confidence": confidence,
            "reason": reason,
            "status": "verified",
        }

    # ==================================================
    # Normalize Confidence to 0.0 - 1.0
    # ==================================================

    def normalize_confidence(
        self,
        value: any,
    ) -> float:

        try:
            val = float(value)
        except (ValueError, TypeError):
            return 0.0

        # If model returned percentage 1.0 < val <= 100.0, convert to 0..1
        if 1.0 < val <= 100.0:
            val = val / 100.0

        # Clamp strictly between 0.0 and 1.0
        val = max(0.0, min(1.0, val))

        return round(val, 4)

    # ==================================================
    # Empty / Fallback Response
    # ==================================================

    def empty(
        self,
        reason: str = "Verification failed.",
        status: str = "failed",
    ) -> dict:

        return {
            "winner": None,
            "winner_index": None,
            "confidence": 0.0,
            "reason": reason,
            "status": status,
        }