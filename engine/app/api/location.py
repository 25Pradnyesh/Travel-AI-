from fastapi import APIRouter

router = APIRouter()

@router.post("/locate")
def locate():
    return {"status": "coming soon"}