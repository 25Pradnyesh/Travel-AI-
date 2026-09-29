"""
Travel AI Benchmark Evaluator.

Provides deterministic evaluation of backend /analyze pipeline results against
dataset expectations. Scored test cases are strictly evaluated without LLM judges
or manufactured passes. Untested/unspecified cases are tracked separately and excluded
from accuracy calculations.
"""

from __future__ import annotations

import math
import re
import unicodedata
from typing import Any


def normalize_text(text: str | None) -> str:
    """
    Normalizes text for comparison:
    - Lowercase
    - Unicode decomposition (NFKD)
    - Replaces smart quotes, apostrophes, and dashes
    - Removes punctuation and symbols (including emojis)
    - Collapses whitespace
    """
    if not text:
        return ""

    text = str(text).lower()
    text = unicodedata.normalize("NFKD", text)

    # Replace typographical characters
    text = (
        text.replace("’", "'")
        .replace("‘", "'")
        .replace("“", '"')
        .replace("”", '"')
        .replace("`", "'")
        .replace("–", "-")
        .replace("—", "-")
        .replace("−", "-")
    )

    # Remove emojis and non-alphanumeric punctuation, keeping letters, numbers, hyphens, and whitespace
    text = re.sub(r"[^\w\s-]", " ", text)
    # Collapse multiple whitespaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def is_negative_expectation(expected: Any) -> bool:
    """
    Checks if an expected value explicitly specifies no location found.
    """
    if not isinstance(expected, str):
        return False
    norm = normalize_text(expected)
    return norm in (
        "location not found",
        "no location",
        "not found",
        "none",
    )


def extract_expected_clauses(expected_str: str) -> list[str]:
    """
    Splits an expected location string into significant clauses (e.g. by comma, slash, parentheses).
    Example: "Varenna, Lake Como" -> ["varenna", "lake como"]
    Example: "Chennai , India" -> ["chennai", "india"]
    """
    # Split on commas, slashes, or parentheses
    raw_clauses = re.split(r"[,/()]", expected_str)
    clauses: list[str] = []
    for c in raw_clauses:
        norm = normalize_text(c)
        if norm and len(norm) > 1:
            clauses.append(norm)
    return clauses


def match_single_target(expected_item: str, detected_dict: dict[str, Any]) -> tuple[bool, str, str]:
    """
    Deterministic comparison of a single expected string against detected output.
    Returns: (is_match, match_type, reason)
    match_type can be "exact", "sufficient", or "none".
    """
    detected_name = detected_dict.get("name") or ""
    detected_addr = detected_dict.get("formatted_address") or ""
    detected_city = detected_dict.get("city") or ""
    detected_region = detected_dict.get("region") or ""
    detected_country = detected_dict.get("country") or ""

    full_detected = f"{detected_name} {detected_addr} {detected_city} {detected_region} {detected_country}"
    norm_expected = normalize_text(expected_item)
    norm_name = normalize_text(detected_name)
    norm_full = normalize_text(full_detected)

    if not norm_expected:
        return False, "none", "Empty expected target"

    if not norm_full:
        return False, "none", "No detected destination output from pipeline"

    # 1. Exact match on name or full string
    if norm_expected == norm_name or norm_expected == norm_full:
        return True, "exact", f"Exact match with '{detected_name}'"

    # 2. Extract clauses from expected item
    clauses = extract_expected_clauses(expected_item)
    if not clauses:
        clauses = [norm_expected]

    primary = clauses[0]

    # Special handling for common multi-word locations (e.g. "Lake Como" / "Monument Valley")
    # Primary clause must appear in the detected output
    primary_in_full = primary in norm_full
    primary_in_name = primary in norm_name

    # If primary clause is not found, check if it's an alternative or if all significant words match
    if not primary_in_full:
        # Check alternative clauses if present (e.g. St. Philomena in St. Joseph's Cathedral)
        found_alt = False
        for alt in clauses[1:]:
            if len(alt) > 2 and alt in norm_full:
                found_alt = True
                primary = alt
                primary_in_full = True
                break

    if not primary_in_full:
        # Check if individual non-stop words of primary are present
        primary_tokens = [w for w in primary.split() if len(w) > 2 and w not in ("the", "and", "national", "park")]
        if primary_tokens and all(token in norm_full for token in primary_tokens):
            primary_in_full = True

    if not primary_in_full:
        return False, "none", f"Primary expected location '{primary}' not found in detected result ('{detected_name}')"

    # If primary matched, verify secondary clauses (e.g. country or state if specified)
    # If secondary clauses are present, at least one secondary must also match or primary must be in name
    if len(clauses) > 1:
        secondary_clauses = clauses[1:]
        matched_secondary = [sc for sc in secondary_clauses if sc in norm_full]
        if matched_secondary or primary_in_name:
            return True, "sufficient", f"Sufficient match: '{primary}' in detected output ('{detected_name}')"
        return False, "none", f"Found '{primary}', but secondary region ({secondary_clauses}) did not match"

    return True, "sufficient", f"Sufficient match: '{primary}' in detected output ('{detected_name}')"


