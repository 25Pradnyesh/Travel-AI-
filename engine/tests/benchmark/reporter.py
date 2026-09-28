"""
Travel AI Benchmark Reporter.

Generates human-readable terminal reports and machine-readable JSON reports
for the Travel AI benchmark suite.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from typing import Any

# Ensure UTF-8 output on Windows consoles to prevent charmap encoding errors
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass



def format_evidence(evidence_list: list[str] | None) -> str:
    """Formats evidence tags into human-readable labels (e.g. ['ocr'] -> 'OCR')."""
    if not evidence_list:
        return "None"
    formatted = []
    for ev in evidence_list:
        ev_lower = ev.lower().strip()
        if ev_lower == "ocr":
            formatted.append("OCR")
        elif ev_lower == "speech":
            formatted.append("Speech")
        elif ev_lower == "caption":
            formatted.append("Caption")
        else:
            formatted.append(ev.capitalize())
    return ", ".join(formatted)


def format_expected(expected: Any) -> str:
    """Formats expected values cleanly for reports."""
    if expected is None:
        return "unspecified"
    if isinstance(expected, list):
        if len(expected) <= 3:
            return ", ".join(expected)
        return f"{expected[0]}, {expected[1]} ... ({len(expected)} destinations)"
    return str(expected)


class BenchmarkReporter:
    """
    Handles terminal reporting and JSON artifact generation for benchmarks.
    """

    def generate_terminal_report(
        self,
        summary: dict[str, Any],
        evaluated_cases: list[dict[str, Any]],
    ) -> str:
        """
        Builds the human-readable terminal output.
        """
        lines: list[str] = []
        divider = "─" * 36

        lines.append("")
        lines.append("Travel AI Backend Benchmark")
        lines.append(divider)
        lines.append(f"Total:          {summary.get('total_cases', 0)}")
        lines.append(f"Completed:      {summary.get('completed_cases', 0)}")
        lines.append(f"Scored:         {summary.get('scored_cases', 0)}")
        lines.append(f"Untested:       {summary.get('untested_cases', 0)}")
        lines.append(f"Passed:         {summary.get('passed_cases', 0)}")
        lines.append(f"Failed:         {summary.get('failed_cases', 0)}")
        lines.append(f"Errors:         {summary.get('error_cases', 0)}")
        lines.append("")
        lines.append(f"Accuracy:       {summary.get('accuracy', 0.0):.1f}%")
        lines.append("")

        # Performance section
        perf = summary.get("performance", {})
        lines.append("Performance")
        lines.append(divider)
        lines.append(f"Average:        {perf.get('average_seconds', 0.0):.1f}s")
        lines.append(f"P95:            {perf.get('p95_seconds', 0.0):.1f}s")
        lines.append("")

        # Evidence section
        evidence_breakdown = summary.get("evidence_breakdown", {})
        lines.append("Evidence")
        lines.append(divider)

        # Standard evidence categories
        categories = [
            ("caption", "Caption"),
            ("ocr", "OCR"),
            ("speech", "Speech"),
            ("multi_location", "Multi-location"),
        ]

        for key, label in categories:
            if key in evidence_breakdown:
                acc = evidence_breakdown[key].get("accuracy", 0.0)
                lines.append(f"{label:<16}{acc:.1f}%")
            else:
                lines.append(f"{label:<16}N/A")
        lines.append("")

        # Failed cases
        failed_or_error_cases = [c for c in evaluated_cases if c.get("scored") and c.get("status") in ("failed", "error")]
        if failed_or_error_cases:
            lines.append("FAILED CASES")
            lines.append(divider)
            for c in failed_or_error_cases:
                cid = c.get("id")
                exp = format_expected(c.get("expected"))
                det = c.get("detected_display", "None")
                ev = format_evidence(c.get("evidence"))
                status_str = str(c.get("status", "FAILED")).upper()

                # Title or notes
                title = c.get("notes") or exp
                lines.append(f"#{cid}  {title}")
                lines.append(f"Expected: {exp}")
                lines.append(f"Detected: {det}")
                lines.append(f"Evidence: {ev}")
                lines.append(f"Status: {status_str}")
                if c.get("error"):
                    lines.append(f"Error: {c.get('error')}")
                elif c.get("match_details"):
                    lines.append(f"Details: {c.get('match_details')}")
                lines.append("")

        # Untested cases
        untested_cases = [c for c in evaluated_cases if not c.get("scored")]
        if untested_cases:
            lines.append("UNTESTED CASES")
            lines.append(divider)
            for c in untested_cases:
                cid = c.get("id")
                det = c.get("detected_display", "None")
                lines.append(f"#{cid}")
                lines.append("Expected: unspecified")
                lines.append(f"Detected: {det}")
                if c.get("evidence"):
                    lines.append(f"Evidence: {format_evidence(c.get('evidence'))}")
                lines.append("Status: UNTESTED")
                lines.append("")

        return "\n".join(lines)

    def generate_json_report(
        self,
        summary: dict[str, Any],
        evaluated_cases: list[dict[str, Any]],
        output_file: Path | str | None = None,
    ) -> dict[str, Any]:
        """
        Generates and saves the machine-readable JSON benchmark report.
        """
        report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": {
                "total_cases": summary.get("total_cases", 0),
                "completed_cases": summary.get("completed_cases", 0),
                "scored_cases": summary.get("scored_cases", 0),
                "untested_cases": summary.get("untested_cases", 0),
                "passed_cases": summary.get("passed_cases", 0),
                "failed_cases": summary.get("failed_cases", 0),
                "error_cases": summary.get("error_cases", 0),
                "accuracy": summary.get("accuracy", 0.0),
                "performance": summary.get("performance", {}),
                "evidence_breakdown": summary.get("evidence_breakdown", {}),
            },
            "cases": evaluated_cases,
        }

        if output_file:
            path = Path(output_file)
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2, ensure_ascii=False)

        return report
