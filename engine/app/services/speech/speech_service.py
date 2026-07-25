import whisper

print("Loading Whisper model...")

WHISPER_MODEL = whisper.load_model(
    "small",
)

print("✅ Whisper model loaded.")


class SpeechService:

    def __init__(self):

        self.model = WHISPER_MODEL

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