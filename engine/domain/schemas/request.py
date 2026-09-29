"""
Travel AI — Request Schemas and Input Contracts
Stage 12: Production API Hardening & Security
"""

from pydantic import BaseModel, Field, model_validator
from engine.core.security import validate_instagram_url, MAX_URL_LENGTH


class AnalyzeRequest(BaseModel):
    """
    Standard request payload for POST /analyze.
    Supports both 'reel_url' and 'url' attributes for backward compatibility.
    """
    reel_url: str | None = Field(default=None, max_length=MAX_URL_LENGTH, description="Target Instagram Reel or Post URL.")
    url: str | None = Field(default=None, max_length=MAX_URL_LENGTH, description="Alias for reel_url.")

    @property
    def target_url(self) -> str:
        return (self.reel_url or self.url or "").strip()

    @model_validator(mode="after")
    def validate_input(self):
        url = self.target_url
        if not url:
            raise ValueError("Enter a valid public Instagram Reel URL.")

        is_valid, normalized, err = validate_instagram_url(url)
        if not is_valid:
            raise ValueError("Enter a valid public Instagram Reel URL.")

        return self
