"""
Compatibility alias module for GooglePlacesService.
Allows importing from either engine.app.services.location.google_places_service
or engine.app.services.maps.google_places_service.
"""
from engine.app.services.maps.google_places_service import GooglePlacesService

__all__ = ["GooglePlacesService"]
