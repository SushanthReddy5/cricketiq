from services.data_loader import get_match_info

def get_toss_analysis(venue: str = None):
    match_info = get_match_info()
    df = match_info.copy()
    if venue and venue != "all":
        df = df[df["venue"] == venue]

    if len(df) == 0:
        return {"error": "No data for this venue"}

    total = len(df)
    toss_winner_won = int((df["toss_winner"] == df["winner"]).sum())
    toss_winner_lost = total - toss_winner_won

    bat_first = df[df["toss_decision"] == "bat"]
    field_first = df[df["toss_decision"] == "field"]

    bat_and_won = int((bat_first["toss_winner"] == bat_first["winner"]).sum())
    field_and_won = int((field_first["toss_winner"] == field_first["winner"]).sum())

    return {
        "venue": venue or "All Venues",
        "total_matches": total,
        "toss_winner_win_pct": round(toss_winner_won / total * 100, 1),
        "toss_winner_loss_pct": round(toss_winner_lost / total * 100, 1),
        "bat_first": {
            "count": len(bat_first),
            "toss_winner_won": bat_and_won,
            "win_pct": round(bat_and_won / len(bat_first) * 100, 1) if len(bat_first) > 0 else 0
        },
        "field_first": {
            "count": len(field_first),
            "toss_winner_won": field_and_won,
            "win_pct": round(field_and_won / len(field_first) * 100, 1) if len(field_first) > 0 else 0
        }
    }

def get_toss_by_venue():
    venues = get_match_info()["venue"].unique()
    result = []
    for v in venues:
        stats = get_toss_analysis(v)
        if "error" not in stats and stats["total_matches"] >= 5:
            result.append(stats)
    return sorted(result, key=lambda x: x["toss_winner_win_pct"], reverse=True)
