import React from 'react';
import PageLayout from '../components/PageLayout';
import WinProb from '../components/WinProb';

export default function WinProbPage() {
  return (
    <PageLayout
      title="Win Probability Engine"
      icon="📊"
      desc="Enter live match situation · Historical similarity lookup · Real-time momentum"
      heroImage="/assets/hero-frames/img_18.jpg"
      accentColor="#00E676"
    >
      <WinProb />
    </PageLayout>
  );
}
