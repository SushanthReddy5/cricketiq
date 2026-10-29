from fastapi import APIRouter
from pydantic import BaseModel
from services.winprob_service import calculate_win_probability

router = APIRouter()

class WinProbRequest(BaseModel):
    target: int
    current_score: int
    wickets_fallen: int
    overs_completed: float

@router.post("/winprob")
def win_probability(req: WinProbRequest):
    return calculate_win_probability(
        req.target, req.current_score,
        req.wickets_fallen, req.overs_completed
    )
