from fastapi import APIRouter
from services.matchup_service import get_matchup, get_all_players

router = APIRouter()

@router.get("/matchup")
def matchup(batter: str, bowler: str):
    return get_matchup(batter, bowler)

@router.get("/players")
def players():
    return {"players": get_all_players()}
