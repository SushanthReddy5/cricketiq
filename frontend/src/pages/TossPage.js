import React from 'react';
import PageLayout from '../components/PageLayout';
import TossAnalysis from '../components/TossAnalysis';

export default function TossPage() {
  return (
    <PageLayout
      title="Toss Impact"
      icon="🪙"
      desc="Does the toss matter? Venue-by-venue toss winner win rates · Bat vs field"
      heroImage="/assets/hero-frames/img_22.jpg"
      accentColor="#FF1744"
    >
      <TossAnalysis />
    </PageLayout>
  );
}
