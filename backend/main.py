import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import prediction, venue, matchup, phase, toss, winprob

app = FastAPI(title="CricketIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prediction.router, prefix="/api", tags=["Prediction"])
app.include_router(venue.router,      prefix="/api", tags=["Venue"])
app.include_router(matchup.router,    prefix="/api", tags=["Matchup"])
app.include_router(phase.router,      prefix="/api", tags=["Phase"])
app.include_router(toss.router,       prefix="/api", tags=["Toss"])
app.include_router(winprob.router,    prefix="/api", tags=["WinProb"])

@app.get("/")
def root():
    return {"message": "CricketIQ API is running 🏏"}
