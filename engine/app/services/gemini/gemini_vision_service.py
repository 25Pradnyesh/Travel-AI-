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
                from engine.app.services.gemini.client_adapter import GeminiClientAdapter

                model_name = os.getenv("GEMINI_VISION_MODEL", os.getenv("GEMINI_MODEL", "gemini-3.5-flash"))
                if model_name in ("gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.8-flash"):
                    model_name = "gemini-3.5-flash"
                self.model = GeminiClientAdapter(
                    api_key=self.api_key,
                    model_name=model_name,
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
    # Verify Image(s)
    # ==================================================

    def _prepare_pil_image(self, img_path: Path) -> Image.Image | None:
        """Loads, downsizes to <= 768px, and compresses to JPEG q70."""
        import io
        try:
            with Image.open(img_path) as raw_img:
                raw_img = raw_img.convert("RGB")
                w, h = raw_img.size
                if max(w, h) > 768:
                    raw_img.thumbnail((768, 768), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                raw_img.save(buf, format="JPEG", quality=70, optimize=True)
                buf.seek(0)
                processed = Image.open(buf)
                processed.load()
                return processed
        except Exception as e:
            logger.warning("[GEMINI] Image optimization failed for %s: %s", img_path, e)
            return None

    def verify(
        self,
        image_path: str | list[str],
        evidence: dict,
        candidates: list,
    ) -> dict:

        scene_info: dict = {}

        # Support single path or list of frames (send <= 3 frames)
        if isinstance(image_path, list):
            valid_paths = [Path(p) for p in image_path if p and Path(p).exists() and Path(p).is_file()][:3]
        else:
            p_obj = Path(image_path) if image_path else None
            valid_paths = [p_obj] if p_obj and p_obj.exists() and p_obj.is_file() else []

        if not valid_paths:
            return self.parser.empty("Image file not found.")

        from engine.app.services.gemini.gemini_counter import gemini_counter

        if not self.available or not self.model:
            logger.warning("[GEMINI] Vision service unavailable.")
            return self.parser.empty("Gemini Vision service unavailable.")

        if gemini_counter.is_quota_exhausted():
            logger.warning("[GEMINI] Vision quota exhausted. Skipping.")
            result = self.parser.empty("Unverified (vision skipped)")
            result["status"] = "Unverified (vision skipped)"
            result["scene"] = scene_info
            return result

        # ------------------------------------------
        # Scene Analysis (optional enrichment)
        # ------------------------------------------
        if self.scene:
            try:
                scene_info = self.scene.classify(str(valid_paths[0]))
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

        # Prepare up to 3 compressed frames
        pil_images = []
        for vp in valid_paths:
            prepared = self._prepare_pil_image(vp)
            if prepared is not None:
                pil_images.append(prepared)

        if not pil_images:
            return self.parser.empty("Failed to prepare images.")

        try:
            content_payload = [prompt] + pil_images
            try:
                response = self.model.generate_content(
                    content_payload,
                    request_options={"timeout": 10.0},
                )
            except TypeError:
                response = self.model.generate_content(
                    content_payload,
                )
            gemini_counter.increment()

            text = getattr(response, "text", "") or ""
            result = self.parser.parse(text)
            result["scene"] = scene_info
            return result

        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "resourceexhausted" in str(type(e)).lower() or "deadline" in err_str or "timeout" in err_str:
                logger.warning("[GEMINI] Vision 429/timeout/quota: %s", e)
                gemini_counter.mark_quota_exhausted()
                result = self.parser.empty("Unverified (vision skipped)")
                result["status"] = "Unverified (vision skipped)"
                result["scene"] = scene_info
                return result
            logger.error("[GEMINI] Vision verification error: %s", type(e).__name__)
            result = self.parser.empty("Unverified (vision skipped)")
            result["status"] = "Unverified (vision skipped)"
            result["scene"] = scene_info
            return result