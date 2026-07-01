from fastapi import FastAPI
from pydantic import BaseModel

from engine.app.providers.provider_manager import ProviderManager
from engine.app.pipeline.location_pipeline import LocationPipeline
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
        metadata = extractor.extract(request.url)

        location = pipeline.run(metadata["metadata"])

        return {
            "success": True,
            "metadata": metadata,
            "location_pipeline": location
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }