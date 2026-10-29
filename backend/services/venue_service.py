import pandas as pd
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")
master = pd.read_parquet(os.path.join(MODELS_DIR, "master.parquet"))

def get_venue_stats(venue: str):
    df = master[master["venue"] == venue].copy()
    if len(df) == 0:
        return {"error": "Venue not found"}

    match_ids = df["match_id"].unique()
    match_info = df.drop_duplicates("match_id")

    # Average 1st innings total
    inn1 = df[df["innings"] == 1].groupby("match_id")["total_runs"].sum()
    avg_first_innings = round(float(inn1.mean()), 1) if len(inn1) > 0 else 0

    # Defend vs chase win %
    total_matches = len(match_ids)
    bat_first_wins = 0
    chase_wins = 0

    for _, row in match_info.iterrows():
        match_balls = df[df["match_id"] == row["match_id"]]
        inn1_team = match_balls[match_balls["innings"] == 1]["batting_team"].iloc[0] if len(match_balls[match_balls["innings"] == 1]) > 0 else None
        if inn1_team and row["winner"] != "Unknown":
            if row["winner"] == inn1_team:
                bat_first_wins += 1
            else:
                chase_wins += 1

    # Pace vs Spin wickets
    pace_keywords = ["pace", "fast"]
    all_wickets = df[df["is_wicket"] == 1]
    total_wickets = len(all_wickets)

    # Approximate: use over number — pace bowlers typically bowl in powerplay & death
    powerplay_wickets = len(all_wickets[all_wickets["over"] < 6])
    death_wickets = len(all_wickets[all_wickets["over"] >= 15])
    middle_wickets = total_wickets - powerplay_wickets - death_wickets

    defend_pct = round(bat_first_wins / total_matches * 100, 1) if total_matches > 0 else 50
    chase_pct = round(chase_wins / total_matches * 100, 1) if total_matches > 0 else 50

    return {
        "venue": venue,
        "total_matches": total_matches,
        "avg_first_innings_total": avg_first_innings,
        "bat_first_win_pct": defend_pct,
        "chase_win_pct": chase_pct,
        "wickets_by_phase": {
            "powerplay": powerplay_wickets,
            "middle": middle_wickets,
            "death": death_wickets
        },
        "toss_stats": {
            "bat_chosen": int((match_info["toss_decision"] == "bat").sum()),
            "field_chosen": int((match_info["toss_decision"] == "field").sum())
        }
    }

def get_all_venues():
    return sorted(master["venue"].unique().tolist())
