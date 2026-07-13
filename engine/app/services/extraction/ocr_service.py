import easyocr


class OCRService:

    def __init__(self):
        self.reader = easyocr.Reader(
            ["en"],
            gpu=False,
        )

    def extract_text(self, image_path: str) -> str:

        results = self.reader.readtext(image_path)

        texts = []

        for result in results:
            text = result[1]
            texts.append(text)

        return " ".join(texts)