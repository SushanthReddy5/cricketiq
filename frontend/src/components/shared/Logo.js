import React from 'react';
export default function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill="url(#lg)"/>
      <rect x="9" y="7" width="4" height="17" rx="2" fill="white" opacity="0.95"
        transform="rotate(-18 16 16)"/>
      <circle cx="24" cy="13" r="4.5" fill="white" opacity="0.9"/>
      <path d="M22 11.5 Q24 13 26 11.5" stroke="#E8622A" strokeWidth="0.8" fill="none"/>
      <path d="M22.5 14.5 Q24 13 25.5 14.5" stroke="#E8622A" strokeWidth="0.8" fill="none"/>
      <rect x="12" y="24" width="1.5" height="5" rx="0.75" fill="white" opacity="0.8"/>
      <rect x="15" y="24" width="1.5" height="5" rx="0.75" fill="white" opacity="0.8"/>
      <rect x="18" y="24" width="1.5" height="5" rx="0.75" fill="white" opacity="0.8"/>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8622A"/>
          <stop offset="1" stopColor="#B84010"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
