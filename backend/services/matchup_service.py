import pandas as pd
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")
master = pd.read_parquet(os.path.join(MODELS_DIR, "master.parquet"))

def get_matchup(batter: str, bowler: str):
    df = master[
        (master["striker"] == batter) &
        (master["bowler"] == bowler)
    ].copy()

    if len(df) == 0:
        return {"error": f"No matchup data found for {batter} vs {bowler}"}

    balls_faced = len(df)
    runs_scored = int(df["runs_off_bat"].sum())
    dismissals = int(df["is_wicket"].sum())
    strike_rate = round(runs_scored / balls_faced * 100, 1) if balls_faced > 0 else 0
    dot_balls = int((df["runs_off_bat"] == 0).sum())
    boundaries = int(((df["runs_off_bat"] == 4) | (df["runs_off_bat"] == 6)).sum())
    fours = int((df["runs_off_bat"] == 4).sum())
    sixes = int((df["runs_off_bat"] == 6).sum())

    return {
        "batter": batter,
        "bowler": bowler,
        "balls_faced": balls_faced,
        "runs_scored": runs_scored,
        "dismissals": dismissals,
        "strike_rate": strike_rate,
        "dot_ball_pct": round(dot_balls / balls_faced * 100, 1),
        "boundary_pct": round(boundaries / balls_faced * 100, 1),
        "fours": fours,
        "sixes": sixes,
        "bowler_economy": round(runs_scored / (balls_faced / 6), 2) if balls_faced > 0 else 0
    }

def get_all_players():
    batters = master["striker"].dropna().unique().tolist()
    bowlers = master["bowler"].dropna().unique().tolist()
    all_players = sorted(set(batters + bowlers))
    return all_players
