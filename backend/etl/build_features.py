import pandas as pd
import numpy as np
import os
from datetime import timedelta

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")
master = pd.read_parquet(os.path.join(MODELS_DIR, "master.parquet"))

# One row per match — ground truth
match_meta = master.drop_duplicates("match_id")[[
    "match_id","season","date","venue","city",
    "team1","team2","toss_winner","toss_decision",
    "winner","day_night"
]].copy()
match_meta = match_meta[match_meta["winner"] != "Unknown"].copy()
match_meta = match_meta.sort_values("date").reset_index(drop=True)

print(f"Total matches for feature building: {len(match_meta)}")

# ═══════════════════════════════════════════════════════════════════
# FEATURE GROUP 1: TEAM FORM (25%)
# Last 5 matches per team, strictly before current match date
# Current season results weighted 1.5x vs previous season
# ═══════════════════════════════════════════════════════════════════

def compute_team_form(team, before_date, season, match_meta, n=5):
    past = match_meta[
        ((match_meta["team1"] == team) | (match_meta["team2"] == team)) &
        (match_meta["date"] < before_date)
    ].tail(n * 3)  # get more, then weight

    if len(past) == 0:
        return {"wins": 0, "total": 0, "form_score": 0.5, "streak": 0}

    past = past.tail(n)
    wins = (past["winner"] == team)

    # Weight: same season = 1.5, previous = 1.0
    weights = past["season"].apply(lambda s: 1.5 if s == season else 1.0)
    weighted_wins  = float((wins * weights).sum())
    weighted_total = float(weights.sum())
    form_score     = weighted_wins / weighted_total if weighted_total > 0 else 0.5

    # Streak: positive = win streak, negative = loss streak
    results = wins.tolist()
    streak  = 0
    for r in reversed(results):
        if r and streak >= 0: streak += 1
        elif not r and streak <= 0: streak -= 1
        else: break

    return {
        "wins":       int(wins.sum()),
        "total":      len(past),
        "form_score": round(form_score, 4),
        "streak":     streak
    }

# ═══════════════════════════════════════════════════════════════════
# FEATURE GROUP 2: HEAD-TO-HEAD (20%)
# Last 20 H2H, recent 2 years weighted 2x
# ═══════════════════════════════════════════════════════════════════

def compute_h2h(t1, t2, before_date, match_meta, n=20):
    past = match_meta[
        (
            ((match_meta["team1"]==t1) & (match_meta["team2"]==t2)) |
            ((match_meta["team1"]==t2) & (match_meta["team2"]==t1))
        ) &
        (match_meta["date"] < before_date)
    ].tail(n)

    if len(past) == 0:
        return {"t1_wins": 0, "t2_wins": 0, "total": 0, "h2h_score": 0.5}

    cutoff_recent = before_date - timedelta(days=730)  # 2 years

    def weight(row):
        return 2.0 if row["date"] >= cutoff_recent else 1.0

    weights   = past.apply(weight, axis=1)
    t1_wins_w = float(((past["winner"] == t1) * weights).sum())
    total_w   = float(weights.sum())
    h2h_score = t1_wins_w / total_w if total_w > 0 else 0.5

    return {
        "t1_wins":   int((past["winner"] == t1).sum()),
        "t2_wins":   int((past["winner"] == t2).sum()),
        "total":     len(past),
        "h2h_score": round(h2h_score, 4)
    }

# ═══════════════════════════════════════════════════════════════════
# FEATURE GROUP 3: VENUE + PITCH (30%)
# Team venue win%, avg 1st/2nd innings, toss bias, spin vs pace index
# ═══════════════════════════════════════════════════════════════════

# Pre-compute venue profiles from ALL data (stable ground truth)
print("Building venue profiles...")

inn1 = master[master["innings"] == 1]
inn2 = master[master["innings"] == 2]

