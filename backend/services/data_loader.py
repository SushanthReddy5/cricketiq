import os
import pandas as pd

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")

_master = None
_match_info = None

def get_master():
    """Returns a single, shared, memory-optimized DataFrame of ball-by-ball records."""
    global _master
    if _master is None:
        cols = [
            "match_id", "innings", "over", "ball_in_over", "batting_team",
            "striker", "bowler", "runs_off_bat", "extras", "total_runs",
            "is_wicket", "player_dismissed", "venue", "toss_winner",
            "toss_decision", "winner"
        ]
        df = pd.read_parquet(os.path.join(MODELS_DIR, "master.parquet"), columns=cols)
        
        # Optimize dtypes to drastically reduce memory usage
        df["match_id"] = df["match_id"].astype("int32")
        df["innings"] = df["innings"].astype("int8")
        df["over"] = df["over"].astype("int8")
        df["ball_in_over"] = df["ball_in_over"].astype("int8")
        df["runs_off_bat"] = df["runs_off_bat"].astype("int8")
        df["extras"] = df["extras"].astype("int8")
        df["total_runs"] = df["total_runs"].astype("int8")
        df["is_wicket"] = df["is_wicket"].astype("int8")
        
        df["venue"] = df["venue"].astype("category")
        df["toss_decision"] = df["toss_decision"].astype("category")
        
        _master = df
    return _master

def get_match_info():
    """Returns unique match-level metadata (1,210 rows, <0.1 MB)."""
    global _match_info
    if _match_info is None:
        m = get_master()
        _match_info = m.drop_duplicates("match_id")[[
            "match_id", "venue", "toss_winner", "toss_decision", "winner", "batting_team"
        ]].copy()
        _match_info = _match_info[_match_info["winner"] != "Unknown"]
    return _match_info
