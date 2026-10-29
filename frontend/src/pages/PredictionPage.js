import React from 'react';
import PageLayout from '../components/PageLayout';
import Prediction from '../components/Prediction';

export default function PredictionPage() {
  return (
    <PageLayout
      title="Match Prediction"
      icon="🏆"
      desc="4-factor ML model · Squad strength · Venue history · Rolling form · H2H"
      heroImage="/assets/hero-frames/img_02.jpg"
      accentColor="#00F2FE"
    >
      <Prediction />
    </PageLayout>
  );
}