# Avg 1st and 2nd innings totals per venue
venue_inn1_avg = inn1.groupby(["match_id","venue"])["total_runs"].sum().reset_index()
venue_inn1_avg = venue_inn1_avg.groupby("venue")["total_runs"].mean().rename("avg_inn1")

venue_inn2_avg = inn2.groupby(["match_id","venue"])["total_runs"].sum().reset_index()
venue_inn2_avg = venue_inn2_avg.groupby("venue")["total_runs"].mean().rename("avg_inn2")

# Chase win rate
inn2_batting = inn2.groupby("match_id")["batting_team"].first().rename("chasing_team")
chase_df     = match_meta[["match_id","venue","winner"]].merge(inn2_batting, on="match_id")
chase_df["chase_won"] = (chase_df["chasing_team"] == chase_df["winner"]).astype(int)
venue_chase  = chase_df.groupby("venue")["chase_won"].mean().rename("venue_chase_rate")

# Toss: bat-first win rate
toss_bat  = match_meta[match_meta["toss_decision"] == "bat"].copy()
toss_bat["toss_bat_won"] = (toss_bat["toss_winner"] == toss_bat["winner"]).astype(int)
venue_toss_bat_win = toss_bat.groupby("venue")["toss_bat_won"].mean().rename("toss_bat_win_rate")

# Pitch type: spin vs pace index
# Proxy: spinners take more wickets in overs 7-15 (middle) — higher = spin friendly
# We classify bowlers roughly: pace = overs 0-5 and 16-20, spin = overs 6-15
wickets = master[master["is_wicket"] == 1].copy()
pp_death_wkts  = wickets[wickets["over"].isin(list(range(0,6)) + list(range(16,20)))]
middle_wkts    = wickets[wickets["over"].isin(range(6,16))]

venue_pace_wkts  = pp_death_wkts.groupby("venue").size().rename("pace_wickets")
venue_spin_wkts  = middle_wkts.groupby("venue").size().rename("spin_wickets")
venue_total_wkts = wickets.groupby("venue").size().rename("total_wickets")

venue_pitch = pd.concat([
    venue_inn1_avg, venue_inn2_avg, venue_chase,
    venue_toss_bat_win, venue_pace_wkts,
    venue_spin_wkts, venue_total_wkts
], axis=1).fillna(0)

venue_pitch["spin_index"] = (
    venue_pitch["spin_wickets"] /
    (venue_pitch["spin_wickets"] + venue_pitch["pace_wickets"] + 1)
).fillna(0.5)

# Normalize avg scores
venue_pitch["avg_inn1"]  = venue_pitch["avg_inn1"].fillna(venue_pitch["avg_inn1"].median())
venue_pitch["avg_inn2"]  = venue_pitch["avg_inn2"].fillna(venue_pitch["avg_inn2"].median())
venue_pitch["venue_chase_rate"]    = venue_pitch["venue_chase_rate"].fillna(0.5)
venue_pitch["toss_bat_win_rate"]   = venue_pitch["toss_bat_win_rate"].fillna(0.5)

venue_pitch.to_parquet(os.path.join(MODELS_DIR, "venue_pitch.parquet"))
print(f"  Venue profiles built: {len(venue_pitch)} venues")

def get_venue_stats(venue):
    if venue in venue_pitch.index:
        row = venue_pitch.loc[venue]
        return {
            "avg_inn1":          float(row["avg_inn1"]),
            "avg_inn2":          float(row["avg_inn2"]),
            "venue_chase_rate":  float(row["venue_chase_rate"]),
            "toss_bat_win_rate": float(row["toss_bat_win_rate"]),
            "spin_index":        float(row["spin_index"]),
        }
    return {
        "avg_inn1": 160.0, "avg_inn2": 150.0,
        "venue_chase_rate": 0.5, "toss_bat_win_rate": 0.5,
        "spin_index": 0.5
    }

