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
    # Analyze Frames
    # ==================================================

    def analyze(
        self,
        frame_paths: list,
        evidence: dict,
        candidates: list,
    ):

        if not frame_paths:

            return self.parser.empty(
                "No frames provided.",
            )

        prompt = self.prompt_builder.build(

            evidence=evidence,

            candidates=candidates,

        )

        uploaded_frames = []

        for frame in frame_paths:

            frame = Path(frame)

            if not frame.exists():
                continue

            try:

                uploaded_frames.append(

                    genai.upload_file(
                        path=str(frame),
                    )

                )

            except Exception:

                continue

        if not uploaded_frames:

            return self.parser.empty(
                "No valid frames uploaded.",
            )

        try:

            response = self.model.generate_content(

                [

                    prompt,

                    *uploaded_frames,

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