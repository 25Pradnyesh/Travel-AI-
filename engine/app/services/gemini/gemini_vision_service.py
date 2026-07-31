from pathlib import Path

import google.generativeai as genai

from engine.app.services.gemini.vision_prompt_builder import (
    VisionPromptBuilder,
)
from engine.app.services.gemini.vision_response_parser import (
    VisionResponseParser,
)

from engine.app.services.vision.scene_classifier import (
    SceneClassifier,
)


class GeminiVisionService:

    def __init__(self):

        self.model = genai.GenerativeModel(
            "gemini-2.5-flash",
        )

        self.prompt_builder = VisionPromptBuilder()

        self.parser = VisionResponseParser()

        self.scene = SceneClassifier()

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

        # ------------------------------------------
        # Scene Analysis
        # ------------------------------------------

        scene = self.scene.classify(
            str(image_path),
        )

        prompt = self.prompt_builder.build(

            evidence=evidence,

            candidates=candidates,

        )

        prompt += f"""

Scene Analysis
--------------

Scene:
{scene.get('scene')}

Environment:
{scene.get('environment')}

Terrain:
{scene.get('terrain')}

Architecture:
{scene.get('architecture')}

Water Body:
{scene.get('water_body')}

Vegetation:
{scene.get('vegetation')}

Snow:
{scene.get('snow')}

Beach:
{scene.get('beach')}

Urban:
{scene.get('urban')}

Use this scene information while deciding the best candidate.
"""

        try:

            uploaded = genai.upload_file(
                path=str(
                    image_path,
                ),
            )

            response = self.model.generate_content(

                [

                    prompt,

                    uploaded,

                ]

            )

        except Exception as e:

            result = self.parser.empty(
                str(e),
            )

            result["scene"] = scene

            return result

        text = ""

        if hasattr(
            response,
            "text",
        ):

            text = response.text

        result = self.parser.parse(
            text,
        )

        result["scene"] = scene

        return result