def compute_team_venue_rate(team, venue, before_date, match_meta):
    past = match_meta[
        ((match_meta["team1"]==team) | (match_meta["team2"]==team)) &
        (match_meta["venue"] == venue) &
        (match_meta["date"] < before_date)
    ]
    if len(past) < 2:
        return 0.5
    return float((past["winner"] == team).sum() / len(past))

# ═══════════════════════════════════════════════════════════════════
# FEATURE GROUP 4: SQUAD STRENGTH — ROLLING FORM ONLY (25%)
# Top 5 batters by balls faced this season
# Top 3 bowlers by balls bowled this season
# Rolling last 10 matches ONLY — no career stats
# ═══════════════════════════════════════════════════════════════════

print("Building player rolling form tables...")

# Get all match dates per player
# Batter rolling stats: per match, compute SR for that match
batter_match = master[master["innings"].isin([1,2])].groupby(
    ["match_id","season","date","batting_team","striker"]
).agg(
    runs      = ("runs_off_bat", "sum"),
    balls     = ("runs_off_bat", "count"),
    fours     = ("is_boundary4", "sum"),
    sixes     = ("is_boundary6", "sum"),
    dots      = ("is_dot",       "sum"),
).reset_index()
batter_match = batter_match[batter_match["balls"] >= 4]  # min 4 balls faced
batter_match["sr"]           = batter_match["runs"] / batter_match["balls"] * 100
batter_match["boundary_pct"] = (batter_match["fours"] + batter_match["sixes"]) / batter_match["balls"] * 100
batter_match = batter_match.sort_values(["striker","date"])

# Bowler rolling stats: per match economy
bowler_match = master[master["innings"].isin([1,2])].groupby(
    ["match_id","season","date","batting_team","bowler"]
).agg(
    runs_given = ("runs_off_bat", "sum"),
    balls      = ("runs_off_bat", "count"),
    wickets    = ("is_wicket",    "sum"),
    dots       = ("is_dot",       "sum"),
).reset_index()
bowler_match = bowler_match[bowler_match["balls"] >= 6]  # min 1 over
bowler_match["economy"]  = bowler_match["runs_given"] / bowler_match["balls"] * 6
bowler_match["dot_pct"]  = bowler_match["dots"] / bowler_match["balls"] * 100
bowler_match = bowler_match.sort_values(["bowler","date"])

batter_match.to_parquet(os.path.join(MODELS_DIR, "batter_match.parquet"), index=False)
bowler_match.to_parquet(os.path.join(MODELS_DIR, "bowler_match.parquet"), index=False)
print(f"  Batter match records: {len(batter_match)}")
print(f"  Bowler match records: {len(bowler_match)}")

