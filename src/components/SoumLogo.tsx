import React from 'react';

interface SoumLogoProps {
  className?: string;
  withText?: boolean;
}

export default function SoumLogo({ className = "w-full h-full", withText = true }: SoumLogoProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="soum-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.15" />
          <stop offset="70%" stopColor="#4facfe" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
        </radialGradient>
        <filter id="soum-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="soum-text-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#bdf4ff" />
        </linearGradient>
      </defs>
      
      {/* Deep Background Glow */}
      <circle cx="100" cy="100" r="90" fill="url(#soum-glow)" />
      
      {/* Outer faint ring */}
      <circle cx="100" cy="100" r="92" fill="none" stroke="#4facfe" strokeWidth="0.5" strokeDasharray="2 6" opacity="0.4" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#4facfe" strokeWidth="1" opacity="0.2" />

      {/* Main thick glowing cyan ring */}
      <circle cx="100" cy="100" r="75" fill="none" stroke="#00f2fe" strokeWidth="3" opacity="0.9" />
      <circle cx="100" cy="100" r="75" fill="none" stroke="#4facfe" strokeWidth="8" opacity="0.3" filter="url(#soum-blur)" />
      
      {/* Chunky Top-Left Cyan Arc */}
      <path d="M 35 50 A 90 90 0 0 1 75 18" fill="none" stroke="#00f2fe" strokeWidth="12" opacity="0.6" strokeLinecap="butt" />

      {/* Orange accent segment (Top-Left inner) */}
      <path d="M 45 60 A 70 70 0 0 1 80 32" fill="none" stroke="#f97316" strokeWidth="8" opacity="0.9" strokeDasharray="10 2" />
      <path d="M 45 60 A 70 70 0 0 1 80 32" fill="none" stroke="#f97316" strokeWidth="12" opacity="0.3" filter="url(#soum-blur)" />
      
      {/* Dashed inner tracking ring */}
      <circle cx="100" cy="100" r="62" fill="none" stroke="#00f2fe" strokeWidth="5" strokeDasharray="16 4" opacity="0.8" />
      
      {/* Inner solid boundary ring */}
      <circle cx="100" cy="100" r="50" fill="none" stroke="#4facfe" strokeWidth="1.5" opacity="0.5" />
      
      {/* HUD Crosshairs / Details */}
      <line x1="100" y1="5" x2="100" y2="15" stroke="#4facfe" strokeWidth="1" opacity="0.6" />
      <line x1="100" y1="185" x2="100" y2="195" stroke="#4facfe" strokeWidth="1" opacity="0.6" />
      <line x1="5" y1="100" x2="15" y2="100" stroke="#4facfe" strokeWidth="1" opacity="0.6" />
      <line x1="185" y1="100" x2="195" y2="100" stroke="#4facfe" strokeWidth="1" opacity="0.6" />

      {/* Center Text block */}
      {withText && (
        <g>
          <text x="100" y="96" fontFamily="Outfit, sans-serif" fontSize="32" fontWeight="800" fill="url(#soum-text-grad)" textAnchor="middle" letterSpacing="1.5">SOUM</text>
          <text x="100" y="112" fontFamily="Outfit, sans-serif" fontSize="10" fontWeight="600" fill="#00f2fe" textAnchor="middle" letterSpacing="2">AI COMPANION</text>
          <text x="100" y="122" fontFamily="Outfit, sans-serif" fontSize="5" fontWeight="400" fill="#888888" textAnchor="middle" letterSpacing="1">VERSION 1.0 / EST. 2026</text>
        </g>
      )}
    </svg>
  );
}
