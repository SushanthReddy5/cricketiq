import axios from 'axios';
import defaultVenues from './data/venues.json';
import defaultSeasons from './data/seasons.json';
import defaultPlayers from './data/players.json';
import defaultVenueStats from './data/venue_stats.json';
import defaultTossStats from './data/toss_stats.json';

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

export const predictWinner = (data) => API.post('/predict', data);

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
