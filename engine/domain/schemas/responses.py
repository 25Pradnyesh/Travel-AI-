from typing import Any
from pydantic import BaseModel, Field


class DestinationPhoto(BaseModel):
    url: str = ""
    width: int | None = None
    height: int | None = None
    author: list[str] | str | None = None


class BestGuess(BaseModel):
    place_id: str = ""
    name: str = ""
    formatted_address: str = ""
    country: str | None = None
    city: str | None = None
    region: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rating: float = 0.0
    user_ratings_total: int = 0
    types: list[str] = Field(default_factory=list)
    photos: list[DestinationPhoto] = Field(default_factory=list)
    maps_url: str = ""
    confidence: int = 0
    confidence_level: str = "LOW"
    verification_status: str = "FAILED"
    gemini_confidence: float = 0.0
    gemini_reason: str = ""
    why: str = ""


class NearbyPlace(BaseModel):
    place_id: str = ""
    name: str = ""
    formatted_address: str = ""
    latitude: float | None = None
    longitude: float | None = None
    rating: float = 0.0
    user_ratings_total: int = 0
    types: list[str] = Field(default_factory=list)
    distance_km: float | None = None
    maps_url: str = ""
    category: str = ""


class GeminiInfo(BaseModel):
    used: bool = False
    status: str = "SKIPPED"
    confidence: float = 0.0
    reason: str = ""
    vision: dict | None = None
    scene: dict | None = None


class AnalysisResponse(BaseModel):
    success: bool = False
    best_guess: BestGuess | None = None
    travel_intelligence: dict[str, Any] = Field(default_factory=dict)
    nearby_places: list[NearbyPlace] = Field(default_factory=list)
    gemini: GeminiInfo = Field(default_factory=GeminiInfo)
    stage: str | None = None
    performance: dict[str, Any] | None = None
    error: str | None = None
