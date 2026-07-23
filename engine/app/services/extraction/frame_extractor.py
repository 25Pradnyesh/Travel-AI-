from pathlib import Path
import cv2


class FrameExtractor:
    """
    Extracts a small set of representative frames
    evenly distributed across the video.
    """

    def extract(
        self,
        video_path: str,
        output_dir: str,
        max_frames: int = 5,
    ):

        output = Path(output_dir)
        output.mkdir(parents=True, exist_ok=True)

        cap = cv2.VideoCapture(video_path)

        total_frames = int(
            cap.get(cv2.CAP_PROP_FRAME_COUNT)
        )

        if total_frames <= 0:
            cap.release()
            raise Exception("Unable to read video.")

        # ----------------------------------------
        # Select evenly spaced frame positions
        # ----------------------------------------

        if total_frames <= max_frames:
            positions = list(range(total_frames))
        else:
            positions = [
                int(i * (total_frames - 1) / (max_frames - 1))
                for i in range(max_frames)
            ]

        saved = []

        for index, frame_no in enumerate(positions):

            cap.set(
                cv2.CAP_PROP_POS_FRAMES,
                frame_no,
            )

            success, frame = cap.read()

            if not success:
                continue

            filename = output / f"frame_{index:03d}.jpg"

            cv2.imwrite(
                str(filename),
                frame,
            )

            saved.append(str(filename))

        cap.release()

        print(
            f"🎞️ Extracted {len(saved)} representative frames."
        )

        return saved