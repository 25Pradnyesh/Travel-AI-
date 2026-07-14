from pathlib import Path
from dotenv import load_dotenv

# Load environment variables FIRST
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")

from fastapi import FastAPI
from pydantic import BaseModel

from engine.providers.manager import ProviderManager
from engine.app.pipelines.location_pipeline import LocationPipeline
from engine.app.api.test_routes import router as test_router

print("✅ test_routes imported")

app = FastAPI()

app.include_router(test_router)

extractor = ProviderManager()
pipeline = LocationPipeline()


class AnalyzeRequest(BaseModel):
    url: str


@app.get("/")
def root():
    return {
        "message": "Travel AI Engine Running 🚀"
    }


@app.post("/analyze")
def analyze(request: AnalyzeRequest):

    try:

        provider_output = extractor.extract(request.url)

        location = pipeline.run(
            metadata=provider_output["metadata"],
            video_path=provider_output["video_path"],
        )

        return {
            "success": True,
            "provider": provider_output,
            "location_pipeline": location,
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e),
        }