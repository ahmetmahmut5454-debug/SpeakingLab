import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface CharacterProps {
  type: "lily" | "junior";
  expression: "idle" | "happy" | "bored" | "talking";
  className?: string;
}

export const Character = ({ type, expression, className = "" }: CharacterProps) => {
  const isBored = expression === "bored";
  const isHappy = expression === "happy";
  const isTalking = expression === "talking";

  if (type === "lily") {
    return (
      <div className={`relative ${className}`}>
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_15px_15px_rgba(0,0,0,0.5)]"
          animate={isTalking ? { y: [0, -2, 0] } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <radialGradient id="faceGrad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFF1E6" />
              <stop offset="50%" stopColor="#FFDAC1" />
              <stop offset="100%" stopColor="#E2A68D" />
            </radialGradient>
            
            <radialGradient id="hairBaseGrad" cx="30%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#B68DF1" />
              <stop offset="50%" stopColor="#7A3BCF" />
              <stop offset="100%" stopColor="#41147A" />
            </radialGradient>
            
            <radialGradient id="hairFrontGrad" cx="40%" cy="20%" r="80%">
              <stop offset="0%" stopColor="#CDB4F6" />
              <stop offset="50%" stopColor="#9254DF" />
              <stop offset="100%" stopColor="#551BA8" />
            </radialGradient>

            <linearGradient id="scarfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>

            <radialGradient id="eyeWhiteGrad" cx="40%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="80%" stopColor="#E8EEF2" />
              <stop offset="100%" stopColor="#C4CED8" />
            </radialGradient>
            
            <radialGradient id="irisGrad" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#5CD3FF" />
              <stop offset="50%" stopColor="#1E80C1" />
              <stop offset="100%" stopColor="#083156" />
            </radialGradient>

            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.5" floodColor="#2A1054" />
            </filter>

            <filter id="hardShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.4" floodColor="#3D1C00" />
            </filter>

            <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feOffset dx="0" dy="6" />
              <feGaussianBlur stdDeviation="4" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="black" floodOpacity="0.25" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
          </defs>

          {/* Hair back (Base volume) */}
          <path 
            d="M 30 90 Q 30 30 100 30 Q 170 30 170 90 Q 180 150 140 170 Q 100 160 60 170 Q 20 150 30 90 Z" 
            fill="url(#hairBaseGrad)" 
            filter="url(#softShadow)" 
          />
          
          {/* Face Base */}
          <ellipse 
            cx="100" 
            cy="100" 
            rx="50" 
            ry="60" 
            fill="url(#faceGrad)" 
            filter="url(#hardShadow)" 
          />
          
          {/* Nose (Subtle 3D highlight/shadow) */}
          <path d="M 98 105 Q 100 115 105 112" stroke="#D18A73" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
          <ellipse cx="100" cy="110" rx="3" ry="2" fill="#FCA5A5" opacity="0.3" filter="blur(1px)" />

          {/* Blush (Yanak kızarması) */}
          <circle cx="65" cy="115" r="12" fill="#FCA5A5" opacity={isHappy ? "0.7" : "0.4"} filter="blur(4px)" />
          <circle cx="135" cy="115" r="12" fill="#FCA5A5" opacity={isHappy ? "0.7" : "0.4"} filter="blur(4px)" />

          {/* Hair front / Bangs */}
          <path 
            d="M 45 80 Q 70 40 100 50 Q 130 40 155 80 Q 150 110 135 85 Q 100 60 65 85 Q 50 110 45 80 Z" 
            fill="url(#hairFrontGrad)" 
            filter="url(#softShadow)" 
          />
          
          {/* Subtle hair highlights */}
          <path d="M 60 65 Q 80 55 95 65" stroke="#E2D1F9" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.4" filter="blur(1px)" />
          <path d="M 140 65 Q 120 55 105 65" stroke="#E2D1F9" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.4" filter="blur(1px)" />

          {/* Eyes */}
          <g transform="translate(0, 5)">
            {isBored ? (
              <g>
                {/* Rolling Eyes (Göz devirme) */}
                <ellipse cx="70" cy="90" rx="14" ry="12" fill="url(#eyeWhiteGrad)" filter="url(#innerShadow)" />
                <ellipse cx="130" cy="90" rx="14" ry="12" fill="url(#eyeWhiteGrad)" filter="url(#innerShadow)" />
                
                <motion.circle 
                  cx="70" cy="85" r="6" fill="url(#irisGrad)" 
                  animate={{ 
                    cy: [85, 87, 85],
                    cx: [70, 72, 70]
                  }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.5, 1] }}
                />
                <motion.circle 
                  cx="130" cy="85" r="6" fill="url(#irisGrad)" 
                  animate={{ 
                    cy: [85, 87, 85],
                    cx: [130, 132, 130]
                  }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.5, 1] }}
                />

                {/* Eye reflection */}
                <circle cx="68" cy="83" r="2" fill="white" opacity="0.8" />
                <circle cx="128" cy="83" r="2" fill="white" opacity="0.8" />

                {/* Heavy eyelids */}
                <path d="M 50 85 Q 70 80 88 88" stroke="#875A46" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
                <path d="M 112 88 Q 130 80 150 85" stroke="#875A46" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
                
                {/* Half closed lids shading */}
                <path d="M 50 85 Q 70 80 88 88 Q 70 95 50 85 Z" fill="#E2A68D" opacity="0.9" />
                <path d="M 112 88 Q 130 80 150 85 Q 130 95 112 88 Z" fill="#E2A68D" opacity="0.9" />
              </g>
            ) : isHappy ? (
              <g>
                {/* Closing eyes with high cheeks effect */}
                <path d="M 55 95 Q 70 85 85 95" stroke="#4A2610" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M 115 95 Q 130 85 145 95" stroke="#4A2610" strokeWidth="5" fill="none" strokeLinecap="round" />
                
                {/* Eyelashes */}
                <path d="M 55 95 L 50 92" stroke="#4A2610" strokeWidth="3" strokeLinecap="round" />
                <path d="M 145 95 L 150 92" stroke="#4A2610" strokeWidth="3" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                <ellipse cx="70" cy="92" rx="14" ry="16" fill="url(#eyeWhiteGrad)" filter="url(#innerShadow)" />
                <ellipse cx="130" cy="92" rx="14" ry="16" fill="url(#eyeWhiteGrad)" filter="url(#innerShadow)" />
                
                {/* Pupils with blinking */}
                <motion.circle 
                  cx="70" cy="92" r="8" fill="url(#irisGrad)"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
                <motion.circle 
                  cx="130" cy="92" r="8" fill="url(#irisGrad)"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />

                {/* Dark Pupil */}
                <motion.circle 
                  cx="70" cy="92" r="4" fill="#0A192F"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
                <motion.circle 
                  cx="130" cy="92" r="4" fill="#0A192F"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />

                {/* Eye reflection / catchlight */}
                <motion.circle 
                  cx="67" cy="88" r="3" fill="white" opacity="0.9"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
                <motion.circle 
                  cx="127" cy="88" r="3" fill="white" opacity="0.9"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
                
                {/* Small reflection */}
                <motion.circle 
                  cx="73" cy="95" r="1.5" fill="white" opacity="0.6"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
                <motion.circle 
                  cx="133" cy="95" r="1.5" fill="white" opacity="0.6"
                  animate={{ scaleY: [1, 1, 0.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />

                {/* Eyelids for blinking */}
                <motion.path 
                  d="M 50 92 Q 70 65 90 92" 
                  stroke="#E2A68D" 
                  strokeWidth="0" 
                  fill="none"
                  animate={{ strokeWidth: [0, 0, 30, 0] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
                <motion.path 
                  d="M 110 92 Q 130 65 150 92" 
                  stroke="#E2A68D" 
                  strokeWidth="0" 
                  fill="none"
                  animate={{ strokeWidth: [0, 0, 30, 0] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />

                {/* Eyebrows */}
                <path d="M 50 75 Q 70 68 85 78" stroke="#4A1689" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
                <path d="M 115 78 Q 130 68 150 75" stroke="#4A1689" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
              </g>
            )}
          </g>

          {/* Mouth */}
          <g transform="translate(0, 5)">
            {isTalking ? (
              <motion.ellipse
                cx="100"
                cy="125"
                rx="10"
                ry="8"
                fill="#59132E"
                filter="url(#innerShadow)"
                animate={{ ry: [4, 10, 4] }}
                transition={{ duration: 0.2, repeat: Infinity }}
              />
            ) : isHappy ? (
              <g>
                {/* Big smile with 3D depth */}
                <path d="M 75 125 Q 100 155 125 125 Q 100 145 75 125 Z" fill="#59132E" filter="url(#innerShadow)" />
                {/* Row of teeth */}
                <path 
                  d="M 80 127 Q 100 132 120 127 Q 100 135 80 127 Z" 
                  fill="white" 
                />
                {/* Tongue */}
                <path d="M 85 135 Q 100 145 115 135 Q 100 150 85 135 Z" fill="#E88894" />
                
                {/* Smile lines */}
                <path d="M 68 120 Q 72 128 78 125" stroke="#D18A73" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
                <path d="M 132 120 Q 128 128 122 125" stroke="#D18A73" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
              </g>
            ) : isBored ? (
              <path d="M 85 130 Q 100 125 115 130" stroke="#875A46" strokeWidth="3" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M 85 128 Q 100 135 115 128" stroke="#875A46" strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
          </g>

          {/* Scarf / Outfit (3D volume) */}
          <path 
            d="M 60 150 Q 100 175 140 150 L 150 170 Q 100 200 50 170 Z" 
            fill="url(#scarfGrad)" 
            filter="url(#hardShadow)" 
          />
          
          {/* Scarf folds for 3D effect */}
          <path d="M 80 155 Q 90 170 100 175" stroke="#300F6B" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" filter="blur(1px)" />
          <path d="M 120 155 Q 110 170 100 175" stroke="#300F6B" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" filter="blur(1px)" />

        </motion.svg>
      </div>
    );
  }

  return null; // Default
};