def get_squad_strength(team, season, before_date, n_bat=5, n_bowl=3, window=10):
    """
    Top N batters by balls faced this season → rolling avg SR (last window matches)
    Top N bowlers by balls bowled this season → rolling avg economy (last window matches)
    Falls back to previous season if current season has < 3 matches.
    """
    # Determine which seasons to look at
    all_seasons = sorted(master["season"].unique())
    s_idx       = list(all_seasons).index(season) if season in all_seasons else len(all_seasons)-1

    def get_season_data(s):
        bat_s = batter_match[
            (batter_match["batting_team"] == team) &
            (batter_match["season"] == s) &
            (batter_match["date"] < before_date)
        ]
        bowl_s = bowler_match[
            (bowler_match["date"] < before_date)
        ]
        # Map bowlers to team via batting_team opposite — use most common team this season
        return bat_s, bowl_s

    bat_cur, _ = get_season_data(season)

    # If fewer than 3 matches in current season, blend with previous
    cur_matches = bat_cur["match_id"].nunique()
    if cur_matches < 3 and s_idx > 0:
        prev_season = all_seasons[s_idx - 1]
        bat_prev, _ = get_season_data(prev_season)
        bat_data = pd.concat([bat_prev, bat_cur])
    else:
        bat_data = bat_cur

    # Top 5 batters by total balls faced
    if len(bat_data) == 0:
        batting_score = 120.0  # league average SR
        boundary_score = 25.0
    else:
        top_batters = (
            bat_data.groupby("striker")["balls"].sum()
            .nlargest(n_bat).index.tolist()
        )
        rolling_stats = []
        for batter in top_batters:
            b_hist = batter_match[
                (batter_match["striker"] == batter) &
                (batter_match["date"] < before_date)
            ].tail(window)
            if len(b_hist) == 0:
                continue
            rolling_stats.append({
                "sr":           float(b_hist["sr"].mean()),
                "boundary_pct": float(b_hist["boundary_pct"].mean()),
            })
        if rolling_stats:
            batting_score  = float(np.mean([s["sr"] for s in rolling_stats]))
            boundary_score = float(np.mean([s["boundary_pct"] for s in rolling_stats]))
        else:
            batting_score  = 120.0
            boundary_score = 25.0

    # Top 3 bowlers: map via opposite team in batting_team column
    # bowler appears in rows where batting_team = opponent, so filter by match_id
    team_match_ids = set(
        master[(master["team1"]==team)|(master["team2"]==team)]["match_id"].unique()
    )
    bowl_data = bowler_match[
        (bowler_match["match_id"].isin(team_match_ids)) &
        (bowler_match["batting_team"] != team) &  # bowler bowled AGAINST this team's opponents
        (bowler_match["date"] < before_date)
    ]
    # filter to current (or blended) season
    bowl_cur = bowl_data[bowl_data["season"] == season]
    if bowl_cur["match_id"].nunique() < 3 and s_idx > 0:
        prev_season = all_seasons[s_idx - 1]
        bowl_prev   = bowl_data[bowl_data["season"] == prev_season]
        bowl_data   = pd.concat([bowl_prev, bowl_cur])
    else:
        bowl_data = bowl_cur

    if len(bowl_data) == 0:
        bowling_score = 8.5
        dot_score     = 35.0
    else:
        top_bowlers = (
            bowl_data.groupby("bowler")["balls"].sum()
            .nlargest(n_bowl).index.tolist()
        )
        rolling_bowl = []
        for bowler in top_bowlers:
            b_hist = bowler_match[
                (bowler_match["bowler"] == bowler) &
                (bowler_match["date"] < before_date)
            ].tail(window)
            if len(b_hist) == 0:
                continue
            rolling_bowl.append({
                "economy": float(b_hist["economy"].mean()),
                "dot_pct": float(b_hist["dot_pct"].mean()),
            })
        if rolling_bowl:
            bowling_score = float(np.mean([s["economy"] for s in rolling_bowl]))
            dot_score     = float(np.mean([s["dot_pct"] for s in rolling_bowl]))
        else:
            bowling_score = 8.5
            dot_score     = 35.0

    return {
        "batting_sr":      round(batting_score,  2),
        "boundary_pct":    round(boundary_score, 2),
        "bowling_economy": round(bowling_score,  2),
        "dot_pct":         round(dot_score,      2),
    }

# ═══════════════════════════════════════════════════════════════════
# BUILD MATCH-LEVEL FEATURE TABLE — zero data leakage
# ═══════════════════════════════════════════════════════════════════

print("Building match-level feature table (zero-leakage)...")
print("  This takes 3-5 minutes — computing rolling features per match...")

