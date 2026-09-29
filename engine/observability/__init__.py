"""
Travel AI Observability Package.

Provides lightweight, zero-dependency structured tracing, stage-level execution timing,
machine-readable error categorization, metrics aggregation, and credential redaction.
"""

from engine.observability.stages import PipelineStage
from engine.observability.errors import ErrorCategory, categorize_error
from engine.observability.redactor import (
    redact_sensitive_data,
    sanitize_url,
    sanitize_dict,
)
from engine.observability.events import StructuredEvent
from engine.observability.context import (
    RequestContext,
    get_current_context,
    set_current_context,
    start_request_context,
    measure_stage,
)
from engine.observability.logger import StructuredLogger, get_logger
from engine.observability.metrics import MetricsAggregator, get_metrics_aggregator

__all__ = [
    "PipelineStage",
    "ErrorCategory",
    "categorize_error",
    "redact_sensitive_data",
    "sanitize_url",
    "sanitize_dict",
    "StructuredEvent",
    "RequestContext",
    "get_current_context",
    "set_current_context",
    "start_request_context",
    "measure_stage",
    "StructuredLogger",
    "get_logger",
    "MetricsAggregator",
    "get_metrics_aggregator",
]