class BenchmarkEvaluator:
    """
    Evaluator for Travel AI benchmark cases.
    """

    def evaluate_case(
        self,
        case: dict[str, Any],
        raw_response: dict[str, Any] | None,
        http_status: int | None,
        duration_seconds: float,
        error_message: str | None = None,
    ) -> dict[str, Any]:
        """
        Evaluates a single benchmark case.
        """
        case_id = case.get("id")
        url = case.get("url", "")
        expected = case.get("expected")
        evidence = case.get("evidence", [])
        is_multi = bool(case.get("multi_location", False))
        notes = case.get("notes", "")

        is_scored = expected is not None

        # Build detected representation
        detected: dict[str, Any] | None = None
        pipeline_info: dict[str, Any] | None = None

        if raw_response and isinstance(raw_response, dict):
            best_guess = raw_response.get("best_guess")
            if isinstance(best_guess, dict):
                detected = {
                    "name": best_guess.get("name", ""),
                    "formatted_address": best_guess.get("formatted_address", ""),
                    "country": best_guess.get("country"),
                    "city": best_guess.get("city"),
                    "region": best_guess.get("region"),
                    "latitude": best_guess.get("latitude"),
                    "longitude": best_guess.get("longitude"),
                    "confidence": best_guess.get("confidence"),
                    "confidence_level": best_guess.get("confidence_level"),
                    "verification_status": best_guess.get("verification_status"),
                }

            pipeline_info = {
                "success": raw_response.get("success", False),
                "stage": raw_response.get("stage"),
                "performance": raw_response.get("performance"),
                "error": raw_response.get("error"),
            }

        # Case 1: Untested / Unspecified
        if not is_scored:
            detected_display = (detected.get("name") or "None") if detected else "None"
            return {
                "id": case_id,
                "url": url,
                "expected": None,
                "expected_display": "unspecified",
                "evidence": evidence,
                "multi_location": is_multi,
                "notes": notes,
                "scored": False,
                "status": "untested",
                "match_type": "untested",
                "match_details": "Case has no expected value specified.",
                "duration_seconds": round(duration_seconds, 2),
                "http_status": http_status,
                "detected": detected,
                "detected_display": detected_display,
                "pipeline": pipeline_info,
                "error": error_message,
            }

        # Case 2: Scored case with HTTP error or exception
        if error_message or (http_status is not None and http_status >= 400):
            err_str = error_message or f"HTTP {http_status}"
            return {
                "id": case_id,
                "url": url,
                "expected": expected,
                "expected_display": self._format_expected_display(expected),
                "evidence": evidence,
                "multi_location": is_multi,
                "notes": notes,
                "scored": True,
                "status": "error",
                "match_type": "error",
                "match_details": f"Pipeline execution failed: {err_str}",
                "duration_seconds": round(duration_seconds, 2),
                "http_status": http_status,
                "detected": None,
                "detected_display": "None (error)",
                "pipeline": pipeline_info,
                "error": err_str,
            }

        detected_name = (detected.get("name") if detected else "") or ""
        detected_display = detected_name if detected_name else "None"

        # Case 3: Explicit negative test case (e.g. Expected: "Location Not Found")
        if is_negative_expectation(expected):
            has_location = bool(detected and detected.get("name"))
            is_pipeline_success = bool(pipeline_info and pipeline_info.get("success"))

            if not has_location or not is_pipeline_success:
                status = "passed"
                match_type = "exact"
                match_details = "Correctly produced no resolved destination (Location Not Found)."
            else:
                status = "failed"
                match_type = "none"
                match_details = f"Expected 'Location Not Found', but detected '{detected_name}'."

            return {
                "id": case_id,
                "url": url,
                "expected": expected,
                "expected_display": self._format_expected_display(expected),
                "evidence": evidence,
                "multi_location": is_multi,
                "notes": notes,
                "scored": True,
                "status": status,
                "match_type": match_type,
                "match_details": match_details,
                "duration_seconds": round(duration_seconds, 2),
                "http_status": http_status,
                "detected": detected,
                "detected_display": detected_display,
                "pipeline": pipeline_info,
                "error": None,
            }

        # Case 4: Positive test case with no detected destination
        if not detected or not detected_name:
            pipeline_err = (pipeline_info or {}).get("error") or "No destination resolved"
            return {
                "id": case_id,
                "url": url,
                "expected": expected,
                "expected_display": self._format_expected_display(expected),
                "evidence": evidence,
                "multi_location": is_multi,
                "notes": notes,
                "scored": True,
                "status": "failed",
                "match_type": "none",
                "match_details": f"Destination missing: {pipeline_err}",
                "duration_seconds": round(duration_seconds, 2),
                "http_status": http_status,
                "detected": None,
                "detected_display": "None",
                "pipeline": pipeline_info,
                "error": pipeline_err,
            }

        # Case 5: Multi-location expectation list
        if isinstance(expected, list):
            matched_items: list[str] = []
            for item in expected:
                matched, _, _ = match_single_target(str(item), detected)
                if matched:
                    matched_items.append(str(item))

            if matched_items:
                status = "passed"
                match_type = "sufficient"
                match_details = (
                    f"Matched {len(matched_items)} of {len(expected)} expected locations: "
                    f"{', '.join(matched_items[:3])}"
                )
            else:
                status = "failed"
                match_type = "none"
                match_details = f"Detected '{detected_name}' did not match any of the {len(expected)} expected locations."

            return {
                "id": case_id,
                "url": url,
                "expected": expected,
                "expected_display": self._format_expected_display(expected),
                "evidence": evidence,
                "multi_location": is_multi,
                "matched_locations": matched_items,
                "notes": notes,
                "scored": True,
                "status": status,
                "match_type": match_type,
                "match_details": match_details,
                "duration_seconds": round(duration_seconds, 2),
                "http_status": http_status,
                "detected": detected,
                "detected_display": detected_display,
                "pipeline": pipeline_info,
                "error": None,
            }

        # Case 6: Single-location positive expectation (or text description of multiple places)
        expected_str = str(expected)

        # Check for freeform multi-place descriptions (e.g. Reel 5: 4 places in meghalay...)
        if is_multi and "meghalay" in normalize_text(expected_str):
            norm_full = normalize_text(
                f"{detected.get('name', '')} {detected.get('formatted_address', '')} {detected.get('country', '')}"
            )
            meghalaya_keywords = ["meghalay", "meghalaya", "shillong", "cherrapunji", "sohra", "dawki", "mawlynnong"]
            if any(k in norm_full for k in meghalaya_keywords):
                status = "passed"
                match_type = "sufficient"
                match_details = f"Detected location is within expected Meghalaya region: '{detected_name}'"
            else:
                status = "failed"
                match_type = "none"
                match_details = f"Detected '{detected_name}' is not in expected Meghalaya region."

            return {
                "id": case_id,
                "url": url,
                "expected": expected,
                "expected_display": self._format_expected_display(expected),
                "evidence": evidence,
                "multi_location": True,
                "notes": notes,
                "scored": True,
                "status": status,
                "match_type": match_type,
                "match_details": match_details,
                "duration_seconds": round(duration_seconds, 2),
                "http_status": http_status,
                "detected": detected,
                "detected_display": detected_display,
                "pipeline": pipeline_info,
                "error": None,
            }

        matched, match_type, match_details = match_single_target(expected_str, detected)
        status = "passed" if matched else "failed"

        return {
            "id": case_id,
            "url": url,
            "expected": expected,
            "expected_display": self._format_expected_display(expected),
            "evidence": evidence,
            "multi_location": is_multi,
            "notes": notes,
            "scored": True,
            "status": status,
            "match_type": match_type,
            "match_details": match_details,
            "duration_seconds": round(duration_seconds, 2),
            "http_status": http_status,
            "detected": detected,
            "detected_display": detected_display,
            "pipeline": pipeline_info,
            "error": None,
        }

    def _format_expected_display(self, expected: Any) -> str:
        if expected is None:
            return "unspecified"
        if isinstance(expected, list):
            if len(expected) <= 3:
                return ", ".join(expected)
            return f"{expected[0]}, {expected[1]} ... ({len(expected)} places)"
        return str(expected)

    def evaluate_summary(self, evaluated_cases: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Computes benchmark summary metrics from evaluated case records.
        """
        total = len(evaluated_cases)
        completed = sum(1 for c in evaluated_cases if c.get("status") in ("passed", "failed", "error", "untested"))

        scored_cases = [c for c in evaluated_cases if c.get("scored")]
        untested_cases = [c for c in evaluated_cases if not c.get("scored")]

        scored_count = len(scored_cases)
        untested_count = len(untested_cases)

        passed_count = sum(1 for c in scored_cases if c.get("status") == "passed")
        failed_count = sum(1 for c in scored_cases if c.get("status") == "failed")
        error_count = sum(1 for c in scored_cases if c.get("status") == "error")

        accuracy = round((passed_count / scored_count * 100.0), 1) if scored_count > 0 else 0.0

        # Performance metrics
        durations = [c.get("duration_seconds", 0.0) for c in evaluated_cases if c.get("duration_seconds") is not None]
        durations_clean = [d for d in durations if d > 0.0]

        if durations_clean:
            avg_duration = round(sum(durations_clean) / len(durations_clean), 1)
            sorted_durations = sorted(durations_clean)
            p95_idx = min(len(sorted_durations) - 1, int(math.ceil(0.95 * len(sorted_durations)) - 1))
            p95_duration = round(sorted_durations[max(0, p95_idx)], 1)
            min_duration = round(min(durations_clean), 1)
            max_duration = round(max(durations_clean), 1)
            total_duration = round(sum(durations_clean), 1)
        else:
            avg_duration = 0.0
            p95_duration = 0.0
            min_duration = 0.0
            max_duration = 0.0
            total_duration = 0.0

        # Evidence breakdown
        evidence_breakdown = self._calculate_evidence_breakdown(scored_cases)

        return {
            "total_cases": total,
            "completed_cases": completed,
            "scored_cases": scored_count,
            "untested_cases": untested_count,
            "passed_cases": passed_count,
            "failed_cases": failed_count,
            "error_cases": error_count,
            "accuracy": accuracy,
            "performance": {
                "average_seconds": avg_duration,
                "p95_seconds": p95_duration,
                "min_seconds": min_duration,
                "max_seconds": max_duration,
                "total_seconds": total_duration,
            },
            "evidence_breakdown": evidence_breakdown,
        }

    def _calculate_evidence_breakdown(self, scored_cases: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Calculates accuracy per evidence type (caption, ocr, speech, multi-location) for scored cases.
        """
        categories = {
            "caption": [c for c in scored_cases if "caption" in [e.lower() for e in c.get("evidence", [])]],
            "ocr": [c for c in scored_cases if "ocr" in [e.lower() for e in c.get("evidence", [])]],
            "speech": [c for c in scored_cases if "speech" in [e.lower() for e in c.get("evidence", [])]],
            "multi_location": [c for c in scored_cases if c.get("multi_location")],
        }

        breakdown: dict[str, Any] = {}
        for cat_name, cases in categories.items():
            if not cases:
                continue
            total = len(cases)
            passed = sum(1 for c in cases if c.get("status") == "passed")
            acc = round((passed / total * 100.0), 1) if total > 0 else 0.0
            breakdown[cat_name] = {
                "total_scored": total,
                "passed": passed,
                "failed": total - passed,
                "accuracy": acc,
            }

        return breakdown
