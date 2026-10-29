import pandas as pd
import numpy as np
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")
master = pd.read_parquet(os.path.join(MODELS_DIR, "master.parquet"))

inn2       = master[master["innings"] == 2].copy()
inn2_teams = inn2.groupby("match_id")["batting_team"].first().reset_index()
inn2_teams.columns = ["match_id", "chasing_team"]
match_outcomes = master.drop_duplicates("match_id")[["match_id","winner"]].copy()
chase_results  = inn2_teams.merge(match_outcomes, on="match_id")
chase_results["chase_won"] = (chase_results["chasing_team"] == chase_results["winner"]).astype(int)

inn1_targets = master[master["innings"] == 1].groupby("match_id")["total_runs"].sum().reset_index()
inn1_targets.columns = ["match_id", "target"]
inn1_targets["target"] += 1
chase_results = chase_results.merge(inn1_targets, on="match_id", how="left")

def calculate_win_probability(target, current_score, wickets_fallen, overs_completed):
    """overs_completed is a float like 6.0 or 10.3 (overs.balls)."""
    # Convert overs.balls to total balls
    overs_int   = int(overs_completed)
    balls_part  = min(6, round((overs_completed - overs_int) * 10))
    balls_bowled = overs_int * 6 + balls_part
    balls_bowled = min(balls_bowled, 120)

    runs_needed       = target - current_score
    balls_remaining   = 120 - balls_bowled
    wickets_remaining = 10 - wickets_fallen
    overs_done        = balls_bowled / 6
    overs_remaining   = balls_remaining / 6

    if runs_needed <= 0:
        return {"batting_team_win_prob":100.0,"bowling_team_win_prob":0.0,
                "runs_needed":0,"balls_remaining":balls_remaining,
                "wickets_remaining":wickets_remaining,"required_run_rate":0.0,
                "current_run_rate":round(current_score/overs_done,2) if overs_done>0 else 0,
                "status":"batting_team_won"}

    if balls_remaining <= 0 or wickets_remaining <= 0:
        return {"batting_team_win_prob":0.0,"bowling_team_win_prob":100.0,
                "runs_needed":runs_needed,"balls_remaining":balls_remaining,
                "wickets_remaining":wickets_remaining,"required_run_rate":0.0,
                "current_run_rate":0.0,"status":"bowling_team_won"}

    rrr = runs_needed / overs_remaining if overs_remaining > 0 else 999
    crr = current_score / overs_done if overs_done > 0 else 0

    # Historical similarity lookup using exact cumulative match state up to overs_completed
    balls_mask = (inn2["over"] < overs_int) | ((inn2["over"] == overs_int) & (inn2["ball_in_over"] <= balls_part))
    over_data  = inn2[balls_mask]
    hist_prob  = None

    if len(over_data) >= 50:
        over_scores = over_data.groupby("match_id").agg(
            score   = ("total_runs", "sum"),
            wickets = ("is_wicket", "sum")
        ).reset_index()
        merged = over_scores.merge(chase_results, on="match_id")

        score_tol  = max(16, current_score * 0.16)
        wicket_tol = 1
        target_tol = max(24, target * 0.16)

        similar = merged[
            (abs(merged["score"] - current_score) <= score_tol) &
            (abs(merged["wickets"] - wickets_fallen) <= wicket_tol) &
            (abs(merged["target"] - target) <= target_tol)
        ]
        if len(similar) < 8:
            similar = merged[
                (abs(merged["score"] - current_score) <= score_tol * 1.4) &
                (abs(merged["wickets"] - wickets_fallen) <= 2) &
                (abs(merged["target"] - target) <= target_tol * 1.4)
            ]

        if len(similar) >= 5:
            hist_prob = float(similar["chase_won"].mean())

    # Physics model — properly calibrated
    # RRR score: exponential penalty above ~8
    if rrr <= 6:    rrr_score = 1.0
    elif rrr <= 8:  rrr_score = 1.0 - (rrr - 6) * 0.08
    elif rrr <= 10: rrr_score = 0.84 - (rrr - 8) * 0.12
    elif rrr <= 13: rrr_score = 0.60 - (rrr - 10) * 0.11
    elif rrr <= 16: rrr_score = 0.27 - (rrr - 13) * 0.07
    else:           rrr_score = max(0.01, 0.06 - (rrr - 16) * 0.01)

    # Wicket score
    if   wickets_remaining >= 9: wkt_score = 1.00
    elif wickets_remaining >= 8: wkt_score = 0.95
    elif wickets_remaining >= 7: wkt_score = 0.88
    elif wickets_remaining >= 6: wkt_score = 0.78
    elif wickets_remaining >= 5: wkt_score = 0.65
    elif wickets_remaining >= 4: wkt_score = 0.50
    elif wickets_remaining >= 3: wkt_score = 0.35
    elif wickets_remaining == 2: wkt_score = 0.18
    else:                        wkt_score = 0.06

    balls_score = min(1.0, balls_remaining / 72)
    momentum    = min(1.0, crr / rrr) if rrr > 0 else 1.0

    physics_prob = (
        0.42 * rrr_score +
        0.33 * wkt_score +
        0.15 * balls_score +
        0.10 * momentum
    )
    physics_prob = max(0.01, min(0.99, physics_prob))

    if hist_prob is not None:
        final_prob = 0.40 * hist_prob + 0.60 * physics_prob
    else:
        final_prob = physics_prob

    batting_prob = round(final_prob * 100, 1)
    bowling_prob = round((1 - final_prob) * 100, 1)

    return {
        "batting_team_win_prob":  batting_prob,
        "bowling_team_win_prob":  bowling_prob,
        "runs_needed":            runs_needed,
        "balls_remaining":        balls_remaining,
        "wickets_remaining":      wickets_remaining,
        "required_run_rate":      round(rrr, 2),
        "current_run_rate":       round(crr, 2),
        "overs_completed":        overs_completed,
        "status":                 "in_progress"
    }
