from fastapi import APIRouter
from services.phase_service import get_phase_stats

router = APIRouter()

@router.get("/phase")
def phase(player: str, role: str = "batter"):
    return get_phase_stats(player, role)
