import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Home           from './pages/Home';
import PredictionPage from './pages/PredictionPage';
import WinProbPage    from './pages/WinProbPage';
import VenuePage      from './pages/VenuePage';
import MatchupPage    from './pages/MatchupPage';
import PhasePage      from './pages/PhasePage';
import TossPage       from './pages/TossPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Home />}/>
        <Route path="/prediction" element={<PredictionPage />}/>
        <Route path="/winprob"    element={<WinProbPage />}/>
        <Route path="/venue"      element={<VenuePage />}/>
        <Route path="/matchup"    element={<MatchupPage />}/>
        <Route path="/phase"      element={<PhasePage />}/>
        <Route path="/toss"       element={<TossPage />}/>
      </Routes>
    </BrowserRouter>
  );
}
