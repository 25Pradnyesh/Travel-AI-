"""
Request and Trace Context for Travel AI Observability.

Provides an async-safe, thread-local execution context tracking stage durations,
external API latencies, retry counts, candidate progression, confidence scores,
and failure categorization throughout the request lifecycle.
"""

from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
import time
from typing import Any, Generator
import uuid

from engine.observability.errors import ErrorCategory, categorize_error
from engine.observability.events import StructuredEvent
from engine.observability.redactor import redact_sensitive_data, sanitize_url
from engine.observability.stages import PipelineStage


@dataclass
class RequestContext:
    """
    Maintains end-to-end execution context for an individual analysis request.
    """
    request_id: str
    url: str = ""
    start_time: float = field(default_factory=time.perf_counter)
    stage_durations: dict[str, float] = field(default_factory=dict)
    stage_start_times: dict[str, float] = field(default_factory=dict)
    external_latencies: dict[str, float] = field(default_factory=dict)
    retry_counts: dict[str, int] = field(default_factory=dict)
    evidence_sources: list[str] = field(default_factory=list)
    candidate_count: int = 0
    selected_candidate: str | None = None
    confidence: float | int | None = None
    confidence_level: str | None = None
    places_resolution_status: str | None = None
    gemini_verification_status: str | None = None
    final_stage: str | None = None
    success: bool = False
    failure_stage: str | None = None
    error_category: str | None = None
    error_message: str | None = None
    events: list[StructuredEvent] = field(default_factory=list)

    def record_stage_start(self, stage: str | PipelineStage) -> None:
        stage_str = str(stage)
        self.stage_start_times[stage_str] = time.perf_counter()

    def record_stage_end(self, stage: str | PipelineStage) -> float:
        stage_str = str(stage)
        start = self.stage_start_times.pop(stage_str, None)
        if start is not None:
            duration = time.perf_counter() - start
            self.stage_durations[stage_str] = round(duration, 3)
            return duration
        return 0.0

    def record_stage_duration(self, stage: str | PipelineStage, duration: float) -> None:
        stage_str = str(stage)
        # Accumulate if stage already recorded, otherwise set
        current = self.stage_durations.get(stage_str, 0.0)
        self.stage_durations[stage_str] = round(current + duration, 3)

    def record_external_call(self, service: str, latency: float, retries: int = 0) -> None:
        current = self.external_latencies.get(service, 0.0)
        self.external_latencies[service] = round(current + latency, 3)
        if retries > 0:
            self.retry_counts[service] = self.retry_counts.get(service, 0) + retries

    def record_event(self, stage: str | PipelineStage, event_name: str, **kwargs: Any) -> None:
        event = StructuredEvent(
            timestamp=time.time(),
            request_id=self.request_id,
            stage=str(stage),
            event_name=event_name,
            data=redact_sensitive_data(kwargs),
        )
        self.events.append(event)

    def record_failure(
        self,
        stage: str | PipelineStage,
        error_category: str | ErrorCategory,
        error_message: str,
    ) -> None:
        self.success = False
        self.failure_stage = str(stage)
        self.error_category = str(error_category)
        self.error_message = redact_sensitive_data(str(error_message))
        self.record_event(
            stage=stage,
            event_name="stage_failure",
            error_category=self.error_category,
            error_message=self.error_message,
        )

    def get_total_duration(self) -> float:
        return round(time.perf_counter() - self.start_time, 3)

    def get_telemetry_dict(self) -> dict[str, Any]:
        """
        Produces the standardized stage-level execution and reliability telemetry dictionary.
        """
        return {
            "request_id": self.request_id,
            "total_request_duration_seconds": self.get_total_duration(),
            "stage_durations": dict(self.stage_durations),
            "success": self.success,
            "failure_stage": self.failure_stage,
            "error_category": self.error_category,
            "external_service_latency": dict(self.external_latencies),
            "retry_counts": dict(self.retry_counts),
            "evidence_sources_used": list(self.evidence_sources),
            "candidate_count": self.candidate_count,
            "selected_candidate": self.selected_candidate,
            "confidence": self.confidence,
            "confidence_level": self.confidence_level,
            "google_places_resolution_status": self.places_resolution_status,
            "gemini_verification_status": self.gemini_verification_status,
            "final_pipeline_stage": self.final_stage,
        }


# Async and thread-safe context variable
_context_var: ContextVar[RequestContext | None] = ContextVar("request_context", default=None)


def get_current_context() -> RequestContext | None:
    """Retrieves the active RequestContext for this thread/async task, or None."""
    return _context_var.get()


def set_current_context(ctx: RequestContext | None) -> None:
    """Sets or clears the active RequestContext."""
    _context_var.set(ctx)


def start_request_context(request_id: str | None = None, url: str = "") -> RequestContext:
    """
    Initializes and activates a new RequestContext with an explicit or generated request_id.
    """
    if not request_id:
        request_id = str(uuid.uuid4())
    ctx = RequestContext(
        request_id=request_id,
        url=sanitize_url(url),
    )
    set_current_context(ctx)
    return ctx


@contextmanager
def measure_stage(
    stage_name: str | PipelineStage,
    error_category: ErrorCategory | None = None,
) -> Generator[RequestContext | None, None, None]:
    """
    Context manager that records execution timing, stage transitions, and failure
    categorization for a pipeline stage.
    """
    stage_str = str(stage_name)
    ctx = get_current_context()
    t0 = time.perf_counter()

    if ctx:
        ctx.record_stage_start(stage_str)
        ctx.record_event(stage_str, "stage_start")

    try:
        yield ctx
    except Exception as exc:
        duration = time.perf_counter() - t0
        if ctx:
            ctx.record_stage_duration(stage_str, duration)
            cat = error_category or categorize_error(exc, stage=stage_str)
            ctx.record_failure(stage=stage_str, error_category=cat, error_message=str(exc))
        raise
    else:
        duration = time.perf_counter() - t0
        if ctx:
            ctx.record_stage_duration(stage_str, duration)
            ctx.record_event(stage_str, "stage_complete", duration=round(duration, 3))
