import datetime
import json
import logging
import os
from pathlib import Path
import threading

logger = logging.getLogger(__name__)

COUNTER_FILE = Path(__file__).resolve().parents[3] / "assets" / "cache" / "gemini_counter.json"
_counter_lock = threading.Lock()


class GeminiCallCounter:
    """
    Persistent daily call counter for Google AI Studio free tier.
    Tracks requests per day (RPD) to prevent exceeding free tier quotas.
    Provides backoff and quota-exhaustion flags.
    """

    def __init__(self, counter_file: Path | None = None):
        self.file_path = counter_file or COUNTER_FILE
        self.daily_limit = int(os.getenv("GEMINI_DAILY_LIMIT", "1500"))
        self._quota_exhausted_flag = False

    def _get_today_str(self) -> str:
        return datetime.date.today().isoformat()

    def _read_data(self) -> dict:
        today = self._get_today_str()
        if self.file_path.exists():
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("date") == today:
                        return data
            except Exception as e:
                logger.warning("[GEMINI_COUNTER] Failed to read counter: %s", e)
        return {"date": today, "count": 0}

    def _write_data(self, data: dict) -> None:
        try:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.warning("[GEMINI_COUNTER] Failed to write counter: %s", e)

    def get_count(self) -> int:
        with _counter_lock:
            return self._read_data().get("count", 0)

    def increment(self) -> int:
        with _counter_lock:
            data = self._read_data()
            data["count"] = data.get("count", 0) + 1
            self._write_data(data)
            return data["count"]

    def is_quota_exhausted(self) -> bool:
        if self._quota_exhausted_flag:
            return True
        return self.get_count() >= self.daily_limit

    def mark_quota_exhausted(self) -> None:
        self._quota_exhausted_flag = True

    def get_status(self) -> dict:
        used = self.get_count()
        return {
            "daily_calls_used": used,
            "daily_calls_limit": self.daily_limit,
            "quota_exhausted": self.is_quota_exhausted(),
        }


# Global singleton instance
gemini_counter = GeminiCallCounter()
