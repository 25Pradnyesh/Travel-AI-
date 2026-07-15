from fastapi import APIRouter

from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.extraction.frame_extractor import FrameExtractor
from engine.app.services.extraction.ocr_service import OCRService
from engine.app.services.ai.gemini_service import GeminiService
from engine.providers.manager import ProviderManager
from engine.app.services.maps.google_places_service import GooglePlacesService
from engine.app.services.extraction.speech_service import SpeechService


router = APIRouter()

pipeline = LocationPipeline()
frame_extractor = FrameExtractor()
ocr = OCRService()
gemini = GeminiService()
provider = ProviderManager()
places = GooglePlacesService()
speech = SpeechService()

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


@router.get("/places")
def test_places():

    return places.search(
        "Seebensee Austria"
    )

@router.get("/speech")
def test_speech():

    text = speech.extract(
        "engine/assets/sample.mp4"
    )

    return {
        "speech": text
    }