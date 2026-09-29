"""
Metrics Aggregation for Travel AI Observability.

Provides in-memory metrics aggregation across analysis requests, tracking
request volume, error rates, failure distributions, and stage execution latencies.
"""

from collections import defaultdict
import threading
from typing import Any


class MetricsAggregator:
    """
    Thread-safe in-memory aggregator for pipeline metrics and error rates.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._total_requests = 0
        self._successful_requests = 0
        self._failed_requests = 0
        self._error_category_counts: dict[str, int] = defaultdict(int)
        self._failure_stage_counts: dict[str, int] = defaultdict(int)
        self._stage_duration_sums: dict[str, float] = defaultdict(float)
        self._stage_duration_counts: dict[str, int] = defaultdict(int)
        self._total_duration_sum = 0.0

    def record_request(self, telemetry: dict[str, Any]) -> None:
        """
        Ingests a telemetry dictionary produced by RequestContext.get_telemetry_dict().
        """
        with self._lock:
            self._total_requests += 1

            if telemetry.get("success"):
                self._successful_requests += 1
            else:
                self._failed_requests += 1
                cat = telemetry.get("error_category")
                if cat:
                    self._error_category_counts[str(cat)] += 1
                stage = telemetry.get("failure_stage")
                if stage:
                    self._failure_stage_counts[str(stage)] += 1

            total_sec = telemetry.get("total_request_duration_seconds", 0.0)
            self._total_duration_sum += total_sec

            for stage_name, duration in telemetry.get("stage_durations", {}).items():
                if isinstance(duration, (int, float)):
                    self._stage_duration_sums[stage_name] += duration
                    self._stage_duration_counts[stage_name] += 1

    def get_summary(self) -> dict[str, Any]:
        """
        Returns an aggregated summary of all requests processed by the engine.
        """
        with self._lock:
            total = self._total_requests
            succ = self._successful_requests
            fail = self._failed_requests
            succ_rate = round((succ / total) * 100.0, 1) if total > 0 else 0.0
            avg_duration = round(self._total_duration_sum / total, 3) if total > 0 else 0.0

            avg_stage_durations = {}
            for stage, d_sum in self._stage_duration_sums.items():
                count = self._stage_duration_counts.get(stage, 0)
                if count > 0:
                    avg_stage_durations[stage] = round(d_sum / count, 3)

            return {
                "total_requests": total,
                "successful_requests": succ,
                "failed_requests": fail,
                "success_rate_percent": succ_rate,
                "average_request_duration_seconds": avg_duration,
                "average_stage_durations": avg_stage_durations,
                "error_categories": dict(self._error_category_counts),
                "failure_stages": dict(self._failure_stage_counts),
            }

    def reset(self) -> None:
        """Resets all metrics (primarily for unit test isolation)."""
        with self._lock:
            self._total_requests = 0
            self._successful_requests = 0
            self._failed_requests = 0
            self._error_category_counts.clear()
            self._failure_stage_counts.clear()
            self._stage_duration_sums.clear()
            self._stage_duration_counts.clear()
            self._total_duration_sum = 0.0


_global_metrics = MetricsAggregator()


def get_metrics_aggregator() -> MetricsAggregator:
    """Returns the singleton MetricsAggregator instance."""
    return _global_metrics
