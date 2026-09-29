from pathlib import Path

import cv2
import numpy as np

from engine.app.services.ocr.ocr_service import OCRService


class FrameExtractor:
    """
    Intelligent Frame Extractor

    Features
    --------
    ✓ Adaptive frame count
    ✓ Adaptive sampling
    ✓ Scene detection
    ✓ Text density scoring
    ✓ Sharpness scoring
    ✓ Brightness scoring
    """

    def __init__(self):

        self.scene_threshold = 12.0

        self.ocr = OCRService()

    # ==================================================
    # Adaptive Frame Budget
    # ==================================================

    def determine_frame_budget(
        self,
        duration: float,
    ):

        if duration <= 15:
            return 3, 12

        if duration <= 45:
            return 5, 20

        if duration <= 90:
            return 7, 35

        return 9, 50

    # ==================================================
    # Scene Difference
    # ==================================================

    def frame_difference(
        self,
        frame1,
        frame2,
    ):

        gray1 = cv2.cvtColor(
            frame1,
            cv2.COLOR_BGR2GRAY,
        )

        gray2 = cv2.cvtColor(
            frame2,
            cv2.COLOR_BGR2GRAY,
        )

        diff = cv2.absdiff(
            gray1,
            gray2,
        )

        return float(
            np.mean(diff)
        )

    # ==================================================
    # Frame Quality Score
    # ==================================================

    def score_frame(
        self,
        frame,
        scene_difference: float,
    ):

        text_density = (
            self.ocr.estimate_text_density(
                frame,
            )
        )

        sharpness = (
            self.ocr.calculate_sharpness(
                frame,
            )
        )

        brightness = (
            self.ocr.calculate_brightness(
                frame,
            )
        )

        # Reject useless frames

        if brightness < 20:
            return None

        if brightness > 240:
            return None

        if sharpness < 12:
            return None

        normalized_scene = min(
            scene_difference / 40,
            1.0,
        )

        normalized_text = min(
            text_density * 100,
            1.0,
        )

        normalized_sharpness = min(
            sharpness / 500,
            1.0,
        )

        normalized_brightness = max(
            0,
            1 - abs(brightness - 128) / 128,
        )

        score = (
            normalized_scene * 25
            + normalized_text * 35
            + normalized_sharpness * 25
            + normalized_brightness * 15
        )

        return {

            "score": round(
                score,
                2,
            ),

            "scene_difference": round(
                scene_difference,
                2,
            ),

            "text_density": round(
                text_density,
                4,
            ),

            "sharpness": round(
                sharpness,
                2,
            ),

            "brightness": round(
                brightness,
                2,
            ),

        }

    # ==================================================
    # Main Extraction
    # ==================================================

    def extract(
        self,
        video_path: str,
        output_dir: str,
    ):

        output = Path(output_dir)

        output.mkdir(
            parents=True,
            exist_ok=True,
        )

        cap = cv2.VideoCapture(
            video_path,
        )

        try:
            return self._extract_with_cap(cap, output)
        finally:
            cap.release()

    def _extract_with_cap(
        self,
        cap,
        output: Path,
    ):

        total_frames = int(
            cap.get(
                cv2.CAP_PROP_FRAME_COUNT
            )
        )

        fps = cap.get(
            cv2.CAP_PROP_FPS
        )

        if fps <= 0:
            fps = 30

        duration = total_frames / fps

        max_frames, sample_count = (
            self.determine_frame_budget(
                duration,
            )
        )

        print(
            f"\n🎬 Duration: {duration:.1f}s"
        )

        print(
            f"🎞 Sampling {sample_count} frames"
        )

        print(
            f"🏆 Keeping best {max_frames} frames\n"
        )

        if total_frames <= 0:
            raise Exception(
                "Unable to read video."
            )

        positions = [

            int(
                i * (total_frames - 1)
                / (sample_count - 1)
            )

            for i in range(sample_count)

        ]

        candidates = []

        previous_frame = None

        for frame_no in positions:

            cap.set(
                cv2.CAP_PROP_POS_FRAMES,
                frame_no,
            )

            success, frame = cap.read()

            if not success:
                continue

            if previous_frame is None:

                diff = 100

            else:

                diff = self.frame_difference(
                    previous_frame,
                    frame,
                )

            previous_frame = frame.copy()

            metrics = self.score_frame(
                frame,
                diff,
            )

            if metrics is None:
                continue

            candidates.append(

                {

                    "frame_no": frame_no,

                    "frame": frame.copy(),

                    "metrics": metrics,

                }

            )

        # ==================================================
        # Fallback
        # ==================================================

        if not candidates:

            cap.set(
                cv2.CAP_PROP_POS_FRAMES,
                total_frames // 2,
            )

            success, frame = cap.read()

            if success:

                candidates.append(

                    {

                        "frame_no": total_frames // 2,

                        "frame": frame,

                        "metrics": {

                            "score": 0,

                            "scene_difference": 0,

                            "text_density": 0,

                            "sharpness": 0,

                            "brightness": 0,

                        },

                    }

                )

        # ==================================================
        # Pick Best per Temporal Segment
        # ==================================================

        selected = []
        if candidates:
            seg_size = total_frames / max(max_frames, 1)
            for seg_idx in range(max_frames):
                seg_start = seg_idx * seg_size
                seg_end = (seg_idx + 1) * seg_size
                in_seg = [c for c in candidates if seg_start <= c["frame_no"] < seg_end]
                if in_seg:
                    best = max(in_seg, key=lambda x: x["metrics"]["score"])
                    selected.append(best)

        # Fallback to fill max_frames if any segment lacked valid candidates
        if len(selected) < max_frames and candidates:
            remaining = [c for c in candidates if c not in selected]
            remaining.sort(key=lambda x: x["metrics"]["score"], reverse=True)
            selected.extend(remaining[: max_frames - len(selected)])

        # Performance optimization (Stage 11):
        # Order selected frames by text density (and overall frame quality) descending
        # so OCR and vision process the most informative/legible frames first.
        selected.sort(
            key=lambda x: (
                x["metrics"].get("text_density", 0.0),
                x["metrics"].get("score", 0.0),
            ),
            reverse=True,
        )

        saved = []

        print(
            "\n========== FRAME SCORES =========="
        )

        for index, item in enumerate(
            selected,
        ):

            filename = (
                output
                / f"frame_{index:03d}.jpg"
            )

            cv2.imwrite(
                str(filename),
                item["frame"],
            )

            saved.append(
                str(filename)
            )

            m = item["metrics"]

            print(

                f"Frame {item['frame_no']}"

                f" | Score={m['score']}"

                f" | Scene={m['scene_difference']}"

                f" | Text={m['text_density']}"

                f" | Sharpness={m['sharpness']}"

                f" | Brightness={m['brightness']}"

            )

        print(
            "=================================\n"
        )

        print(
            f"🎞 Selected {len(saved)} intelligent frames."
        )

        return saved