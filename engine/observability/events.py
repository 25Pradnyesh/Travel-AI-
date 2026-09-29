"""
Structured Event Definitions for Travel AI Observability.
"""

from dataclasses import dataclass, field
import time
from typing import Any


@dataclass
class StructuredEvent:
    timestamp: float = field(default_factory=time.time)
    request_id: str = ""
    stage: str = ""
    event_name: str = ""
    data: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "timestamp": round(self.timestamp, 4),
            "request_id": self.request_id,
            "stage": self.stage,
            "event": self.event_name,
            "data": self.data,
        }
