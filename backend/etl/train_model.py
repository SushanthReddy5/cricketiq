import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score, classification_report
from sklearn.calibration import CalibratedClassifierCV
import pickle, json, os

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")
df = pd.read_parquet(os.path.join(MODELS_DIR, "features.parquet"))
df = df.sort_values("date").reset_index(drop=True)

print(f"Training on {len(df)} matches")

# NO toss features — removed from UI
FEATURES = [
    # F1 Form
    "t1_form_score", "t2_form_score", "form_diff",
    "t1_streak", "t2_streak", "streak_diff",
    # F2 H2H
    "h2h_score", "h2h_total",
    # F3 Venue (no toss)
    "venue_chase_rate", "venue_avg_inn1", "venue_avg_inn2",
    "toss_bat_win_rate", "spin_index",
    "t1_venue_rate", "t2_venue_rate", "venue_rate_diff",
    # F4 Squad
    "t1_batting_sr", "t2_batting_sr", "bat_sr_diff",
    "t1_boundary_pct", "t2_boundary_pct",
    "t1_bowling_eco", "t2_bowling_eco", "bowl_eco_diff",
    "t1_dot_pct", "t2_dot_pct",
]

print(f"Features: {len(FEATURES)}")

X = df[FEATURES].fillna(0)
y = df["label"]

tscv = TimeSeriesSplit(n_splits=5)
scores = []
for fold, (tr, te) in enumerate(tscv.split(X)):
    m = RandomForestClassifier(n_estimators=200, max_depth=5, min_samples_leaf=6, random_state=42, n_jobs=-1)
    m.fit(X.iloc[tr], y.iloc[tr])
    acc = accuracy_score(y.iloc[te], m.predict(X.iloc[te]))
    scores.append(acc)
    print(f"  Fold {fold+1}: {acc:.2%}")

print(f"\n  Mean CV: {np.mean(scores):.2%} (+/- {np.std(scores):.2%})")

# Train final + calibrate
print("\nTraining final model...")
base = RandomForestClassifier(n_estimators=300, max_depth=5, min_samples_leaf=6, random_state=42, n_jobs=-1)
base.fit(X, y)

calibrated = CalibratedClassifierCV(
    RandomForestClassifier(n_estimators=300, max_depth=5, min_samples_leaf=6, random_state=42, n_jobs=-1),
    cv=5, method="isotonic"
)
calibrated.fit(X, y)

# Last fold report
last_tr, last_te = list(tscv.split(X))[-1]
y_pred = base.predict(X.iloc[last_te])
print(f"\n✅ Last-fold report:")
print(classification_report(y.iloc[last_te], y_pred))

with open(os.path.join(MODELS_DIR, "predictor.pkl"), "wb") as f:
    pickle.dump(base, f)
with open(os.path.join(MODELS_DIR, "predictor_calibrated.pkl"), "wb") as f:
    pickle.dump(calibrated, f)

imp = dict(zip(FEATURES, base.feature_importances_))
group_imp = {
    "F1_Team_Form":      sum(imp[f] for f in FEATURES[:6]),
    "F2_H2H":            sum(imp[f] for f in FEATURES[6:8]),
    "F3_Venue_Pitch":    sum(imp[f] for f in FEATURES[8:16]),
    "F4_Squad_Strength": sum(imp[f] for f in FEATURES[16:]),
}

meta = {
    "model_name":      "RandomForest",
    "cv_accuracy":     round(np.mean(scores), 4),
    "all_features":    FEATURES,
    "importances":     imp,
    "group_importances": group_imp,
}
with open(os.path.join(MODELS_DIR, "model_meta.json"), "w") as f:
    json.dump(meta, f, indent=2)

print(f"\n✅ Model saved — {len(FEATURES)} features (no toss)")
print("Group importances:")
for g, v in sorted(group_imp.items(), key=lambda x: -x[1]):
    print(f"  {g:<25} {v:.2%}")
