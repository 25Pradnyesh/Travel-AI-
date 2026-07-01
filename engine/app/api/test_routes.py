from fastapi import APIRouter
from engine.app.pipeline.location_pipeline import LocationPipeline

print("✅ test_routes.py loaded")

router = APIRouter()

pipeline = LocationPipeline()

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