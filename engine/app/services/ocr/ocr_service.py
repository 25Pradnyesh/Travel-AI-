import cv2
import easyocr
import numpy as np

from engine.app.services.ocr.ocr_cleaner import OCRCleaner


class OCRService:

    def __init__(self):

        self.reader = easyocr.Reader(
            ["en"],
            gpu=False,
        )

        self.cleaner = OCRCleaner()

        self.min_confidence = 0.45
        self.min_width = 30
        self.min_height = 10

    # ==================================================
    # Internal
    # ==================================================

    def _load_image(
        self,
        image,
    ):
        """
        Accept either:
        - image path (str)
        - OpenCV image (numpy array)
        """

        if isinstance(image, str):

            image = cv2.imread(image)

        return image

    # ==================================================
    # Text Density
    # ==================================================

    def estimate_text_density(
        self,
        image,
    ) -> float:

        image = self._load_image(image)

        if image is None:
            return 0.0

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

        edges = cv2.Canny(
            gray,
            100,
            200,
        )

        density = (
            np.count_nonzero(edges)
            / edges.size
        )

        return round(
            float(density),
            4,
        )

    # ==================================================
    # Sharpness
    # ==================================================

    def calculate_sharpness(
        self,
        image,
    ) -> float:

        image = self._load_image(image)

        if image is None:
            return 0.0

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

        variance = cv2.Laplacian(
            gray,
            cv2.CV_64F,
        ).var()

        return round(
            float(variance),
            2,
        )

    # ==================================================
    # Brightness
    # ==================================================

    def calculate_brightness(
        self,
        image,
    ) -> float:

        image = self._load_image(image)

        if image is None:
            return 0.0

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

        brightness = np.mean(gray)

        return round(
            float(brightness),
            2,
        )

    # ==================================================
    # OCR
    # ==================================================

    def extract_text(
        self,
        image,
    ):

        detections = self.reader.readtext(
            image,
        )

        cleaned_results = []

        for detection in detections:

            bbox, text, confidence = detection

            if confidence < self.min_confidence:
                continue

            x_values = [
                point[0]
                for point in bbox
            ]

            y_values = [
                point[1]
                for point in bbox
            ]

            width = (
                max(x_values)
                - min(x_values)
            )

            height = (
                max(y_values)
                - min(y_values)
            )

            if width < self.min_width:
                continue

            if height < self.min_height:
                continue

            text = self.cleaner.clean(
                text,
            )

            if not text:
                continue

            cleaned_results.append(
                {
                    "text": text,
                    "confidence": round(
                        confidence,
                        3,
                    ),
                    "width": round(
                        width,
                        2,
                    ),
                    "height": round(
                        height,
                        2,
                    ),
                }
            )

        return cleaned_results