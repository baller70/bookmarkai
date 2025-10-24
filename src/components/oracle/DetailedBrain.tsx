import React from 'react';

interface DetailedBrainProps {
  className?: string;
}

export const DetailedBrain: React.FC<DetailedBrainProps> = ({ className = "w-10 h-10" }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main brain outline */}
      <path
        d="M50 15C35 15 25 25 20 35C15 30 10 35 12 45C8 50 10 60 15 65C20 75 30 85 50 85C70 85 80 75 85 65C90 60 92 50 88 45C90 35 85 30 80 35C75 25 65 15 50 15Z"
        fill="currentColor"
        opacity="0.9"
      />
      
      {/* Left hemisphere details */}
      <path
        d="M25 40C30 35 35 38 40 42C42 45 38 48 35 50C32 52 28 50 25 47C22 44 22 42 25 40Z"
        fill="currentColor"
        opacity="0.7"
      />
      
      {/* Right hemisphere details */}
      <path
        d="M75 40C70 35 65 38 60 42C58 45 62 48 65 50C68 52 72 50 75 47C78 44 78 42 75 40Z"
        fill="currentColor"
        opacity="0.7"
      />
      
      {/* Cerebellum */}
      <path
        d="M45 75C48 78 52 78 55 75C58 72 56 68 52 70C48 72 45 75 45 75Z"
        fill="currentColor"
        opacity="0.8"
      />
      
      {/* Brain stem */}
      <path
        d="M48 82C49 84 51 84 52 82C52 80 50 78 48 80C46 82 48 82 48 82Z"
        fill="currentColor"
        opacity="0.6"
      />
      
      {/* Frontal lobe lines */}
      <path
        d="M30 30C35 28 40 30 45 32"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
        fill="none"
      />
      <path
        d="M55 32C60 30 65 28 70 30"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
        fill="none"
      />
      
      {/* Temporal lobe lines */}
      <path
        d="M25 50C30 52 35 54 40 56"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
        fill="none"
      />
      <path
        d="M60 56C65 54 70 52 75 50"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
        fill="none"
      />
      
      {/* Central sulcus */}
      <path
        d="M50 25C50 35 50 45 50 55"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
        fill="none"
      />
      
      {/* Parietal lobe details */}
      <path
        d="M35 60C40 58 45 60 50 62C55 60 60 58 65 60"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
        fill="none"
      />
    </svg>
  );
}; 