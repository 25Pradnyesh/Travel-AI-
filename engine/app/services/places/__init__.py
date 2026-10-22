"""
Places provider module for Travel AI Engine.
Supports OSM (keyless, zero cost) and Google Places (disabled by default).
"""

from engine.app.services.places.base import PlacesProvider
from engine.app.services.places.factory import get_places_provider

__all__ = ["PlacesProvider", "get_places_provider"]
