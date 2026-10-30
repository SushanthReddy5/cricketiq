import axios from 'axios';
import defaultVenues from './data/venues.json';
import defaultSeasons from './data/seasons.json';
import defaultPlayers from './data/players.json';
import defaultVenueStats from './data/venue_stats.json';
import defaultTossStats from './data/toss_stats.json';
import predictionData from './data/prediction_data.json';

const STORAGE_KEY = 'cricketiq_api_url';

export const getApiBaseUrl = () => {
  return localStorage.getItem(STORAGE_KEY) || process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
};

const API = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
});

export const setApiBaseUrl = (newUrl) => {
  let clean = (newUrl || '').trim();
  if (clean && !clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  if (clean && !clean.endsWith('/api') && !clean.endsWith('/api/')) {
    clean = clean.replace(/\/+$/, '') + '/api';
  }
  localStorage.setItem(STORAGE_KEY, clean);
  API.defaults.baseURL = clean;
  return clean;
};

export const checkBackendHealth = async () => {
  try {
    const res = await API.get('/seasons', { timeout: 4000 });
    return res.status === 200;
  } catch {
    return false;
  }
};

export const calculateLocalPrediction = ({ team1, team2, venue, season }) => {
  const sData = predictionData.teams[season] || predictionData.teams['2026'] || {};
  const t1_f = sData[team1]?.form || { wins: 3, total: 5, form_score: 0.6, streak: 1, results: [true, false, true, true, false] };
  const t2_f = sData[team2]?.form || { wins: 2, total: 5, form_score: 0.4, streak: -1, results: [false, true, false, true, false] };

  let h2h = predictionData.h2h[`${team1} vs ${team2}`];
  let t1_w = 0, t2_w = 0, total = 0, h2h_score = 0.5;
  if (h2h) {
    t1_w = h2h.t1_wins; t2_w = h2h.t2_wins; total = h2h.total; h2h_score = h2h.h2h_score;
  } else {
    h2h = predictionData.h2h[`${team2} vs ${team1}`];
    if (h2h) {
      t1_w = h2h.t2_wins; t2_w = h2h.t1_wins; total = h2h.total; h2h_score = 1 - h2h.h2h_score;
    }
  }

  const t1_vr = predictionData.venue_rates[team1]?.[venue] || 0.5;
  const t2_vr = predictionData.venue_rates[team2]?.[venue] || 0.5;
  const v_stats = defaultVenueStats[venue] || defaultVenueStats[defaultVenues[0]] || {};

  const t1_sq = sData[team1]?.squad || { batting_sr: 135, boundary_pct: 18, bowling_economy: 8.5, dot_pct: 35, top_batters: [], top_bowlers: [] };
  const t2_sq = sData[team2]?.squad || { batting_sr: 138, boundary_pct: 19, bowling_economy: 8.4, dot_pct: 34, top_batters: [], top_bowlers: [] };

  const form_adv = (t1_f.form_score - t2_f.form_score);
  const h2h_adv = (h2h_score - 0.5) * 2;
  const venue_adv = (t1_vr - t2_vr);
  const squad_bat_adv = (t1_sq.batting_sr - t2_sq.batting_sr) / 40 + (t1_sq.boundary_pct - t2_sq.boundary_pct) / 20;
  const squad_bowl_adv = (t2_sq.bowling_economy - t1_sq.bowling_economy) / 3 + (t1_sq.dot_pct - t2_sq.dot_pct) / 20;
  const squad_adv = 0.5 * squad_bat_adv + 0.5 * squad_bowl_adv;

  const net = 0.138 * form_adv + 0.061 * h2h_adv + 0.290 * venue_adv + 0.511 * squad_adv;
  const p1 = 1 / (1 + Math.exp(-net * 2.2));
  const t1_prob = +(p1 * 100).toFixed(1);
  const t2_prob = +((1 - p1) * 100).toFixed(1);

  return {
    team1, team2, season,
    team1_win_probability: t1_prob,
    team2_win_probability: t2_prob,
    predicted_winner: t1_prob > t2_prob ? team1 : team2,
    confidence: Math.max(t1_prob, t2_prob),
    model_accuracy: 52.9,
    is_offline: true,
    group_importances: {
      F4_Squad_Strength: 0.511,
      F3_Venue_Pitch: 0.290,
      F1_Team_Form: 0.138,
      F2_H2H: 0.061
    },
    breakdown: {
      team_form: {
        team1: t1_f,
        team2: t2_f,
        weight: 13.8
      },
      head_to_head: {
        t1_wins: t1_w,
        t2_wins: t2_w,
        total,
        h2h_score: +h2h_score.toFixed(4),
        team1,
        team2,
        weight: 6.1
      },
      venue_pitch: {
        avg_inn1: v_stats.avg_first_innings_total || 165,
        avg_inn2: 152,
        venue_chase_rate: (v_stats.chase_win_pct || 50) / 100,
        toss_bat_win_rate: (v_stats.bat_first_win_pct || 50) / 100,
        spin_index: 0.46,
        team1_venue_rate: +(t1_vr * 100).toFixed(1),
        team2_venue_rate: +(t2_vr * 100).toFixed(1),
        weight: 29.0
      },
      squad_strength: {
        team1: t1_sq,
        team2: t2_sq,
        season,
        weight: 51.1
      }
    }
  };
};

export const predictWinner = async (data) => {
  try {
    const res = await API.post('/predict', data);
    if (res.data?.predicted_winner) return res;
  } catch (err) {
    console.warn('Backend prediction unavailable, using offline ML breakdown:', err.message);
  }
  const local = calculateLocalPrediction(data);
  return { data: local };
};

export const getSeasons = async () => {
  try {
    const res = await API.get('/seasons');
    if (res.data?.seasons?.length) return res;
  } catch (err) {
    console.warn('Backend unavailable, using fallback seasons:', err.message);
  }
  return { data: { seasons: defaultSeasons } };
};

export const getTeams = async () => {
  try {
    const res = await API.get('/teams');
    if (res.data?.current_teams?.length) return res;
  } catch (err) {
    console.warn('Backend unavailable, using fallback teams');
  }
  return {
    data: {
      current_teams: [
        'Chennai Super Kings', 'Delhi Capitals', 'Gujarat Titans',
        'Kolkata Knight Riders', 'Lucknow Super Giants', 'Mumbai Indians',
        'Punjab Kings', 'Rajasthan Royals', 'Royal Challengers Bengaluru',
        'Sunrisers Hyderabad'
      ]
    }
  };
};

export const getVenues = async () => {
  try {
    const res = await API.get('/venues');
    if (res.data?.venues?.length) return res;
  } catch (err) {
    console.warn('Backend unavailable, using fallback venues:', err.message);
  }
  return { data: { venues: defaultVenues } };
};

export const getVenueStats = async (v) => {
  try {
    const res = await API.get(`/venue/${encodeURIComponent(v)}`);
    if (res.data && !res.data.error) return res;
  } catch (err) {
    console.warn(`Backend unavailable for venue "${v}", using precomputed stats:`, err.message);
  }
  const fallback = defaultVenueStats[v] || defaultVenueStats[defaultVenues[0]];
  return { data: fallback || { error: 'No data for this venue' } };
};

export const getTossAnalysis = async (v) => {
  try {
    const res = await API.get('/toss', { params: { venue: v } });
    if (res.data && !res.data.error) return res;
  } catch (err) {
    console.warn(`Backend unavailable for toss "${v}", using precomputed stats:`, err.message);
  }
  const key = v || 'all';
  const fallback = defaultTossStats[key] || defaultTossStats['all'];
  return { data: fallback || { error: 'No data for this venue' } };
};

export const getPlayers = async () => {
  try {
    const res = await API.get('/players');
    if (res.data?.players?.length) return res;
  } catch (err) {
    console.warn('Backend unavailable, using fallback players:', err.message);
  }
  return { data: { players: defaultPlayers } };
};

export const getMatchup = (b, p) => API.get('/matchup', { params: { batter: b, bowler: p } });
export const getPhaseStats = (p, r) => API.get('/phase', { params: { player: p, role: r } });

export const calculateLocalWinProb = ({ target, current_score, wickets_fallen, overs_completed }) => {
  const overs_int = Math.floor(overs_completed);
  const balls_part = Math.min(6, Math.round((overs_completed - overs_int) * 10));
  const balls_bowled = Math.min(120, overs_int * 6 + balls_part);
  const runs_needed = target - current_score;
  const balls_remaining = 120 - balls_bowled;
  const wickets_remaining = 10 - wickets_fallen;
  const overs_done = balls_bowled / 6;
  const overs_remaining = balls_remaining / 6;

  if (runs_needed <= 0) {
    return {
      batting_team_win_prob: 100.0,
      bowling_team_win_prob: 0.0,
      runs_needed: 0,
      balls_remaining,
      wickets_remaining,
      required_run_rate: 0.0,
      current_run_rate: overs_done > 0 ? +(current_score / overs_done).toFixed(2) : 0,
      status: 'batting_team_won',
      is_fallback: true
    };
  }

  if (balls_remaining <= 0 || wickets_remaining <= 0) {
    return {
      batting_team_win_prob: 0.0,
      bowling_team_win_prob: 100.0,
      runs_needed,
      balls_remaining,
      wickets_remaining,
      required_run_rate: 0.0,
      current_run_rate: 0.0,
      status: 'bowling_team_won',
      is_fallback: true
    };
  }

  const rrr = overs_remaining > 0 ? runs_needed / overs_remaining : 999;
  const crr = overs_done > 0 ? current_score / overs_done : 0;

  let rrr_score = 0.01;
  if (rrr <= 6) rrr_score = 1.0;
  else if (rrr <= 8) rrr_score = 1.0 - (rrr - 6) * 0.08;
  else if (rrr <= 10) rrr_score = 0.84 - (rrr - 8) * 0.12;
  else if (rrr <= 13) rrr_score = 0.60 - (rrr - 10) * 0.11;
  else if (rrr <= 16) rrr_score = 0.27 - (rrr - 13) * 0.07;
  else rrr_score = Math.max(0.01, 0.06 - (rrr - 16) * 0.01);

  let wkt_score = 0.06;
  if (wickets_remaining >= 9) wkt_score = 1.0;
  else if (wickets_remaining >= 8) wkt_score = 0.95;
  else if (wickets_remaining >= 7) wkt_score = 0.88;
  else if (wickets_remaining >= 6) wkt_score = 0.78;
  else if (wickets_remaining >= 5) wkt_score = 0.65;
  else if (wickets_remaining >= 4) wkt_score = 0.50;
  else if (wickets_remaining >= 3) wkt_score = 0.35;
  else if (wickets_remaining === 2) wkt_score = 0.18;

  const balls_score = Math.min(1.0, balls_remaining / 72);
  const momentum = rrr > 0 ? Math.min(1.0, crr / rrr) : 1.0;

  let physics_prob = 0.42 * rrr_score + 0.33 * wkt_score + 0.15 * balls_score + 0.10 * momentum;
  physics_prob = Math.max(0.01, Math.min(0.99, physics_prob));

  const batting_prob = +(physics_prob * 100).toFixed(1);
  const bowling_prob = +( (1 - physics_prob) * 100).toFixed(1);

  return {
    batting_team_win_prob: batting_prob,
    bowling_team_win_prob: bowling_prob,
    runs_needed,
    balls_remaining,
    wickets_remaining,
    required_run_rate: +rrr.toFixed(2),
    current_run_rate: +crr.toFixed(2),
    overs_completed,
    status: 'in_progress',
    is_fallback: true
  };
};

export const getWinProb = async (data) => {
  try {
    const res = await API.post('/winprob', data);
    return res;
  } catch (err) {
    console.warn('Backend unavailable, calculating win probability locally:', err.message);
    const local = calculateLocalWinProb(data);
    return { data: local };
  }
};

export default API;
