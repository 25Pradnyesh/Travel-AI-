from fastapi import APIRouter

from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.services.extraction.frame_extractor import FrameExtractor

router = APIRouter()

pipeline = LocationPipeline()
frame_extractor = FrameExtractor()


@router.get("/test")
def test():

    metadata = {
        "title": "",
        "caption": "Seebensee hike in Austria. Save this place for your Europe trip.",
        "tags": [
            "seebensee",
            "austria",
            "hiking"
        ]
    }

    return pipeline.run(metadata)


@router.get("/frames")
def frames():

    frames = frame_extractor.extract(
        video_path="assets/sample.mp4",
        output_dir="assets/frames",
        interval_seconds=2,
    )

    return {
        "frames": frames
    }