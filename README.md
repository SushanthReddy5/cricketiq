# 🏏 CricketIQ

CricketIQ is an AI-powered IPL analytics and match prediction platform built with FastAPI and React. Powered by machine learning models trained on 1,235 historical matches and 290,000+ ball-by-ball IPL records (2007–2026), it delivers accurate outcome predictions, live chase win probabilities, venue pitch insights, batter vs. bowler duels, phase analytics, and toss impact metrics.

---

## 🚀 Features

1. **🏆 Match Prediction**: 4-factor ML model factoring in rolling team form, weighted head-to-head records, venue pitch dynamics, and season-aware squad strength with 0 data leakage.
2. **📊 Live Win Probability**: Real-time chase engine combining calibrated physics run-rate models with exact historical ball-by-ball similarity matching across 1,200+ IPL chases.
3. **🏟️ Venue & Pitch Analytics**: Deep dive across 40 IPL venues: average 1st innings scores, defend vs. chase win ratios, spin vs. pace distribution, and phase wicket breakdowns.
4. **⚔️ Head to Head Duels**: Comprehensive batter vs. bowler radar profiles, strike rates, dot ball %, boundary %, and dismissal counts across all IPL seasons.
5. **📈 Phase Analytics**: Granular performance splits across Powerplay (Overs 1–6), Middle (Overs 7–15), and Death overs (Overs 16–20) for both batters and bowlers.
6. **🪙 Toss Impact Analysis**: Quantitative analysis of whether winning the toss translates to winning the match, with venue-by-venue breakdowns and bat vs. field decision win rates.

---

## 🛠️ Architecture

- **Backend**: Python 3.13, FastAPI, Uvicorn, Pandas, PyArrow, Scikit-learn, XGBoost.
- **Frontend**: React 19, Recharts, Tailwind CSS, Axios, Lucide React.
- **Data & Models**: Fast Parquet serialization with precomputed rolling match features and calibrated probability classifiers.

---

## 💻 Local Setup & Development

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be live at `http://localhost:8000` (interactive documentation at `http://localhost:8000/docs`).

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

The React app will be live at `http://localhost:3000`.

---

## 🚢 Deployment Guide

### Deploying the Backend (Render / Railway / fly.io)

1. **Root Directory**: `backend`
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set environment variable `PORT` (assigned automatically by platforms like Render/Railway).

### Deploying the Frontend (Vercel / Netlify)

1. **Root Directory**: `frontend`
2. **Build Command**: `npm run build`
3. **Output Directory**: `build`
4. **Environment Variables**:
   - `REACT_APP_API_URL`: URL of your deployed backend (e.g. `https://your-cricketiq-api.onrender.com/api`)

