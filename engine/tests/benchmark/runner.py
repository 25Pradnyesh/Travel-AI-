"""
Travel AI Automated Backend Benchmark Runner.

Runs the existing FastAPI /analyze pipeline sequentially against the benchmark dataset,
records timings and HTTP responses/errors, evaluates against expectations,
and generates both terminal and JSON reports.

Usage:
    python -m engine.tests.benchmark.runner
    python -m engine.tests.benchmark.runner --limit 5
    python -m engine.tests.benchmark.runner --cases 1,2,3
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path
import sys
import time
from typing import Any

import requests

from engine.tests.benchmark.evaluator import BenchmarkEvaluator
from engine.tests.benchmark.reporter import BenchmarkReporter

# Ensure UTF-8 output on Windows consoles
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

logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")
logger = logging.getLogger("benchmark.runner")


class BenchmarkClient:
    """
    HTTP / In-process client for invoking the /analyze endpoint.
    Prefers connecting to a live API server if reachable; otherwise falls back
    to in-process FastAPI TestClient for single-command zero-setup execution.
    """

    def __init__(self, api_url: str, timeout: float = 180.0):
        self.api_url = api_url.rstrip("/")
        self.timeout = timeout
        self.use_test_client = False
        self.session: requests.Session | None = None
        self.test_client: Any = None

        # Check if live server is reachable
        try:
            resp = requests.get(f"{self.api_url}/health", timeout=1.5)
            if resp.status_code == 200:
                print(f"[RUNNER] Connected to live API server at {self.api_url}")
                self.session = requests.Session()
                return
        except Exception:
            pass

        # If local URL and server is not running, fall back to in-process TestClient
        if "127.0.0.1" in self.api_url or "localhost" in self.api_url:
            print(f"[RUNNER] Live server not detected at {self.api_url}.")
            print("[RUNNER] Using in-process FastAPI TestClient for seamless execution...")
            try:
                from fastapi.testclient import TestClient
                from engine.app.main import app

                self.test_client = TestClient(app)
                self.use_test_client = True
                return
            except Exception as exc:
                print(f"[RUNNER] Failed to initialize TestClient: {exc}. Falling back to requests.")

        self.session = requests.Session()

    def analyze(self, reel_url: str) -> tuple[int | None, dict[str, Any] | None, float, str | None]:
        """
        Invokes /analyze with {"reel_url": reel_url}.
        Returns: (http_status, json_data, duration_seconds, error_string)
        """
        payload = {"reel_url": reel_url}
        t0 = time.perf_counter()

        try:
            if self.use_test_client and self.test_client:
                response = self.test_client.post("/analyze", json=payload)
            else:
                assert self.session is not None
                response = self.session.post(
                    f"{self.api_url}/analyze",
                    json=payload,
                    timeout=self.timeout,
                )

            duration = time.perf_counter() - t0
            status_code = response.status_code

            try:
                data = response.json()
            except Exception:
                data = None

            err = None
            if status_code >= 400:
                if isinstance(data, dict):
                    err = str(data.get("detail") or data.get("error") or response.text)
                else:
                    err = response.text or f"HTTP {status_code}"

            return status_code, data, duration, err

        except requests.exceptions.Timeout:
            duration = time.perf_counter() - t0
            return None, None, duration, f"Request timed out after {self.timeout}s"
        except Exception as exc:
            duration = time.perf_counter() - t0
            return None, None, duration, f"Client error: {type(exc).__name__}: {str(exc)}"


def run_benchmark(
    dataset_path: Path | str,
    output_path: Path | str,
    api_url: str,
    timeout: float = 180.0,
    delay: float = 0.5,
    limit: int | None = None,
    specific_cases: list[int] | None = None,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """
    Executes the benchmark suite and produces reports.
    """
    dataset_file = Path(dataset_path)
    output_file = Path(output_path)

    if not dataset_file.exists():
        raise FileNotFoundError(f"Dataset file not found: {dataset_file}")

    with open(dataset_file, "r", encoding="utf-8") as f:
        cases: list[dict[str, Any]] = json.load(f)

    if specific_cases:
        cases = [c for c in cases if c.get("id") in specific_cases]

    if limit is not None and limit > 0:
        cases = cases[:limit]

    total_cases = len(cases)
    scored_count = sum(1 for c in cases if c.get("expected") is not None)
    untested_count = total_cases - scored_count

    print("=" * 60)
    print("Travel AI Backend Benchmark Runner")
    print("=" * 60)
    print(f"Dataset:       {dataset_file}")
    print(f"Total Cases:   {total_cases} ({scored_count} Scored, {untested_count} Untested)")
    print(f"Target API:    {api_url}")
    print(f"Timeout:       {timeout}s per case")
    print(f"Execution:     Sequential")
    print(f"Results File:  {output_file}")
    print("=" * 60)
    print()

    client = BenchmarkClient(api_url=api_url, timeout=timeout)
    evaluator = BenchmarkEvaluator()
    reporter = BenchmarkReporter()

    evaluated_cases: list[dict[str, Any]] = []

    for idx, case in enumerate(cases, 1):
        cid = case.get("id")
        url = case.get("url", "")
        exp = case.get("expected")
        is_scored = exp is not None
        case_kind = "SCORED" if is_scored else "UNTESTED"

        print(f"[{idx}/{total_cases}] Case #{cid} ({case_kind}) -> {url}", flush=True)

        status_code, data, duration, err = client.analyze(url)

        evaluated = evaluator.evaluate_case(
            case=case,
            raw_response=data,
            http_status=status_code,
            duration_seconds=duration,
            error_message=err,
        )
        evaluated_cases.append(evaluated)

        status_str = str(evaluated.get("status", "unknown")).upper()
        detected_display = evaluated.get("detected_display", "None")
        print(f"       Outcome: {status_str} in {duration:.1f}s | Detected: {detected_display}", flush=True)

        # Progressive checkpoint write
        try:
            curr_summary = evaluator.evaluate_summary(evaluated_cases)
            reporter.generate_json_report(curr_summary, evaluated_cases, output_file=output_file)
        except Exception:
            pass

        if delay > 0 and idx < total_cases:
            time.sleep(delay)

    # Final summary & write results
    summary = evaluator.evaluate_summary(evaluated_cases)
    reporter.generate_json_report(summary, evaluated_cases, output_file=output_file)

    # Print terminal report
    terminal_report = reporter.generate_terminal_report(summary, evaluated_cases)
    print(terminal_report, flush=True)

    print(f"\n[RUNNER] Complete benchmark results saved to: {output_file.resolve()}\n", flush=True)

    return summary, evaluated_cases


def main() -> None:
    parser = argparse.ArgumentParser(description="Travel AI Backend Benchmark Runner")
    parser.add_argument(
        "--api-url",
        default=os.getenv("BENCHMARK_API_URL") or os.getenv("API_BASE_URL") or "http://127.0.0.1:8000",
        help="FastAPI backend URL (default: http://127.0.0.1:8000)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=float(os.getenv("BENCHMARK_TIMEOUT", "180")),
        help="Request timeout in seconds (default: 180s)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=float(os.getenv("BENCHMARK_DELAY", "0.5")),
        help="Delay in seconds between requests (default: 0.5s)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit execution to first N cases",
    )
    parser.add_argument(
        "--cases",
        type=str,
        default=None,
        help="Comma-separated case IDs to run (e.g. 1,2,3)",
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=str(Path(__file__).resolve().parent / "dataset.json"),
        help="Path to dataset.json",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(Path(__file__).resolve().parent / "results" / "latest.json"),
        help="Path to save latest.json",
    )

    args = parser.parse_args()

    specific_cases = None
    if args.cases:
        specific_cases = [int(c.strip()) for c in args.cases.split(",") if c.strip().isdigit()]

    run_benchmark(
        dataset_path=args.dataset,
        output_path=args.output,
        api_url=args.api_url,
        timeout=args.timeout,
        delay=args.delay,
        limit=args.limit,
        specific_cases=specific_cases,
    )


if __name__ == "__main__":
    main()
