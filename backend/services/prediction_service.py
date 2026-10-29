import pickle, json, os, warnings
warnings.filterwarnings("ignore")
import numpy as np
import pandas as pd
from datetime import datetime

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")

with open(os.path.join(MODELS_DIR, "predictor_calibrated.pkl"), "rb") as f:
    model = pickle.load(f)
with open(os.path.join(MODELS_DIR, "model_meta.json")) as f:
    meta = json.load(f)

ALL_FEATURES    = meta["all_features"]
GROUP_IMP       = meta["group_importances"]
FEAT_IMP        = meta["importances"]

master        = pd.read_parquet(os.path.join(MODELS_DIR, "master.parquet"))
features_df   = pd.read_parquet(os.path.join(MODELS_DIR, "features.parquet"))
venue_pitch   = pd.read_parquet(os.path.join(MODELS_DIR, "venue_pitch.parquet"))
batter_match  = pd.read_parquet(os.path.join(MODELS_DIR, "batter_match.parquet"))
bowler_match  = pd.read_parquet(os.path.join(MODELS_DIR, "bowler_match.parquet"))

match_meta = features_df[["match_id","date","season","team1","team2","venue","winner"]].copy()
match_meta["date"] = pd.to_datetime(match_meta["date"])
all_seasons = sorted(master["season"].unique())

TEAM_ALIASES = {
    "Royal Challengers Bengaluru": ["Royal Challengers Bengaluru", "Royal Challengers Bangalore"],
    "Royal Challengers Bangalore": ["Royal Challengers Bengaluru", "Royal Challengers Bangalore"],
    "Delhi Capitals": ["Delhi Capitals", "Delhi Daredevils"],
    "Delhi Daredevils": ["Delhi Capitals", "Delhi Daredevils"],
    "Punjab Kings": ["Punjab Kings", "Kings XI Punjab"],
    "Kings XI Punjab": ["Punjab Kings", "Kings XI Punjab"],
    "Rising Pune Supergiant": ["Rising Pune Supergiant", "Rising Pune Supergiants"],
    "Rising Pune Supergiants": ["Rising Pune Supergiant", "Rising Pune Supergiants"],
}

CURRENT_TEAMS = [
    "Chennai Super Kings",
    "Delhi Capitals",
    "Gujarat Titans",
    "Kolkata Knight Riders",
    "Lucknow Super Giants",
    "Mumbai Indians",
    "Punjab Kings",
    "Rajasthan Royals",
    "Royal Challengers Bengaluru",
    "Sunrisers Hyderabad"
]

def get_team_variants(team):
    return TEAM_ALIASES.get(team, [team])

def season_end_date(season):
    """Return the last day of a season for cutoff filtering."""
    # Season like '2026' ends Dec 31 2026; '2020/21' ends May 2021
    if "/" in str(season):
        year = int(str(season).split("/")[1])
        if year < 100: year += 2000
    else:
        year = int(str(season))
    return pd.Timestamp(f"{year}-12-31")

def compute_team_form(team, season, n=5):
    """Last N matches UP TO end of selected season only."""
    cutoff = season_end_date(season)
    t_vars = get_team_variants(team)
    past = match_meta[
        ((match_meta["team1"].isin(t_vars)) | (match_meta["team2"].isin(t_vars))) &
        (match_meta["date"] <= cutoff)
    ].tail(n * 2).tail(n)

    if len(past) == 0:
        return {"wins": 0, "total": 0, "form_score": 0.5, "streak": 0, "results": []}

    wins    = past["winner"].isin(t_vars)
    results = wins.tolist()
    streak  = 0
    for r in reversed(results):
        if r and streak >= 0:  streak += 1
        elif not r and streak <= 0: streak -= 1
        else: break

    return {
        "wins":       int(wins.sum()),
        "total":      len(past),
        "form_score": round(float(wins.mean()), 4),
        "streak":     streak,
        "results":    list(reversed(results)),
    }

def compute_h2h(t1, t2, season, n=20):
    """H2H matches UP TO end of selected season, recent 2yr weighted 2x."""
    cutoff = season_end_date(season)
    t1_vars = get_team_variants(t1)
    t2_vars = get_team_variants(t2)
    past = match_meta[
        (
            ((match_meta["team1"].isin(t1_vars)) & (match_meta["team2"].isin(t2_vars))) |
            ((match_meta["team1"].isin(t2_vars)) & (match_meta["team2"].isin(t1_vars)))
        ) &
        (match_meta["date"] <= cutoff)
    ].tail(n)

    if len(past) == 0:
        return {"t1_wins": 0, "t2_wins": 0, "total": 0, "h2h_score": 0.5}

    two_yr_ago  = cutoff - pd.Timedelta(days=730)
    weights     = past["date"].apply(lambda d: 2.0 if d >= two_yr_ago else 1.0)
    t1_wins_w   = float((past["winner"].isin(t1_vars) * weights).sum())
    total_w     = float(weights.sum())

    return {
        "t1_wins":   int(past["winner"].isin(t1_vars).sum()),
        "t2_wins":   int(past["winner"].isin(t2_vars).sum()),
        "total":     len(past),
        "h2h_score": round(t1_wins_w / total_w if total_w > 0 else 0.5, 4),
    }

