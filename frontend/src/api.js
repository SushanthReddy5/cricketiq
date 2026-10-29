import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 15000,
});

export const predictWinner    = (data)   => API.post('/predict', data);
export const getSeasons       = ()       => API.get('/seasons');
export const getTeams         = ()       => API.get('/teams');
export const getVenues        = ()       => API.get('/venues');
export const getVenueStats    = (v)      => API.get(`/venue/${encodeURIComponent(v)}`);
export const getTossAnalysis  = (v)      => API.get('/toss', { params: { venue: v } });
export const getPlayers       = ()       => API.get('/players');
export const getMatchup       = (b, p)   => API.get('/matchup', { params: { batter: b, bowler: p } });
export const getPhaseStats    = (p, r)   => API.get('/phase', { params: { player: p, role: r } });
export const getWinProb       = (data)   => API.post('/winprob', data);

export default API;
