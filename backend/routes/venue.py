from fastapi import APIRouter
from services.venue_service import get_venue_stats, get_all_venues

router = APIRouter()

@router.get("/venues")
def list_venues():
    return {"venues": get_all_venues()}

@router.get("/venue/{venue_name:path}")
def venue_stats(venue_name: str):
    return get_venue_stats(venue_name)
