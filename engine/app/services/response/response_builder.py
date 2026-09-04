import logging
import os
import urllib.parse
from typing import Any

from engine.domain.schemas.responses import (
    AnalysisResponse,
    BestGuess,
    DestinationPhoto,
    GeminiInfo,
    NearbyPlace,
)
from engine.app.services.travel.travel_intelligence_service import (
    TravelIntelligenceService,
)

logger = logging.getLogger(__name__)


class ResponseBuilder:

    def __init__(self):
        self.travel_service = TravelIntelligenceService()
        self.api_key = os.getenv("GOOGLE_PLACES_API_KEY", "")

    # ==================================================
    # Build Coordinates
    # ==================================================

    def normalize_coordinates(
        self,
        lat_val: Any,
        lng_val: Any,
    ) -> tuple[float | None, float | None]:

        try:
            if lat_val is None or lng_val is None:
                return None, None

            lat = float(lat_val)
            lng = float(lng_val)

            if -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0:
                return round(lat, 6), round(lng, 6)

            return None, None
        except (ValueError, TypeError):
            return None, None

    # ==================================================
    # Build Maps URL
    # ==================================================

    def build_maps_url(
        self,
        place: dict,
        lat: float | None,
        lng: float | None,
        place_id: str,
    ) -> str:

        existing_url = place.get("google_maps_url") or place.get("maps_url") or ""
        if existing_url:
            return str(existing_url).strip()

        if lat is not None and lng is not None:
            if place_id:
                return (
                    f"https://www.google.com/maps/search/?api=1"
                    f"&query={lat},{lng}&query_place_id={urllib.parse.quote(place_id)}"
                )
            return f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"

        name = place.get("travel_name") or place.get("display_name") or place.get("name") or ""
        country = place.get("country", "")
        if name:
            query = f"{name} {country}".strip()
            return f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(query)}"

        return ""

    # ==================================================
    # Build Photos
    # ==================================================

    def normalize_photos(
        self,
        raw_photos: list | None,
    ) -> list[DestinationPhoto]:

        if not raw_photos or not isinstance(raw_photos, list):
            return []

        normalized = []

        for item in raw_photos:
            if isinstance(item, str):
                item_str = item.strip()
                if item_str:
                    normalized.append(DestinationPhoto(url=item_str))
                continue

            if not isinstance(item, dict):
                continue

            url = item.get("url") or ""
            name = item.get("name") or ""

            # If Google photo reference name is present, construct media URL
            if not url and name:
                if self.api_key:
                    url = (
                        f"https://places.googleapis.com/v1/{name}/media"
                        f"?key={self.api_key}&maxHeightPx=1000&maxWidthPx=1000"
                    )
                else:
                    url = f"https://places.googleapis.com/v1/{name}/media?maxHeightPx=1000&maxWidthPx=1000"

            if not url:
                continue

            width = item.get("width") or item.get("widthPx")
            height = item.get("height") or item.get("heightPx")

            try:
                width = int(width) if width is not None else None
            except (ValueError, TypeError):
                width = None

            try:
                height = int(height) if height is not None else None
            except (ValueError, TypeError):
                height = None

            author = item.get("author") or item.get("authorAttributions")

            normalized.append(
                DestinationPhoto(
                    url=url,
                    width=width,
                    height=height,
                    author=author,
                )
            )

        return normalized

    # ==================================================
    # Build "Why this place"
    # ==================================================

    def build_why_explanation(
        self,
        place: dict,
        gemini_reason: str,
        verification_status: str,
    ) -> str:

        # 1. If Gemini verified with a meaningful reason, use it
        if gemini_reason and len(gemini_reason) > 10 and verification_status in ("VERIFIED", "PARTIAL"):
            return gemini_reason.strip()

        # 2. Check matched evidence sources from scoring
        matched_sources = place.get("matched_sources") or []
        if matched_sources:
            sources_str = ", ".join(sorted(str(s).upper() for s in matched_sources))
            return f"Verified from Reel's {sources_str} and Google Places location data."

        # 3. Fallback
        return "Top scoring travel destination matching Reel context and Google Places data."

    # ==================================================
    # Build Travel Intelligence
    # ==================================================

    def build_travel_intelligence(
        self,
        place: dict,
    ) -> dict[str, Any]:

        try:
            # Ensure travel intelligence is enriched on the place
            enriched = self.travel_service.enrich(place)

            return {
                "category": enriched.get("category", "Destination"),
                "category_emoji": enriched.get("category_emoji", "📍"),
                "best_season": enriched.get("best_season", "All Year"),
                "peak_months": enriched.get("peak_months", []),
                "shoulder_months": enriched.get("shoulder_months", []),
                "avoid_months": enriched.get("avoid_months", []),
                "budget_level": enriched.get("budget_level", "Moderate"),
                "estimated_daily_budget": enriched.get("estimated_daily_budget", "$100 - $200"),
                "currency": enriched.get("currency", "USD"),
                "recommended_trip_days": enriched.get("recommended_trip_days", "1-3 Days"),
                "travel_tips": enriched.get("travel_tips", []),
                "activities": enriched.get("activities", []),
                "packing_list": enriched.get("packing_list", {}),
                "timing": enriched.get("timing", {}),
                "sample_itinerary": enriched.get("sample_itinerary", []),
                "travel_summary": enriched.get("travel_summary", ""),
            }

        except Exception as e:
            logger.warning("[RESPONSE] Travel intelligence enrichment failed: %s", type(e).__name__)
            return {}

    # ==================================================
    # Build Nearby Places
    # ==================================================

    def build_nearby_places(
        self,
        place: dict,
    ) -> list[NearbyPlace]:

        nearby_data = place.get("nearby") or {}
        normalized = []
        seen_ids = set()

        categories = [
            ("must_visit", "Attraction"),
            ("nature", "Nature"),
            ("food", "Food & Drink"),
            ("stay", "Lodging"),
            ("transport", "Transport"),
            ("shopping", "Shopping"),
        ]

        for cat_key, cat_label in categories:
            items = nearby_data.get(cat_key, [])
            if not isinstance(items, list):
                continue

            for item in items:
                if not isinstance(item, dict):
                    continue

                place_id = item.get("id") or item.get("place_id") or ""
                name = item.get("name") or item.get("display_name") or ""
                if not name:
                    continue

                # Deduplicate by place_id or name
                dedup_key = place_id if place_id else name.lower()
                if dedup_key in seen_ids:
                    continue
                seen_ids.add(dedup_key)

                lat, lng = self.normalize_coordinates(
                    item.get("latitude"),
                    item.get("longitude"),
                )

                rating = float(item.get("rating") or 0.0)
                user_ratings = int(item.get("user_rating_count") or item.get("user_ratings_total") or 0)
                types = [str(t) for t in (item.get("types") or []) if t]
                maps_url = item.get("google_maps_url") or item.get("maps_url") or ""

                distance_km = item.get("distance_km")
                try:
                    distance_km = round(float(distance_km), 2) if distance_km is not None else None
                except (ValueError, TypeError):
                    distance_km = None

                normalized.append(
                    NearbyPlace(
                        place_id=place_id,
                        name=name,
                        formatted_address=item.get("address") or item.get("formatted_address") or "",
                        latitude=lat,
                        longitude=lng,
                        rating=rating,
                        user_ratings_total=user_ratings,
                        types=types,
                        distance_km=distance_km,
                        maps_url=maps_url,
                        category=cat_label,
                    )
                )

        return normalized

    # ==================================================
    # Build Best Guess
    # ==================================================

    def build_best_guess(
        self,
        winner: dict,
        gemini_result: dict | None,
    ) -> BestGuess:

        place = winner.get("place", winner)

        place_id = place.get("place_id") or place.get("id") or ""
        name = (
            place.get("travel_name")
            or place.get("display_name")
            or place.get("name")
            or "Unknown Destination"
        )
        formatted_address = (
            place.get("formatted_address")
            or place.get("address")
            or ""
        )

        country = place.get("country") or None
        city = place.get("city") or None
        region = place.get("region") or place.get("state") or None

        lat, lng = self.normalize_coordinates(
            place.get("latitude"),
            place.get("longitude"),
        )

        rating = float(place.get("rating") or 0.0)
        user_ratings = int(
            place.get("user_rating_count")
            or place.get("user_ratings_total")
            or 0
        )
        types = [str(t) for t in (place.get("types") or []) if t]

        maps_url = self.build_maps_url(place, lat, lng, place_id)
        photos = self.normalize_photos(place.get("photos"))

        # Confidence handling
        raw_score = winner.get("score")
        if raw_score is None:
            raw_score = place.get("score", 0)
        try:
            score_val = float(raw_score)
            if score_val <= 1.0 and score_val > 0.0:
                confidence_int = int(round(score_val * 100))
            else:
                confidence_int = max(0, min(100, int(round(score_val))))
        except (ValueError, TypeError):
            confidence_int = 0

        confidence_level = str(
            winner.get("confidence")
            or place.get("confidence")
            or "LOW"
        )

        verification_status = str(
            (gemini_result.get("verification_status") if gemini_result else None)
            or place.get("verification_status")
            or "FAILED"
        ).upper()

        gemini_conf = 0.0
        if gemini_result and gemini_result.get("confidence") is not None:
            try:
                gemini_conf = float(gemini_result["confidence"])
                if gemini_conf > 1.0:
                    gemini_conf = round(gemini_conf / 100.0, 4)
            except (ValueError, TypeError):
                gemini_conf = 0.0
        elif place.get("gemini_confidence") is not None:
            try:
                gemini_conf = float(place["gemini_confidence"])
                if gemini_conf > 1.0:
                    gemini_conf = round(gemini_conf / 100.0, 4)
            except (ValueError, TypeError):
                gemini_conf = 0.0

        gemini_reason = str(
            (gemini_result.get("reason") if gemini_result else None)
            or place.get("gemini_reason")
            or ""
        )

        why = self.build_why_explanation(
            place=place,
            gemini_reason=gemini_reason,
            verification_status=verification_status,
        )

        return BestGuess(
            place_id=place_id,
            name=name,
            formatted_address=formatted_address,
            country=country,
            city=city,
            region=region,
            latitude=lat,
            longitude=lng,
            rating=rating,
            user_ratings_total=user_ratings,
            types=types,
            photos=photos,
            maps_url=maps_url,
            confidence=confidence_int,
            confidence_level=confidence_level,
            verification_status=verification_status,
            gemini_confidence=gemini_conf,
            gemini_reason=gemini_reason,
            why=why,
        )

    # ==================================================
    # Build Canonical Successful Response
    # ==================================================

    def build(
        self,
        winner: dict,
        gemini_result: dict | None = None,
        stage: str = "completed",
        performance: dict | None = None,
    ) -> AnalysisResponse:

        logger.info("[RESPONSE] Building final destination response")

        best_guess = self.build_best_guess(
            winner=winner,
            gemini_result=gemini_result,
        )

        logger.info("[RESPONSE] Destination: %s", best_guess.name)
        logger.info("[RESPONSE] Confidence: %d (%s)", best_guess.confidence, best_guess.confidence_level)
        logger.info("[RESPONSE] Verification: %s", best_guess.verification_status)

        place = winner.get("place", winner)

        travel_intelligence = self.build_travel_intelligence(place)
        logger.info("[RESPONSE] Travel intelligence: %s", "attached" if travel_intelligence else "empty")

        nearby_places = self.build_nearby_places(place)
        logger.info("[RESPONSE] Nearby places: %d", len(nearby_places))

        # Gemini info
        gemini_info = GeminiInfo()
        if gemini_result:
            gemini_status = gemini_result.get("verification_status", "SKIPPED")
            gemini_conf = 0.0
            if gemini_result.get("confidence") is not None:
                try:
                    gemini_conf = float(gemini_result["confidence"])
                    if gemini_conf > 1.0:
                        gemini_conf = round(gemini_conf / 100.0, 4)
                except (ValueError, TypeError):
                    gemini_conf = 0.0

            gemini_info = GeminiInfo(
                used=gemini_status in ("VERIFIED", "PARTIAL"),
                status=gemini_status,
                confidence=gemini_conf,
                reason=gemini_result.get("reason", ""),
                vision=gemini_result.get("vision"),
                scene=(gemini_result.get("vision") or {}).get("scene") if isinstance(gemini_result.get("vision"), dict) else None,
            )

        response = AnalysisResponse(
            success=True,
            best_guess=best_guess,
            travel_intelligence=travel_intelligence,
            nearby_places=nearby_places,
            gemini=gemini_info,
            stage=stage,
            performance=performance,
        )

        logger.info("[RESPONSE] Response validation: passed")
        return response

    # ==================================================
    # Build Unresolved / Failure Response
    # ==================================================

    def build_unresolved(
        self,
        stage: str = "failed",
        error: str = "No destination could be verified from the provided Reel.",
        performance: dict | None = None,
    ) -> AnalysisResponse:

        logger.info("[RESPONSE] Building unresolved destination response: %s", error)

        return AnalysisResponse(
            success=False,
            best_guess=None,
            travel_intelligence={},
            nearby_places=[],
            gemini=GeminiInfo(
                used=False,
                status="FAILED",
                confidence=0.0,
                reason=error,
            ),
            stage=stage,
            performance=performance,
            error=error,
        )
