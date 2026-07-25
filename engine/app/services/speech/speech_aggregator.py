class SpeechAggregator:

    def __init__(self):

        self.min_average_confidence = 0.85

        self.min_segments = 2

        self.min_high_confidence = 2

    # ==================================================
    # Aggregate Speech
    # ==================================================

    def aggregate(
        self,
        segments: list,
    ):

        best = {}

        high_confidence = 0

        for segment in segments:

            text = (
                segment.get(
                    "text",
                    "",
                )
                .strip()
            )

            if not text:
                continue

            confidence = segment.get(
                "confidence",
                0,
            )

            existing = best.get(
                text.lower()
            )

            if (
                existing is None
                or confidence
                > existing["confidence"]
            ):

                best[text.lower()] = {

                    "text": text,

                    "confidence": confidence,

                    "start": segment.get(
                        "start",
                        0,
                    ),

                    "end": segment.get(
                        "end",
                        0,
                    ),

                }

        detections = list(
            best.values()
        )

        detections.sort(

            key=lambda x: x["confidence"],

            reverse=True,

        )

        transcript = " ".join(

            detection["text"]

            for detection in detections

        ).strip()

        if detections:

            average_confidence = round(

                sum(
                    d["confidence"]
                    for d in detections
                )
                / len(detections),

                3,

            )

        else:

            average_confidence = 0.0

        for detection in detections:

            if detection["confidence"] >= 0.90:

                high_confidence += 1

        quality = self.quality_level(
            average_confidence,
        )

        return {

            "text": transcript,

            "segments": detections,

            "confidence": average_confidence,

            "quality": quality,

            "segment_count": len(
                detections,
            ),

            "high_confidence_segments": high_confidence,

            "should_stop": self.should_stop(

                average_confidence,

                len(detections),

                high_confidence,

            ),

        }

    # ==================================================
    # Early Stop
    # ==================================================

    def should_stop(
        self,
        confidence: float,
        segment_count: int,
        high_confidence: int,
    ):

        if confidence < self.min_average_confidence:
            return False

        if segment_count < self.min_segments:
            return False

        if high_confidence < self.min_high_confidence:
            return False

        return True

    # ==================================================
    # Speech Quality
    # ==================================================

    def quality_level(
        self,
        confidence: float,
    ):

        if confidence >= 0.95:
            return "EXCELLENT"

        if confidence >= 0.90:
            return "HIGH"

        if confidence >= 0.80:
            return "MEDIUM"

        if confidence >= 0.70:
            return "LOW"

        return "POOR"