def get_venue_stats(venue):
    if venue in venue_pitch.index:
        row = venue_pitch.loc[venue]
        return {
            "avg_inn1":          float(row.get("avg_inn1", 160)),
            "avg_inn2":          float(row.get("avg_inn2", 150)),
            "venue_chase_rate":  float(row.get("venue_chase_rate", 0.5)),
            "toss_bat_win_rate": float(row.get("toss_bat_win_rate", 0.5)),
            "spin_index":        float(row.get("spin_index", 0.5)),
        }
    return {"avg_inn1":160,"avg_inn2":150,"venue_chase_rate":0.5,"toss_bat_win_rate":0.5,"spin_index":0.5}

def get_team_venue_rate(team, venue, season):
    cutoff = season_end_date(season)
    t_vars = get_team_variants(team)
    sub = match_meta[
        ((match_meta["team1"].isin(t_vars)) | (match_meta["team2"].isin(t_vars))) &
        (match_meta["venue"] == venue) &
        (match_meta["date"] <= cutoff)
    ]
    if len(sub) < 2: return 0.5
    return float(sub["winner"].isin(t_vars).sum() / len(sub))

def get_squad_strength(team, season, n_bat=5, n_bowl=3, window=10):
    """Top N batters/bowlers from selected season only (fallback to prev if <3 matches)."""
    s_idx = list(all_seasons).index(season) if season in all_seasons else len(all_seasons)-1
    cutoff = season_end_date(season)
    t_vars = get_team_variants(team)

    bat_cur = batter_match[
        (batter_match["batting_team"].isin(t_vars)) &
        (batter_match["season"] == season) &
        (batter_match["date"] <= cutoff)
    ]
    if bat_cur["match_id"].nunique() < 3 and s_idx > 0:
        prev     = all_seasons[s_idx-1]
        bat_prev = batter_match[(batter_match["batting_team"].isin(t_vars)) & (batter_match["season"] == prev)]
        bat_data = pd.concat([bat_prev, bat_cur])
    else:
        bat_data = bat_cur

    if len(bat_data) == 0:
        batting_sr = 120.0; boundary_pct = 25.0; batter_details = []
    else:
        top_batters = bat_data.groupby("striker")["balls"].sum().nlargest(n_bat).index.tolist()
        stats = []; batter_details = []
        for b in top_batters:
            hist = batter_match[(batter_match["striker"]==b)&(batter_match["date"]<=cutoff)].tail(window)
            if len(hist) == 0: continue
            sr = float(hist["sr"].mean()); bp = float(hist["boundary_pct"].mean())
            stats.append({"sr":sr,"boundary_pct":bp})
            batter_details.append({"name":b,"sr":round(sr,1),"boundary_pct":round(bp,1),"matches":len(hist)})
        batting_sr    = float(np.mean([s["sr"] for s in stats])) if stats else 120.0
        boundary_pct  = float(np.mean([s["boundary_pct"] for s in stats])) if stats else 25.0

    team_match_ids = set(master[(master["team1"].isin(t_vars)) | (master["team2"].isin(t_vars))]["match_id"].unique())
    bowl_cur = bowler_match[
        (bowler_match["match_id"].isin(team_match_ids)) &
        (~bowler_match["batting_team"].isin(t_vars)) &
        (bowler_match["season"]==season) &
        (bowler_match["date"]<=cutoff)
    ]
    if bowl_cur["match_id"].nunique() < 3 and s_idx > 0:
        prev      = all_seasons[s_idx-1]
        bowl_prev = bowler_match[(bowler_match["match_id"].isin(team_match_ids)) & (~bowler_match["batting_team"].isin(t_vars)) & (bowler_match["season"]==prev)]
        bowl_data = pd.concat([bowl_prev, bowl_cur])
    else:
        bowl_data = bowl_cur

    if len(bowl_data) == 0:
        bowling_eco = 8.5; dot_pct = 35.0; bowler_details = []
    else:
        top_bowlers = bowl_data.groupby("bowler")["balls"].sum().nlargest(n_bowl).index.tolist()
        bowl_stats = []; bowler_details = []
        for b in top_bowlers:
            hist = bowler_match[(bowler_match["bowler"]==b)&(bowler_match["date"]<=cutoff)].tail(window)
            if len(hist) == 0: continue
            eco = float(hist["economy"].mean()); dp = float(hist["dot_pct"].mean())
            bowl_stats.append({"economy":eco,"dot_pct":dp})
            bowler_details.append({"name":b,"economy":round(eco,2),"dot_pct":round(dp,1),"matches":len(hist)})
        bowling_eco = float(np.mean([s["economy"] for s in bowl_stats])) if bowl_stats else 8.5
        dot_pct     = float(np.mean([s["dot_pct"] for s in bowl_stats])) if bowl_stats else 35.0

    return {
        "batting_sr":      round(batting_sr, 2),
        "boundary_pct":    round(boundary_pct, 2),
        "bowling_economy": round(bowling_eco, 2),
        "dot_pct":         round(dot_pct, 2),
        "top_batters":     batter_details,
        "top_bowlers":     bowler_details,
    }

