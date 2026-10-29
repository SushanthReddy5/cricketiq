import React from 'react';
import PageLayout from '../components/PageLayout';
import VenueStats from '../components/VenueStats';

export default function VenuePage() {
  return (
    <PageLayout
      title="Venue Analytics"
      icon="🏟️"
      desc="40 IPL venues · 1st innings averages · Spin vs pace index · Toss decisions"
      heroImage="/assets/hero-frames/img_19.jpg"
      accentColor="#FFD700"
    >
      <VenueStats />
    </PageLayout>
  );
}
