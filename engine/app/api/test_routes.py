import os
from fastapi import APIRouter, HTTPException, status

router = APIRouter()


def check_dev_mode():
    """
    AUDIT-002: Prevents diagnostic test routes from running outside development environments.
    """
    env = os.getenv("ENVIRONMENT", "development").strip().lower()
    if env not in ("development", "dev", "test"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Diagnostic test routes are disabled outside development environment.",
        )


def get_provider():
    from engine.providers.manager import ProviderManager
    return ProviderManager()


def get_frames():
    from engine.app.services.extraction.frame_extractor import FrameExtractor
    return FrameExtractor()


def get_ocr():
    from engine.app.services.ocr.ocr_service import OCRService
    return OCRService()


def get_speech():
    from engine.app.services.speech.speech_service import SpeechService
    return SpeechService()


def get_places():
    from engine.app.services.places.factory import get_places_provider
    return get_places_provider()



# ==================================================
# Provider Test
# ==================================================

@router.post("/provider")
def provider_test():
    check_dev_mode()
    return get_provider().extract(
        "https://www.instagram.com/reel/DN2XxxY2O7-/"
    )


# ==================================================
# Frame Extraction Test
# ==================================================

@router.get("/frames")
def test_frames():
    check_dev_mode()
    extracted = get_frames().extract(
        video_path="engine/assets/sample.mp4",
        output_dir="engine/assets/frames",
        interval_seconds=2,
    )

    return {
        "frames": extracted,
    }


# ==================================================
# OCR Test
# ==================================================

@router.get("/ocr")
def test_ocr():
    check_dev_mode()
    text = get_ocr().extract_text(
        "engine/assets/frames/frame_002.jpg"
    )

    return {
        "text": text,
    }


# ==================================================
# Speech Test
# ==================================================

@router.get("/speech")
def test_speech():
    check_dev_mode()
    text = get_speech().extract(
        "engine/assets/sample.mp4"
    )

    return {
        "speech": text,
    }


# ==================================================
# Places Test
# ==================================================

@router.get("/places")
def test_places():
    check_dev_mode()
    provider = get_places()
    if not provider.is_available:
        return {
            "status": "disabled",
            "message": f"Place lookup is unavailable right now ({provider.name} provider not configured)",
            "results": [],
        }

    return provider.search(
        "Seebensee Austria"
    )