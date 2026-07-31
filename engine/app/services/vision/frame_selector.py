from pathlib import Path
import cv2


class FrameSelector:

    def __init__(self):

        self.max_frames = 5

    # ==================================================
    # Select Best Frames
    # ==================================================

    def select(
        self,
        frame_paths: list[str],
    ):

        if not frame_paths:
            return []

        scored = []

        for path in frame_paths:

            score = self.frame_score(path)

            scored.append(
                (
                    score,
                    path,
                )
            )

        scored.sort(
            reverse=True,
            key=lambda x: x[0],
        )

        return [

            frame

            for _, frame in scored[
                : self.max_frames
            ]

        ]

    # ==================================================
    # Sharpness Score
    # ==================================================

    def frame_score(
        self,
        frame_path: str,
    ):

        image = cv2.imread(
            str(frame_path),
        )

        if image is None:
            return 0

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

        sharpness = cv2.Laplacian(
            gray,
            cv2.CV_64F,
        ).var()

        brightness = gray.mean()

        contrast = gray.std()

        return (

            sharpness * 0.65

            +

            brightness * 0.15

            +

            contrast * 0.20

        )