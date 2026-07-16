import React from "react";
import { motion } from "motion/react";

interface MascotProps {
  outfit?: string;
  className?: string;
  isWalking?: boolean;
  isGreeting?: boolean;
}

export const Mascot = ({ outfit = "outfit_default", className = "", isWalking = false, isGreeting = false }: MascotProps) => {
  return (
    <div className={`relative ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-2xl"
        style={{ overflow: 'visible' }}
        initial={isWalking ? { y: 0 } : { rotate: -2 }}
        animate={isWalking ? { y: [-2, 2, -2] } : isGreeting ? { y: [0, -15, 0], scale: [1, 1.2, 1] } : { rotate: 2 }}
        transition={isWalking ? { duration: 0.3, repeat: Infinity, ease: "easeInOut" } : isGreeting ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <radialGradient id="bodyGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#A65D29" />
            <stop offset="100%" stopColor="#5C3110" />
          </radialGradient>
          <radialGradient id="bellyGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#E2C290" />
            <stop offset="100%" stopColor="#B38A56" />
          </radialGradient>
          <radialGradient id="tailGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4A2610" />
            <stop offset="100%" stopColor="#2A1406" />
          </radialGradient>
          <radialGradient id="snoutGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#F9D1D5" />
            <stop offset="100%" stopColor="#D499A0" />
          </radialGradient>
          <radialGradient id="eyeGrad" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#D0D0D0" />
          </radialGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Tail */}
        <motion.ellipse
          cx="80" cy="75" rx="20" ry="10" fill="url(#tailGrad)"
          animate={isWalking ? { rotate: [-5, 5, -5], transformOrigin: "60px 75px" } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          filter="url(#shadow)"
        />

        {/* Back Leg */}
        <motion.g
          style={{ transformOrigin: "65px 85px", transformBox: "view-box" }}
          animate={isWalking ? { rotate: [15, -15, 15] } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          <path d="M 65 85 L 70 95" fill="none" stroke="#5C3110" strokeWidth="12" strokeLinecap="round" />
          <path d="M 65 85 L 70 95" fill="none" stroke="url(#bodyGrad)" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="73" cy="95" rx="6" ry="4" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
        </motion.g>

        {/* Front Leg */}
        <motion.g
          style={{ transformOrigin: "35px 85px", transformBox: "view-box" }}
          animate={isWalking ? { rotate: [-15, 15, -15] } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          <path d="M 35 85 L 30 95" fill="none" stroke="#5C3110" strokeWidth="12" strokeLinecap="round" />
          <path d="M 35 85 L 30 95" fill="none" stroke="url(#bodyGrad)" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="27" cy="95" rx="6" ry="4" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
        </motion.g>

        {/* Body */}
        <ellipse cx="50" cy="65" rx="28" ry="32" fill="url(#bodyGrad)" filter="url(#shadow)" />
        <ellipse cx="48" cy="68" rx="20" ry="24" fill="url(#bellyGrad)" />

        {/* Arms */}
        {/* Left Arm */}
        <motion.g
          style={{ transformOrigin: "35px 55px", transformBox: "view-box" }}
          animate={isWalking ? { rotate: [15, -15, 15] } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          {/* Arm Base Outline */}
          <path d="M 35 55 Q 20 65 25 75" fill="none" stroke="#5C3110" strokeWidth="10" strokeLinecap="round" />
          {/* Arm Base Inner */}
          <path d="M 35 55 Q 20 65 25 75" fill="none" stroke="url(#bodyGrad)" strokeWidth="6" strokeLinecap="round" />
          
          {/* Fingers */}
          <circle cx="22" cy="74" r="3" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
          <circle cx="25" cy="77" r="3" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
          <circle cx="28" cy="74" r="3" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
        </motion.g>

        {/* Right Arm */}
        <motion.g
          style={{ transformOrigin: "65px 55px", transformBox: "view-box" }}
          animate={
            isWalking ? { rotate: [-15, 15, -15] } : 
            isGreeting ? { rotate: [0, -100, -70, -100, -70, -100, 0, 0, 0] } : 
            {}
          }
          transition={
            isWalking ? { duration: 0.4, repeat: Infinity } : 
            isGreeting ? { duration: 2.5, repeat: Infinity, times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 0.95, 1], ease: "easeInOut" } : 
            {}
          }
        >
          {/* Arm Base Outline */}
          <path d="M 65 55 Q 80 65 75 75" fill="none" stroke="#5C3110" strokeWidth="10" strokeLinecap="round" />
          {/* Arm Base Inner */}
          <path d="M 65 55 Q 80 65 75 75" fill="none" stroke="url(#bodyGrad)" strokeWidth="6" strokeLinecap="round" />

          {/* Default Hand */}
          <motion.g
            animate={isGreeting ? { opacity: [1, 1, 1, 1, 1, 1, 0, 0, 1] } : { opacity: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 0.95, 1] }}
          >
            <circle cx="78" cy="74" r="3" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
            <circle cx="75" cy="77" r="3" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
            <circle cx="72" cy="74" r="3" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
          </motion.g>

          {/* Thumbs Up Hand */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={isGreeting ? { opacity: [0, 0, 0, 0, 0, 0, 1, 1, 0] } : { opacity: 0 }}
            transition={{ duration: 2.5, repeat: Infinity, times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 0.95, 1] }}
          >
            {/* Thumb sticking out to the right */}
            <path d="M 72 70 L 83 67 A 2 2 0 0 1 85 71 L 76 74 Z" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1.5" strokeLinejoin="round" />
            {/* Folded Fingers */}
            <circle cx="76" cy="76" r="2.5" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
            <circle cx="73" cy="75" r="2.5" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
            <circle cx="70" cy="73" r="2.5" fill="url(#bellyGrad)" stroke="#5C3110" strokeWidth="1" />
          </motion.g>
        </motion.g>

        {/* Head */}
        <circle cx="50" cy="35" r="24" fill="url(#bodyGrad)" filter="url(#shadow)" />

        {/* Ears */}
        <circle cx="28" cy="22" r="8" fill="url(#bodyGrad)" filter="url(#shadow)" />
        <circle cx="28" cy="22" r="4" fill="url(#bellyGrad)" />
        <circle cx="72" cy="22" r="8" fill="url(#bodyGrad)" filter="url(#shadow)" />
        <circle cx="72" cy="22" r="4" fill="url(#bellyGrad)" />

        {/* Eyes (White part) */}
        <circle cx="40" cy="30" r="6" fill="url(#eyeGrad)" />
        <circle cx="60" cy="30" r="6" fill="url(#eyeGrad)" />

        {/* Pupils */}
        <circle cx="40" cy="30" r="3" fill="#1A0D04" />
        <circle cx="60" cy="30" r="3" fill="#1A0D04" />
        
        {/* Eye Highlights */}
        <circle cx="39" cy="29" r="1" fill="white" />
        <circle cx="59" cy="29" r="1" fill="white" />

        {/* Snout */}
        <ellipse cx="50" cy="42" rx="14" ry="10" fill="url(#snoutGrad)" filter="url(#shadow)" />
        
        {/* Nose */}
        <ellipse cx="50" cy="38" rx="5" ry="3" fill="#3D1D09" />
        <ellipse cx="49" cy="37" rx="1.5" ry="0.8" fill="white" opacity="0.6" />

        {/* Teeth */}
        <path d="M 45 48 L 45 56 Q 47 57 49 56 L 49 48 Z" fill="#FFFFFF" stroke="#D0D0D0" strokeWidth="1" />
        <path d="M 51 48 L 51 56 Q 53 57 55 56 L 55 48 Z" fill="#FFFFFF" stroke="#D0D0D0" strokeWidth="1" />

        {/* Cheeks */}
        <circle cx="38" cy="40" r="3" fill="#E88894" opacity="0.5" />
        <circle cx="62" cy="40" r="3" fill="#E88894" opacity="0.5" />

        {/* Outfits */}
        {outfit === "outfit_glasses" && (
          <g filter="drop-shadow(0 4px 4px rgba(0,0,0,0.6))">
             <path d="M 25 30 Q 40 25 50 30 Q 60 25 75 30" stroke="#1A1A1A" strokeWidth="3" fill="none" />
             <rect x="28" y="26" width="18" height="12" rx="3" fill="#111" opacity="0.8" stroke="#000" strokeWidth="2" />
             <rect x="54" y="26" width="18" height="12" rx="3" fill="#111" opacity="0.8" stroke="#000" strokeWidth="2" />
             <line x1="46" y1="30" x2="54" y2="30" stroke="#000" strokeWidth="2" />
          </g>
        )}
        {outfit === "outfit_cap" && (
          <g filter="drop-shadow(0 4px 4px rgba(0,0,0,0.6))">
             <path d="M 20 20 Q 50 5 80 20 L 75 15 Q 50 0 25 15 Z" fill="#E63946" />
             <ellipse cx="50" cy="18" rx="28" ry="12" fill="#E63946" />
             <path d="M 22 20 Q 50 25 78 20" fill="none" stroke="#FFFFFF" strokeWidth="1" />
             <circle cx="50" cy="10" r="3" fill="#1D3557" />
          </g>
        )}
        {outfit === "outfit_crown" && (
          <g filter="drop-shadow(0 4px 4px rgba(0,0,0,0.6))">
             <path d="M 30 18 L 25 0 L 40 10 L 50 -5 L 60 10 L 75 0 L 70 18 Z" fill="#F1C40F" stroke="#F39C12" strokeWidth="2" />
             <circle cx="25" cy="0" r="3" fill="#E74C3C" />
             <circle cx="50" cy="-5" r="4" fill="#3498DB" />
             <circle cx="75" cy="0" r="3" fill="#E74C3C" />
             <line x1="32" y1="14" x2="68" y2="14" stroke="#D35400" strokeWidth="2" />
          </g>
        )}
      </motion.svg>
    </div>
  );
};
