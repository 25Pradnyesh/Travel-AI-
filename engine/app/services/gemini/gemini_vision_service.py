import logging
import os
from pathlib import Path
from PIL import Image
from dotenv import load_dotenv

from engine.app.services.gemini.vision_prompt_builder import (
    VisionPromptBuilder,
)
from engine.app.services.gemini.vision_response_parser import (
    VisionResponseParser,
)
from engine.app.services.vision.scene_classifier import (
    SceneClassifier,
)

logger = logging.getLogger(__name__)


class GeminiVisionService:

    def __init__(self):

        env_path = (
            Path(__file__).resolve().parents[3]
            / ".env"
        )
        load_dotenv(env_path, override=True)

        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = None
        self.available = False

        if self.api_key:
            try:
                import google.generativeai as genai

                genai.configure(api_key=self.api_key)
                model_name = os.getenv("GEMINI_VISION_MODEL", os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))
                self.model = genai.GenerativeModel(
                    model_name,
                    generation_config={
                        "temperature": 0.1,
                        "max_output_tokens": 1024,
                        "response_mime_type": "application/json",
                    },
                )
                self.available = True
            except Exception as e:
                logger.warning("[GEMINI] Failed to initialize GeminiVisionService: %s", type(e).__name__)
                self.available = False

        self.prompt_builder = VisionPromptBuilder()
        self.parser = VisionResponseParser()

        try:
            self.scene = SceneClassifier()
        except Exception:
            self.scene = None

    # ==================================================
    # Verify Image
    # ==================================================

    def verify(
        self,
        image_path: str,
        evidence: dict,
        candidates: list,
    ) -> dict:

        path_obj = Path(image_path)

        if not path_obj.exists() or not path_obj.is_file():
            return self.parser.empty("Image file not found.")

        if not self.available or not self.model:
            logger.warning("[GEMINI] Vision service unavailable.")
            return self.parser.empty("Gemini Vision service unavailable.")

        # ------------------------------------------
        # Scene Analysis (optional enrichment)
        # ------------------------------------------
        scene_info = {}
        if self.scene:
            try:
                scene_info = self.scene.classify(str(path_obj))
            except Exception as e:
                logger.debug("[GEMINI] Scene classification skipped: %s", type(e).__name__)

        prompt = self.prompt_builder.build(
            evidence=evidence,
            candidates=candidates,
        )

        if scene_info:
            prompt += f"""

SCENE ANALYSIS CONTEXT:
Scene: {scene_info.get('scene', 'Unknown')}
Environment: {scene_info.get('environment', 'Unknown')}
Terrain: {scene_info.get('terrain', 'Unknown')}
Architecture: {scene_info.get('architecture', 'Unknown')}
Water Body: {scene_info.get('water_body', 'None')}
Vegetation: {scene_info.get('vegetation', 'None')}
"""

        try:
            pil_image = Image.open(path_obj)

            response = self.model.generate_content(
                [prompt, pil_image],
            )

            text = getattr(response, "text", "") or ""
            result = self.parser.parse(text)
            result["scene"] = scene_info
            return result

        except Exception as e:
            logger.error("[GEMINI] Vision verification error: %s", type(e).__name__)
            result = self.parser.empty(f"Vision error: {type(e).__name__}")
            result["scene"] = scene_info
            return result