from fastapi import APIRouter

from engine.providers.manager import ProviderManager

from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.extraction.frame_extractor import FrameExtractor
from engine.app.services.extraction.ocr_service import OCRService


router = APIRouter()

pipeline = LocationPipeline()
frame_extractor = FrameExtractor()
ocr = OCRService()
provider = ProviderManager()


# --------------------------------------------------
# Provider Test
# --------------------------------------------------
@router.post("/provider")
def provider_test():

    reel_url = (
        "https://www.instagram.com/reel/DN2XxxY2O7-/"
    )

    return provider.extract(reel_url)


# --------------------------------------------------
# Frame Extraction Test
# --------------------------------------------------
@router.get("/frames")
def frames():

    frame_paths = frame_extractor.extract(
        video_path="engine/assets/sample.mp4",
        output_dir="engine/assets/frames",
        interval_seconds=2,
    )

    return {
        "frames": frame_paths,
    }


# --------------------------------------------------
# OCR Test
# --------------------------------------------------
@router.get("/ocr")
def test_ocr():

    text = ocr.extract_text(
        "engine/assets/frames/frame_002.jpg"
    )

    return {
        "text": text,
    }


# --------------------------------------------------
# Pipeline Test (Manual Metadata)
# --------------------------------------------------
@router.get("/test")
def test():

    metadata = {
        "title": "",
        "caption": "Seebensee hike in Austria. Save this place for your Europe trip.",
        "tags": [
            "seebensee",
            "austria",
            "hiking",
        ],
    }

    return pipeline.run(
        metadata=metadata,
        video_path="engine/assets/sample.mp4",
    )