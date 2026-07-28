from pathlib import Path

import google.generativeai as genai

from engine.app.services.gemini.vision_prompt_builder import (
    VisionPromptBuilder,
)
from engine.app.services.gemini.vision_response_parser import (
    VisionResponseParser,
)


class GeminiVisionService:

    def __init__(self):

        self.model = genai.GenerativeModel(
            "gemini-2.5-flash"
        )

        self.prompt_builder = VisionPromptBuilder()

        self.parser = VisionResponseParser()

    # ==================================================
    # Verify Image
    # ==================================================

    def verify(
        self,
        image_path: str,
        evidence: dict,
        candidates: list,
    ):

        image_path = Path(
            image_path,
        )

        if not image_path.exists():

            return self.parser.empty(
                "Image not found.",
            )

        prompt = self.prompt_builder.build(

            evidence=evidence,

            candidates=candidates,

        )

        try:

            uploaded_image = genai.upload_file(
                path=str(
                    image_path,
                )
            )

            response = self.model.generate_content(

                [

                    prompt,

                    uploaded_image,

                ]

            )

        except Exception as e:

            return self.parser.empty(
                str(e),
            )

        text = ""

        if hasattr(
            response,
            "text",
        ):

            text = response.text

        return self.parser.parse(
            text,
        )