def predict_winner(team1, team2, venue, season):
    """Predict without toss — season-aware form, H2H, squad."""
    # Default toss values (neutral — toss has lowest feature importance anyway)
    toss_winner_is_t1 = 0
    toss_bat          = 0

    venue_stats  = get_venue_stats(venue)
    venue_chase  = venue_stats["venue_chase_rate"]
    t1_vr        = get_team_venue_rate(team1, venue, season)
    t2_vr        = get_team_venue_rate(team2, venue, season)

    f1_t1 = compute_team_form(team1, season)
    f1_t2 = compute_team_form(team2, season)
    f2    = compute_h2h(team1, team2, season)
    f4_t1 = get_squad_strength(team1, season)
    f4_t2 = get_squad_strength(team2, season)

    t1_form = f1_t1["form_score"]; t2_form = f1_t2["form_score"]
    h2h     = f2["h2h_score"]

    # Build feature vector matching exact training order (26 features, no toss)
    f3_venue = get_venue_stats(venue)
    X = np.array([[
        # F1 Form (6)
        t1_form, t2_form, t1_form - t2_form,
        f1_t1["streak"], f1_t2["streak"], f1_t1["streak"] - f1_t2["streak"],
        # F2 H2H (2)
        f2["h2h_score"], f2["total"],
        # F3 Venue (8)
        f3_venue["venue_chase_rate"], f3_venue["avg_inn1"], f3_venue["avg_inn2"],
        f3_venue["toss_bat_win_rate"], f3_venue["spin_index"],
        t1_vr, t2_vr, t1_vr - t2_vr,
        # F4 Squad (10)
        f4_t1["batting_sr"], f4_t2["batting_sr"], f4_t1["batting_sr"]-f4_t2["batting_sr"],
        f4_t1["boundary_pct"], f4_t2["boundary_pct"],
        f4_t1["bowling_economy"], f4_t2["bowling_economy"], f4_t2["bowling_economy"]-f4_t1["bowling_economy"],
        f4_t1["dot_pct"], f4_t2["dot_pct"],
    ]])

    proba   = model.predict_proba(X)[0]
    t1_prob = float(proba[1])
    t2_prob = float(proba[0])

    return {
        "team1": team1, "team2": team2, "season": season,
        "team1_win_probability": round(t1_prob * 100, 1),
        "team2_win_probability": round(t2_prob * 100, 1),
        "predicted_winner": team1 if t1_prob > t2_prob else team2,
        "confidence": round(max(t1_prob, t2_prob) * 100, 1),
        "model_accuracy": round(meta["cv_accuracy"] * 100, 1),
        "group_importances": GROUP_IMP,
        "feature_importances": FEAT_IMP,
        "breakdown": {
            "team_form": {
                "team1": f1_t1, "team2": f1_t2,
                "weight": round(GROUP_IMP.get("F1_Team_Form", 0) * 100, 1),
            },
            "head_to_head": {
                **f2, "team1": team1, "team2": team2,
                "weight": round(GROUP_IMP.get("F2_H2H", 0) * 100, 1),
            },
            "venue_pitch": {
                **venue_stats,
                "team1_venue_rate": round(t1_vr * 100, 1),
                "team2_venue_rate": round(t2_vr * 100, 1),
                "weight": round(GROUP_IMP.get("F3_Venue_Pitch", 0) * 100, 1),
            },
            "squad_strength": {
                "team1": f4_t1, "team2": f4_t2, "season": season,
                "weight": round(GROUP_IMP.get("F4_Squad_Strength", 0) * 100, 1),
            },
        },
    }

def get_all_seasons():
    return list(reversed(all_seasons))

def get_all_teams():
    all_teams_list = sorted(set(master["team1"].dropna().unique().tolist() + master["team2"].dropna().unique().tolist()))
    return {
        "current_teams": CURRENT_TEAMS,
        "all_teams": all_teams_list
    }
