from fastapi import FastAPI
from pydantic import BaseModel

from engine.app.services.media_extractor import MediaExtractor

app = FastAPI()


extractor = MediaExtractor()


class AnalyzeRequest(BaseModel):
    url: str


@app.get("/")
def root():
    return {
        "message": "Travel AI Engine Running 🚀"
    }


@app.post("/analyze")
def analyze(request: AnalyzeRequest):

    data = extractor.extract(request.url)

    return {
        "success": True,
        "data": data
    }