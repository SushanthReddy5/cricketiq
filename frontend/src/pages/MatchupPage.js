import React from 'react';
import PageLayout from '../components/PageLayout';
import Matchup from '../components/Matchup';

export default function MatchupPage() {
  return (
    <PageLayout
      title="Head to Head"
      icon="⚔️"
      desc="Every batter vs bowler duel in IPL history · Radar profile · Tactical analysis"
      heroImage="/assets/hero-frames/img_20.jpg"
      accentColor="#8b5cf6"
    >
      <Matchup />
    </PageLayout>
  );
}
