from fastapi import APIRouter

from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.extraction.frame_extractor import FrameExtractor
from engine.app.services.extraction.ocr_service import OCRService
from engine.app.services.ai.gemini_service import GeminiService
from engine.providers.manager import ProviderManager
from engine.app.services.ai.gemini_service import GeminiService
router = APIRouter()

pipeline = LocationPipeline()
frame_extractor = FrameExtractor()
ocr = OCRService()
gemini = GeminiService()
gemini = GeminiService()
provider = ProviderManager()


@router.post("/provider")
def provider_test():

    return provider.extract(
        "https://www.instagram.com/reel/DN2XxxY2O7-/"
    )


@router.get("/frames")
def frames():

    frames = frame_extractor.extract(
        video_path="assets/sample.mp4",
        output_dir="assets/frames",
        interval_seconds=2,
    )

    return {
        "frames": frames,
    }


@router.get("/ocr")
def test_ocr():

    text = ocr.extract_text(
        "assets/frames/frame_002.jpg"
    )

    return {
        "text": text,
    }


@router.get("/gemini")
def test_gemini():

    evidence = {
        "title": "",
        "caption": "this hike was everything. Last summer we did some day hikes in Austria. 📍Seebensee hike in Austria.",
        "ocr_text": "Seebensee Austria",
        "hashtags": [
            "seebensee",
            "austria",
            "hiking",
        ],
    }

    candidates = gemini.generate_candidates(
        evidence
    )

    return {
        "candidates": candidates,
    }

@router.get("/gemini")
def test_gemini():

    evidence = {
        "title": "",
        "caption": "Seebensee hike in Austria. Save this place for your Europe trip.",
        "ocr_text": "Austria",
        "hashtags": [
            "seebensee",
            "austria",
            "hiking",
        ],
    }

    return {
        "candidates": gemini.generate_candidates(evidence)
    }