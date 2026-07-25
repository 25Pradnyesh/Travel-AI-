class OCRAggregator:

    def __init__(self):

        self.min_average_confidence = 0.90

        self.min_unique_detections = 2

        self.min_high_confidence = 2

    # ==================================================
    # Aggregate OCR Results
    # ==================================================

    def aggregate(
        self,
        frame_results: list,
    ):

        best = {}

        total_frames = len(frame_results)

        high_confidence = 0

        for frame in frame_results:

            for detection in frame:

                text = (
                    detection.get(
                        "text",
                        "",
                    )
                    .strip()
                )

                if not text:
                    continue

                confidence = detection.get(
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

                    }

        detections = list(
            best.values()
        )

        detections.sort(

            key=lambda x: x["confidence"],

            reverse=True,

        )

        combined_text = " ".join(

            detection["text"]

            for detection in detections

        )

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

            "text": combined_text,

            "detections": detections,

            "frames_used": total_frames,

            "unique_detections": len(
                detections
            ),

            "high_confidence_detections": high_confidence,

            "confidence": average_confidence,

            "quality": quality,

            "should_stop": self.should_stop(

                average_confidence,

                len(detections),

                high_confidence,

            ),

        }

    # ==================================================
    # Early Stop Decision
    # ==================================================

    def should_stop(
        self,
        average_confidence: float,
        unique_detections: int,
        high_confidence: int,
    ):

        if (
            average_confidence
            < self.min_average_confidence
        ):
            return False

        if (
            unique_detections
            < self.min_unique_detections
        ):
            return False

        if (
            high_confidence
            < self.min_high_confidence
        ):
            return False

        return True

    # ==================================================
    # OCR Quality
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