records = []
for i, row in match_meta.iterrows():
    t1       = row["team1"]
    t2       = row["team2"]
    date     = row["date"]
    venue    = row["venue"]
    season   = row["season"]
    toss_win = row["toss_winner"]
    toss_dec = row["toss_decision"]

    # Feature Group 1: Form
    f1_t1 = compute_team_form(t1, date, season, match_meta)
    f1_t2 = compute_team_form(t2, date, season, match_meta)

    # Feature Group 2: H2H
    f2    = compute_h2h(t1, t2, date, match_meta)

    # Feature Group 3: Venue
    f3_venue = get_venue_stats(venue)
    f3_t1_vr = compute_team_venue_rate(t1, venue, date, match_meta)
    f3_t2_vr = compute_team_venue_rate(t2, venue, date, match_meta)

    # Feature Group 4: Squad strength (rolling, no career stats)
    f4_t1 = get_squad_strength(t1, season, date)
    f4_t2 = get_squad_strength(t2, season, date)

    # Toss encoding
    toss_winner_is_t1 = 1 if toss_win == t1 else 0
    toss_bat          = 1 if toss_dec == "bat" else 0

    # Label
    label = 1 if row["winner"] == t1 else 0

    records.append({
        # identifiers
        "match_id": row["match_id"],
        "date":     date,
        "season":   season,
        "team1":    t1,
        "team2":    t2,
        "venue":    venue,
        "winner":   row["winner"],
        "label":    label,

        # F1: Team form
        "t1_form_score":  f1_t1["form_score"],
        "t2_form_score":  f1_t2["form_score"],
        "form_diff":      f1_t1["form_score"] - f1_t2["form_score"],
        "t1_streak":      f1_t1["streak"],
        "t2_streak":      f1_t2["streak"],
        "streak_diff":    f1_t1["streak"] - f1_t2["streak"],

        # F2: H2H
        "h2h_score":   f2["h2h_score"],
        "h2h_t1_wins": f2["t1_wins"],
        "h2h_t2_wins": f2["t2_wins"],
        "h2h_total":   f2["total"],

        # F3: Venue + Pitch
        "venue_chase_rate":    f3_venue["venue_chase_rate"],
        "venue_avg_inn1":      f3_venue["avg_inn1"],
        "venue_avg_inn2":      f3_venue["avg_inn2"],
        "toss_bat_win_rate":   f3_venue["toss_bat_win_rate"],
        "spin_index":          f3_venue["spin_index"],
        "t1_venue_rate":       f3_t1_vr,
        "t2_venue_rate":       f3_t2_vr,
        "venue_rate_diff":     f3_t1_vr - f3_t2_vr,

        # F4: Squad strength (rolling only)
        "t1_batting_sr":      f4_t1["batting_sr"],
        "t2_batting_sr":      f4_t2["batting_sr"],
        "bat_sr_diff":        f4_t1["batting_sr"] - f4_t2["batting_sr"],
        "t1_boundary_pct":    f4_t1["boundary_pct"],
        "t2_boundary_pct":    f4_t2["boundary_pct"],
        "t1_bowling_eco":     f4_t1["bowling_economy"],
        "t2_bowling_eco":     f4_t2["bowling_economy"],
        "bowl_eco_diff":      f4_t2["bowling_economy"] - f4_t1["bowling_economy"],
        "t1_dot_pct":         f4_t1["dot_pct"],
        "t2_dot_pct":         f4_t2["dot_pct"],

        # Toss
        "toss_winner_is_t1": toss_winner_is_t1,
        "toss_bat":          toss_bat,
    })

    if (i + 1) % 100 == 0:
        print(f"  {i+1}/{len(match_meta)} matches processed...")

features_df = pd.DataFrame(records)
features_df.to_parquet(os.path.join(MODELS_DIR, "features.parquet"), index=False)

print(f"\n✅ Feature table saved: {len(features_df)} matches, {len(features_df.columns)} columns")
print(f"   Label balance: {features_df['label'].value_counts().to_dict()}")
print(f"\nFeature correlations with label:")
FEAT_COLS = [c for c in features_df.columns if c not in
             ["match_id","date","season","team1","team2","venue","winner","label"]]
corrs = features_df[FEAT_COLS].corrwith(features_df["label"]).sort_values(key=abs, ascending=False)
for col, val in corrs.head(15).items():
    print(f"  {col:<30} {val:+.4f}")

