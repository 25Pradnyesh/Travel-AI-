from fastapi import APIRouter
from pydantic import BaseModel

from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.providers.manager import ProviderManager
from engine.app.services.extraction.frame_extractor import FrameExtractor
from engine.app.services.ocr.ocr_service import OCRService
from engine.app.services.speech.speech_service import SpeechService
from engine.app.services.maps.google_places_service import GooglePlacesService


router = APIRouter()


pipeline = LocationPipeline()

provider = ProviderManager()

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
def analyze(
    request: AnalyzeRequest,
):

    return pipeline.process(
        request.reel_url,
    )


# ==================================================
# Provider
# ==================================================


@router.post("/provider")
def provider_test():

    return provider.extract(

        "https://www.instagram.com/reel/DN2XxxY2O7-/"

    )


# ==================================================
# Frame Extraction
# ==================================================


@router.get("/frames")
def test_frames():

    extracted = frames.extract(

        video_path="assets/sample.mp4",

        output_dir="assets/frames",

        interval_seconds=2,

    )

    return {

        "frames": extracted,

    }


# ==================================================
# OCR
# ==================================================


@router.get("/ocr")
def test_ocr():

    text = ocr.extract_text(

        "assets/frames/frame_002.jpg"

    )

    return {

        "text": text,

    }


# ==================================================
# Speech
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
# Google Places
# ==================================================


@router.get("/places")
def test_places():

    return places.search(

        "Seebensee Austria"

    )


# ==================================================
# Health Check
# ==================================================


@router.get("/health")
def health():

    return {

        "status": "ok",

        "service": "Travel AI",

    }