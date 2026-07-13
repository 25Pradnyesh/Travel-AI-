from pathlib import Path
import cv2


class FrameExtractor:
    """
    Extracts frames from a video every N seconds.
    """

    def extract(
        self,
        video_path: str,
        output_dir: str,
        interval_seconds: int = 2,
    ):

        output = Path(output_dir)
        output.mkdir(parents=True, exist_ok=True)

        cap = cv2.VideoCapture(video_path)

        fps = cap.get(cv2.CAP_PROP_FPS)

        if fps == 0:
            raise Exception("Unable to read video.")

        frame_interval = int(fps * interval_seconds)

        frames = []

        frame_count = 0
        saved = 0

        while True:

            success, frame = cap.read()

            if not success:
                break

            if frame_count % frame_interval == 0:

                filename = output / f"frame_{saved:03d}.jpg"

                cv2.imwrite(str(filename), frame)

                frames.append(str(filename))

                saved += 1

            frame_count += 1

        cap.release()

        return frames