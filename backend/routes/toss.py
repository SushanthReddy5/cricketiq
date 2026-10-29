from fastapi import APIRouter
from services.toss_service import get_toss_analysis, get_toss_by_venue

router = APIRouter()

@router.get("/toss")
def toss(venue: str = "all"):
    return get_toss_analysis(venue)

@router.get("/toss/all-venues")
def toss_all_venues():
    return {"data": get_toss_by_venue()}
