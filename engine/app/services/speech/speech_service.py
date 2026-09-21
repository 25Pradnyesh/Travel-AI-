import logging
import threading
from typing import Any

logger = logging.getLogger(__name__)

_model_lock = threading.Lock()
_whisper_model: Any = None


def get_whisper_model() -> Any:
    """
    Lazy-loads the Whisper model on first invocation to prevent
    slow server startup and high initial memory overhead.
    """
    global _whisper_model
    if _whisper_model is None:
        with _model_lock:
            if _whisper_model is None:
                import whisper
                logger.info("[WHISPER] Loading Whisper 'small' model on-demand...")
                _whisper_model = whisper.load_model("small")
                logger.info("[WHISPER] ✅ Whisper model loaded successfully.")
    return _whisper_model


class SpeechService:

    def __init__(self):
        pass

    @property
    def model(self):
        return get_whisper_model()

    # ==================================================
    # Speech Extraction
    # ==================================================

    def extract(
        self,
        video_path: str,
    ):

        print(
            f"🎤 Transcribing: {video_path}"
        )

        result = self.model.transcribe(
            video_path,
            fp16=False,
            verbose=False,
        )

        segments = []

        total_probability = 0.0

        probability_count = 0

        for segment in result.get(
            "segments",
            [],
        ):

            probability = 1.0 - abs(
                segment.get(
                    "avg_logprob",
                    -1.0,
                )
            )

            probability = max(
                0.0,
                min(
                    probability,
                    1.0,
                ),
            )

            total_probability += probability

            probability_count += 1

            segments.append(
                {
                    "id": segment.get("id"),
                    "start": round(
                        segment.get(
                            "start",
                            0,
                        ),
                        2,
                    ),
                    "end": round(
                        segment.get(
                            "end",
                            0,
                        ),
                        2,
                    ),
                    "text": segment.get(
                        "text",
                        "",
                    ).strip(),
                    "confidence": round(
                        probability,
                        3,
                    ),
                }
            )

        average_confidence = 0.0

        if probability_count:

            average_confidence = round(
                total_probability
                / probability_count,
                3,
            )

        transcript = " ".join(

            segment["text"]

            for segment in segments

        ).strip()

        return {

            "text": transcript,

            "segments": segments,

            "language": result.get(
                "language",
                "unknown",
            ),

            "confidence": average_confidence,

            "segment_count": len(
                segments,
            ),

        }