from fastapi import APIRouter
from pydantic import BaseModel
from services.prediction_service import predict_winner, get_all_seasons, get_all_teams

router = APIRouter()

class PredictionRequest(BaseModel):
    team1: str
    team2: str
    venue: str
    season: str = "2026"

@router.post("/predict")
def predict(req: PredictionRequest):
    return predict_winner(req.team1, req.team2, req.venue, req.season)

@router.get("/seasons")
def seasons():
    return {"seasons": get_all_seasons()}

@router.get("/teams")
def teams():
    return get_all_teams()
