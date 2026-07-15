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
        <motion.path
          d="M 60 80 Q 65 95 75 95 Q 75 90 65 80" fill="url(#bodyGrad)"
          animate={isWalking ? { rotate: [15, -15, 15], transformOrigin: "60px 80px" } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        />

        {/* Front Leg */}
        <motion.path
          d="M 35 80 Q 30 95 20 95 Q 30 90 40 80" fill="url(#bodyGrad)"
          animate={isWalking ? { rotate: [-15, 15, -15], transformOrigin: "40px 80px" } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        />

        {/* Body */}
        <ellipse cx="50" cy="65" rx="28" ry="32" fill="url(#bodyGrad)" filter="url(#shadow)" />
        <ellipse cx="48" cy="68" rx="20" ry="24" fill="url(#bellyGrad)" />

        {/* Arms */}
        <motion.path
          d="M 30 55 Q 15 65 25 70" fill="url(#bodyGrad)" stroke="#5C3110" strokeWidth="2" strokeLinecap="round"
          animate={isWalking ? { rotate: [10, -10, 10], transformOrigin: "30px 55px" } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
        <motion.g
          animate={
            isWalking ? { rotate: [-10, 10, -10], transformOrigin: "70px 55px" } : 
            isGreeting ? { rotate: [0, -130, -100, -130, -100, -130, -130, 0], transformOrigin: "70px 55px" } : 
            {}
          }
          transition={
            isWalking ? { duration: 0.4, repeat: Infinity } : 
            isGreeting ? { duration: 3, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1] } : 
            {}
          }
        >
          {/* Default Hand */}
          <motion.path
            d="M 70 55 Q 85 65 75 70" fill="url(#bodyGrad)" stroke="#5C3110" strokeWidth="2" strokeLinecap="round"
            animate={isGreeting ? { opacity: [1, 1, 1, 1, 1, 0, 0, 1] } : { opacity: 1 }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1] }}
          />
          {/* Thumbs Up Hand Base */}
          <motion.path
            d="M 70 55 Q 85 65 75 70" fill="url(#bodyGrad)" stroke="#5C3110" strokeWidth="2" strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={isGreeting ? { opacity: [0, 0, 0, 0, 0, 1, 1, 0] } : { opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1] }}
          />
          {/* Thumbs Up Thumb (Sticking out) */}
          <motion.path
            d="M 75 68 Q 81 66 82 62 Q 78 59 74 65" fill="url(#bodyGrad)" stroke="#5C3110" strokeWidth="1.5" strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={isGreeting ? { opacity: [0, 0, 0, 0, 0, 1, 1, 0] } : { opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1] }}
          />
          {/* Thumbs Up Folded Fingers */}
          <motion.path
            d="M 73 69 Q 70 71 73 72 Q 71 73 73 74" fill="none" stroke="#5C3110" strokeWidth="1.5" strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={isGreeting ? { opacity: [0, 0, 0, 0, 0, 1, 1, 0] } : { opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1] }}
          />
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
