import pandas as pd
import os
import glob

DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")
OUT_DIR  = os.path.join(os.path.dirname(__file__), "../models")
os.makedirs(OUT_DIR, exist_ok=True)

def scalar(val, default="Unknown"):
    if isinstance(val, list):
        return val[0] if val else default
    return val if val else default

def parse_ball_line(line):
    parts = line.split(",")
    if len(parts) < 9:
        return None

    def clean(s):
        return s.strip().strip('"').strip()

    # Format A: 16 cols — non-dismissal: [13]='""' [14]='""'
    # Format B: 15 cols — dismissal: [13]='' [14]=kind [15]=player
    n = len(parts)
    dismissal_kind   = ""
    player_dismissed = ""

    if n >= 15:
        c13 = clean(parts[13])
        c14 = clean(parts[14])
        c15 = clean(parts[15]) if n > 15 else ""
        # c13 is empty on dismissal lines, c14 has the kind
        if c14 and c14 not in ("",):
            dismissal_kind   = c14
            player_dismissed = c15
        elif c13 and c13 not in ("",):
            dismissal_kind   = c13
            player_dismissed = c14

    wides   = clean(parts[9])  if len(parts) > 9  else ""
    noballs = clean(parts[10]) if len(parts) > 10 else ""

    return {
        "innings":          clean(parts[1]),
        "over_ball":        clean(parts[2]),
        "batting_team":     clean(parts[3]),
        "striker":          clean(parts[4]),
        "non_striker":      clean(parts[5]),
        "bowler":           clean(parts[6]),
        "runs_off_bat":     clean(parts[7]),
        "extras":           clean(parts[8]),
        "wides":            wides,
        "noballs":          noballs,
        "dismissal_kind":   dismissal_kind,
        "player_dismissed": player_dismissed,
    }

def parse_match_file(filepath):
    info  = {}
    balls = []

    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith("version"):
                continue
            elif line.startswith("info"):
                parts = line.split(",", 2)
                if len(parts) >= 3:
                    key = parts[1].strip()
                    val = parts[2].strip()
                    if key in info:
                        if isinstance(info[key], list):
                            info[key].append(val)
                        else:
                            info[key] = [info[key], val]
                    else:
                        info[key] = val
            elif line.startswith("ball"):
                b = parse_ball_line(line)
                if b:
                    balls.append(b)

    if not balls:
        return None

    df       = pd.DataFrame(balls)
    match_id = os.path.basename(filepath).replace(".csv", "")
    teams    = info.get("team", ["Unknown", "Unknown"])
    if isinstance(teams, str):
        teams = [teams, "Unknown"]

    df["match_id"]       = match_id
    df["season"]         = scalar(info.get("season"))
    df["date"]           = scalar(info.get("date"))
    df["venue"]          = scalar(info.get("venue"))
    df["city"]           = scalar(info.get("city"))
    df["team1"]          = teams[0] if len(teams) > 0 else "Unknown"
    df["team2"]          = teams[1] if len(teams) > 1 else "Unknown"
    df["toss_winner"]    = scalar(info.get("toss_winner"))
    df["toss_decision"]  = scalar(info.get("toss_decision"))
    df["winner"]         = scalar(info.get("winner"))
    df["winner_runs"]    = scalar(info.get("winner_runs"),    "0")
    df["winner_wickets"] = scalar(info.get("winner_wickets"), "0")
    df["match_type"]     = scalar(info.get("match_type", "T20"))
    df["day_night"]      = scalar(info.get("day_night", "day"))
    return df

def build():
    files = glob.glob(os.path.join(DATA_DIR, "*.csv"))
    print(f"Found {len(files)} match files...")

    all_dfs = []
    failed  = 0

    for i, f in enumerate(files):
        try:
            df = parse_match_file(f)
            if df is not None:
                all_dfs.append(df)
            else:
                failed += 1
        except Exception as e:
            failed += 1

        if (i + 1) % 100 == 0:
            print(f"  Processed {i+1}/{len(files)}...")

    master = pd.concat(all_dfs, ignore_index=True)

    # Type conversions
    master["innings"]      = pd.to_numeric(master["innings"],      errors="coerce")
    master["runs_off_bat"] = pd.to_numeric(master["runs_off_bat"], errors="coerce").fillna(0)
    master["extras"]       = pd.to_numeric(master["extras"],       errors="coerce").fillna(0)
    master["wides"]        = pd.to_numeric(master["wides"],        errors="coerce").fillna(0)
    master["noballs"]      = pd.to_numeric(master["noballs"],      errors="coerce").fillna(0)
    master["total_runs"]   = master["runs_off_bat"] + master["extras"]
    master["over"]         = master["over_ball"].apply(
        lambda x: int(str(x).split(".")[0]) if pd.notna(x) else 0)
    master["ball_in_over"] = master["over_ball"].apply(
        lambda x: int(str(x).split(".")[1]) if pd.notna(x) and "." in str(x) else 0)
    master["is_wicket"]    = master["dismissal_kind"].apply(
        lambda x: 1 if x and x.strip() not in ["", "run out"] else 0)
    master["is_boundary4"] = (master["runs_off_bat"] == 4).astype(int)
    master["is_boundary6"] = (master["runs_off_bat"] == 6).astype(int)
    master["is_dot"]       = (master["runs_off_bat"] == 0).astype(int)
    master["is_legal"]     = (master["wides"] == 0).astype(int)
    master["date"]         = pd.to_datetime(master["date"], errors="coerce")

    # Phase tags
    def phase(over):
        if over <= 5:  return "powerplay"
        if over <= 14: return "middle"
        return "death"
    master["phase"] = master["over"].apply(phase)

    out_path = os.path.join(OUT_DIR, "master.parquet")
    master.to_parquet(out_path, index=False)

    print(f"\n✅ Master dataset saved")
    print(f"   Shape       : {master.shape}")
    print(f"   Matches     : {master['match_id'].nunique()}")
    print(f"   Seasons     : {sorted(master['season'].unique())}")
    print(f"   Total wickets: {master['is_wicket'].sum()}")
    print(f"   Wicket types : {master[master['is_wicket']==1]['dismissal_kind'].value_counts().head(5).to_dict()}")
    print(f"   Failed files : {failed}")

if __name__ == "__main__":
    build()
