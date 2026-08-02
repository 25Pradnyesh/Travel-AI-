from fastapi import APIRouter
from pydantic import BaseModel

from engine.providers.manager import ProviderManager
from engine.app.pipelines.location_pipeline import LocationPipeline

from engine.app.services.extraction.frame_extractor import FrameExtractor
from engine.app.services.ocr.ocr_service import OCRService
from engine.app.services.speech.speech_service import SpeechService
from engine.app.services.maps.google_places_service import GooglePlacesService


router = APIRouter()

provider = ProviderManager()
pipeline = LocationPipeline()

frames = FrameExtractor()
ocr = OCRService()
speech = SpeechService()
places = GooglePlacesService()


class AnalyzeRequest(BaseModel):
    reel_url: str


# ==================================================
# Full Pipeline
# ==================================================

@router.post("/analyze")
def analyze(request: AnalyzeRequest):

    provider_output = provider.extract(request.reel_url)

    return pipeline.run(
        metadata=provider_output["metadata"],
        video_path=provider_output["video_path"],
    )


# ==================================================
# Provider Test
# ==================================================

@router.post("/provider")
def provider_test():

    return provider.extract(
        "https://www.instagram.com/reel/DN2XxxY2O7-/"
    )


# ==================================================
# Frame Extraction Test
# ==================================================

@router.get("/frames")
def test_frames():

    extracted = frames.extract(
        video_path="engine/assets/sample.mp4",
        output_dir="engine/assets/frames",
        interval_seconds=2,
    )

    return {
        "frames": extracted,
    }


# ==================================================
# OCR Test
# ==================================================

@router.get("/ocr")
def test_ocr():

    text = ocr.extract_text(
        "engine/assets/frames/frame_002.jpg"
    )

    return {
        "text": text,
    }


# ==================================================
# Speech Test
# ==================================================

@router.get("/speech")
def test_speech():

    text = speech.extract(
        "engine/assets/sample.mp4"
    )

    return {
        "speech": text,
    }


# ==================================================
# Google Places Test
# ==================================================

@router.get("/places")
def test_places():

    return places.search(
        "Seebensee Austria"
    )


# ==================================================
# Health
# ==================================================

@router.get("/health")
def health():

    return {
        "status": "ok",
        "service": "Travel AI Engine",
    }