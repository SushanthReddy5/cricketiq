import React from 'react';
import PageLayout from '../components/PageLayout';
import PhaseStats from '../components/PhaseStats';

export default function PhasePage() {
  return (
    <PageLayout
      title="Phase Analytics"
      icon="📈"
      desc="Powerplay · Middle overs · Death overs · Where players dominate"
      heroImage="/assets/hero-frames/img_21.jpg"
      accentColor="#f59e0b"
    >
      <PhaseStats />
    </PageLayout>
  );
}
