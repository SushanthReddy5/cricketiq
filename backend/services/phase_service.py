import pandas as pd
import os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")
master = pd.read_parquet(os.path.join(MODELS_DIR, "master.parquet"))

PHASES = {
    "powerplay": (0, 5),
    "middle":    (6, 14),
    "death":     (15, 19)
}

def get_phase_stats(player: str, role: str = "batter"):
    result = {}

    for phase_name, (start, end) in PHASES.items():
        phase_df = master[
            (master["over"] >= start) & (master["over"] <= end)
        ]

        if role == "batter":
            df = phase_df[phase_df["striker"] == player]
            if len(df) == 0:
                result[phase_name] = {"no_data": True}
                continue

            balls = len(df)
            runs = int(df["runs_off_bat"].sum())
            fours = int((df["runs_off_bat"] == 4).sum())
            sixes = int((df["runs_off_bat"] == 6).sum())
            boundaries = fours + sixes
            dismissals = int(df["is_wicket"].sum())

            result[phase_name] = {
                "balls": balls,
                "runs": runs,
                "strike_rate": round(runs / balls * 100, 1) if balls > 0 else 0,
                "boundary_pct": round(boundaries / balls * 100, 1) if balls > 0 else 0,
                "fours": fours,
                "sixes": sixes,
                "dismissals": dismissals,
                "average": round(runs / dismissals, 1) if dismissals > 0 else runs
            }
        else:
            df = phase_df[phase_df["bowler"] == player]
            if len(df) == 0:
                result[phase_name] = {"no_data": True}
                continue

            balls = len(df)
            runs = int(df["runs_off_bat"].sum()) + int(df["extras"].sum())
            wickets = int(df["is_wicket"].sum())
            overs = balls / 6
            dot_balls = int((df["runs_off_bat"] == 0).sum())

            result[phase_name] = {
                "balls": balls,
                "runs_conceded": runs,
                "wickets": wickets,
                "economy": round(runs / overs, 2) if overs > 0 else 0,
                "dot_ball_pct": round(dot_balls / balls * 100, 1) if balls > 0 else 0,
                "strike_rate": round(balls / wickets, 1) if wickets > 0 else None
            }

    return {"player": player, "role": role, "phases": result}
