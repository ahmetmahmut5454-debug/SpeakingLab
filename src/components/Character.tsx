import React from "react";
import { motion } from "motion/react";

interface CharacterProps {
  type: "lily" | "detective" | "alien";
  expression?: "idle" | "talking" | "happy" | "bored";
  className?: string;
}

export const Character = ({ type, expression = "idle", className = "" }: CharacterProps) => {
  const isTalking = expression === "talking";
  const isHappy = expression === "happy";
  const isBored = expression === "bored";

  if (type === "lily") {
    return (
      <div className={`relative ${className}`}>
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl"
          initial={{ y: 10 }}
          animate={{ y: [10, 0, 10] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Defs for 3D Pixar Shading */}
          <defs>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.25" />
            </filter>
            <filter id="hairShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
            </filter>
            <filter id="hardShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
            </filter>
            <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feOffset dx="0" dy="-4"/>
              <feGaussianBlur stdDeviation="4" result="offset-blur"/>
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
              <feFlood floodColor="black" floodOpacity="0.2" result="color"/>
              <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
              <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
            </filter>
            <radialGradient id="skinGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFF1E8" />
              <stop offset="50%" stopColor="#FFD8C4" />
              <stop offset="100%" stopColor="#E2A68D" />
            </radialGradient>
            <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF7A7A" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#FF7A7A" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C2E9C" />
              <stop offset="50%" stopColor="#4A1689" />
              <stop offset="100%" stopColor="#2A0B55" />
            </linearGradient>
            <linearGradient id="hairHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9B59B6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#9B59B6" stopOpacity="0"/>
            </linearGradient>
            <radialGradient id="eyeWhiteGrad" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </radialGradient>
            <radialGradient id="irisGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="70%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#064E3B" />
            </radialGradient>
            <linearGradient id="scarfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>

          <g transform="translate(0, 10)">
            {/* Back Hair */}
            <path 
              d="M 50 150 Q 20 100 50 50 Q 100 10 150 50 Q 180 100 150 150 Z" 
              fill="url(#hairGrad)" 
              filter="url(#softShadow)" 
            />

            {/* Neck */}
            <path 
              d="M 80 130 L 80 160 Q 100 170 120 160 L 120 130 Z" 
              fill="#D18A73" 
            />
            {/* Neck Shadow */}
            <path 
              d="M 80 130 L 80 145 Q 100 155 120 145 L 120 130 Z" 
              fill="#B06550" 
              opacity="0.6"
            />

            {/* Head (Pixar Style Roundness) */}
            <ellipse 
              cx="100" 
              cy="95" 
              rx="55" 
              ry="60" 
              fill="url(#skinGrad)" 
              filter="url(#softShadow)" 
            />
            
            {/* Glowing Cheeks */}
            <circle cx="65" cy="115" r="16" fill="url(#cheekGrad)" />
            <circle cx="135" cy="115" r="16" fill="url(#cheekGrad)" />

            {/* Front Hair Volume */}
            <path 
              d="M 40 70 Q 50 10 100 15 Q 150 10 160 70 Q 150 40 100 35 Q 50 40 40 70 Z" 
              fill="url(#hairGrad)" 
              filter="url(#hairShadow)" 
            />
            <path 
              d="M 45 65 Q 70 35 100 40 Q 130 35 155 65 Q 140 45 100 50 Q 60 45 45 65 Z" 
              fill="url(#hairHighlight)" 
            />
            
            {/* Cute Hair Bangs */}
            <path d="M 100 35 Q 115 55 130 50 Q 115 65 100 55" fill="url(#hairGrad)" filter="url(#hairShadow)"/>
            <path d="M 100 35 Q 85 55 70 50 Q 85 65 100 55" fill="url(#hairGrad)" filter="url(#hairShadow)"/>

            {/* Eyes */}
            <g transform="translate(0, -5)">
              {isBored ? (
                <g>
                  {/* Rolling Eyes */}
                  <ellipse cx="68" cy="100" rx="16" ry="14" fill="url(#eyeWhiteGrad)" filter="url(#innerShadow)" />
                  <ellipse cx="132" cy="100" rx="16" ry="14" fill="url(#eyeWhiteGrad)" filter="url(#innerShadow)" />
                  
                  <motion.circle 
                    cx="68" cy="95" r="7" fill="url(#irisGrad)" 
                    animate={{ cy: [95, 97, 95], cx: [68, 70, 68] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.5, 1] }}
                  />
                  <motion.circle 
                    cx="132" cy="95" r="7" fill="url(#irisGrad)" 
                    animate={{ cy: [95, 97, 95], cx: [132, 134, 132] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.5, 1] }}
                  />
                  {/* Pupils */}
                  <circle cx="68" cy="95" r="3.5" fill="#0A192F" />
                  <circle cx="132" cy="95" r="3.5" fill="#0A192F" />
                  
                  {/* Eye reflection */}
                  <circle cx="66" cy="93" r="2.5" fill="white" opacity="0.9" />
                  <circle cx="130" cy="93" r="2.5" fill="white" opacity="0.9" />
                  
                  {/* Heavy eyelids */}
                  <path d="M 48 95 Q 68 88 88 98" stroke="#875A46" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
                  <path d="M 112 98 Q 132 88 152 95" stroke="#875A46" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
                  {/* Lids shading */}
                  <path d="M 48 95 Q 68 88 88 98 Q 68 105 48 95 Z" fill="#D5957C" opacity="0.95" />
                  <path d="M 112 98 Q 132 88 152 95 Q 132 105 112 98 Z" fill="#D5957C" opacity="0.95" />
                </g>
              ) : isHappy ? (
                <g>
                  {/* Happy closed eyes */}
                  <path d="M 50 105 Q 68 92 86 105" stroke="#4A2610" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <path d="M 114 105 Q 132 92 150 105" stroke="#4A2610" strokeWidth="6" fill="none" strokeLinecap="round" />
                  
                  {/* Eyelashes */}
                  <path d="M 50 105 L 44 100 M 58 98 L 54 90 M 86 105 L 92 100" stroke="#4A2610" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 150 105 L 156 100 M 142 98 L 146 90 M 114 105 L 108 100" stroke="#4A2610" strokeWidth="4" strokeLinecap="round" />
                </g>
              ) : (
                <g>
                  {/* Big Pixar Eyes */}
                  <ellipse cx="68" cy="102" rx="17" ry="20" fill="url(#eyeWhiteGrad)" filter="url(#innerShadow)" />
                  <ellipse cx="132" cy="102" rx="17" ry="20" fill="url(#eyeWhiteGrad)" filter="url(#innerShadow)" />
                  
                  {/* Irises */}
                  <motion.circle 
                    cx="68" cy="102" r="11" fill="url(#irisGrad)"
                    animate={{ scaleY: [1, 1, 0.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                  />
                  <motion.circle 
                    cx="132" cy="102" r="11" fill="url(#irisGrad)"
                    animate={{ scaleY: [1, 1, 0.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                  />
                  {/* Dark Pupil */}
                  <motion.circle cx="68" cy="102" r="5.5" fill="#0A192F" animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} />
                  <motion.circle cx="132" cy="102" r="5.5" fill="#0A192F" animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} />
                  
                  {/* Brilliant Catchlights (3D effect) */}
                  <motion.circle cx="63" cy="96" r="4" fill="white" opacity="0.95" animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} />
                  <motion.circle cx="127" cy="96" r="4" fill="white" opacity="0.95" animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} />
                  
                  <motion.circle cx="73" cy="106" r="2" fill="white" opacity="0.7" animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} />
                  <motion.circle cx="137" cy="106" r="2" fill="white" opacity="0.7" animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} />

                  {/* Eyelids for blinking */}
                  <motion.path 
                    d="M 48 102 Q 68 70 88 102" stroke="#D5957C" strokeWidth="0" fill="none"
                    animate={{ strokeWidth: [0, 0, 40, 0] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                  />
                  <motion.path 
                    d="M 112 102 Q 132 70 152 102" stroke="#D5957C" strokeWidth="0" fill="none"
                    animate={{ strokeWidth: [0, 0, 40, 0] }}
                    transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                  />
                  
                  {/* Top Eyelashes */}
                  <path d="M 48 100 Q 68 80 88 100" stroke="#4A2610" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 112 100 Q 132 80 152 100" stroke="#4A2610" strokeWidth="3" fill="none" strokeLinecap="round" />
                </g>
              )}

              {/* Eyebrows */}
              <path d="M 48 80 Q 68 70 85 82" stroke="#3A0B65" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
              <path d="M 115 82 Q 132 70 152 80" stroke="#3A0B65" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85" />
            </g>

            {/* Nose (Subtle 3D) */}
            <path d="M 100 110 Q 105 120 100 122 Q 95 120 100 110" fill="#D5957C" opacity="0.7" />
            <path d="M 94 120 Q 100 125 106 120" stroke="#C27A63" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />

            {/* Mouth */}
            <g transform="translate(0, 8)">
              {isTalking ? (
                <motion.ellipse
                  cx="100" cy="128" rx="12" ry="10" fill="#59132E" filter="url(#innerShadow)"
                  animate={{ ry: [6, 12, 6] }}
                  transition={{ duration: 0.2, repeat: Infinity }}
                />
              ) : isHappy ? (
                <g>
                  {/* Beautiful Pixar Smile */}
                  <path d="M 72 125 Q 100 160 128 125 Q 100 145 72 125 Z" fill="#59132E" filter="url(#innerShadow)" />
                  {/* Teeth */}
                  <path d="M 76 127 Q 100 135 124 127 Q 100 140 76 127 Z" fill="#FFFFFF" />
                  {/* Tongue */}
                  <path d="M 85 138 Q 100 150 115 138 Q 100 155 85 138 Z" fill="#FF8B8B" />
                  {/* Dimples */}
                  <path d="M 64 120 Q 68 128 75 126" stroke="#D18A73" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
                  <path d="M 136 120 Q 132 128 125 126" stroke="#D18A73" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
                </g>
              ) : isBored ? (
                <g>
                  <path d="M 85 132 Q 100 128 115 132" stroke="#875A46" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 82 134 Q 100 130 118 134" stroke="#D18A73" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
                </g>
              ) : (
                <g>
                  <path d="M 82 128 Q 100 138 118 128" stroke="#875A46" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Lips shading */}
                  <path d="M 82 128 Q 100 138 118 128 Q 100 132 82 128 Z" fill="#D5957C" opacity="0.6" />
                </g>
              )}
            </g>

            {/* Scarf / Outfit (3D volume) */}
            <path 
              d="M 55 155 Q 100 185 145 155 L 155 180 Q 100 215 45 180 Z" 
              fill="url(#scarfGrad)" 
              filter="url(#hardShadow)" 
            />
            {/* Scarf highlights/folds */}
            <path d="M 80 160 Q 90 180 100 185" stroke="#FEF3C7" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
            <path d="M 120 160 Q 110 180 100 185" stroke="#FEF3C7" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
          </g>
        </motion.svg>
      </div>
    );
  }

  return null; // Default
};
