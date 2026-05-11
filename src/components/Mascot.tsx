import React from "react";
import { motion } from "motion/react";

interface MascotProps {
  outfit?: string;
  className?: string;
}

export const Mascot = ({ outfit = "outfit_default", className = "" }: MascotProps) => {
  return (
    <div className={`relative ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-xl"
        initial={{ rotate: -2 }}
        animate={{ rotate: 2 }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Beaver Body (Kunduz) */}
        <path
          d="M25,40 Q25,10 50,10 Q75,10 75,40 L80,80 Q50,90 20,80 Z"
          fill="#8B4513"
          stroke="#5D2E0A"
          strokeWidth="1"
        />
        
        {/* Belly */}
        <path
          d="M35,50 Q50,45 65,50 L70,75 Q50,85 30,75 Z"
          fill="#D2B48C"
        />

        {/* Tail (Flat like a beaver) */}
        <path
          d="M75,70 Q95,75 75,85"
          fill="#3E1F07"
        />

        {/* Ears */}
        <circle cx="30" cy="20" r="6" fill="#5D2E0A" />
        <circle cx="70" cy="20" r="6" fill="#5D2E0A" />

        {/* Eyes */}
        <circle cx="40" cy="35" r="4" fill="white" />
        <circle cx="60" cy="35" r="4" fill="white" />
        <circle cx="41" cy="35" r="2" fill="#000" />
        <circle cx="59" cy="35" r="2" fill="#000" />

        {/* Snout */}
        <path d="M42,45 Q50,55 58,45" fill="#FADADD" />
        <circle cx="50" cy="45" r="3" fill="#2D1504" />
        
        {/* Teeth (Key Beaver feature) */}
        <rect x="46" y="50" width="4" height="6" fill="white" rx="1" />
        <rect x="50" y="50" width="4" height="6" fill="white" rx="1" />

        {/* Outfits */}
        {outfit === "outfit_glasses" && (
          <g filter="drop-shadow(0 2px 2px rgba(0,0,0,0.5))">
             <text x="50" y="42" fontSize="18" textAnchor="middle">🕶️</text>
          </g>
        )}
        {outfit === "outfit_cap" && (
          <g filter="drop-shadow(0 2px 2px rgba(0,0,0,0.5))">
             <text x="50" y="18" fontSize="20" textAnchor="middle">🧢</text>
          </g>
        )}
        {outfit === "outfit_crown" && (
          <g filter="drop-shadow(0 2px 2px rgba(0,0,0,0.5))">
             <text x="50" y="15" fontSize="22" textAnchor="middle">👑</text>
          </g>
        )}
      </motion.svg>
    </div>
  );
};
