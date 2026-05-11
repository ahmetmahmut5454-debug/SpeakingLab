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
          className="w-full h-full drop-shadow-2xl"
          animate={isTalking ? { y: [0, -2, 0] } : {}}
          transition={{ duration: 0.4, repeat: Infinity }}
        >
          {/* Hair back */}
          <path d="M40,80 Q40,40 100,40 Q160,40 160,80 L170,140 Q100,150 30,140 Z" fill="#7C3AED" />
          
          {/* Face */}
          <path d="M60,80 Q60,60 100,60 Q140,60 140,80 L145,130 Q100,160 55,130 Z" fill="#FFDBAC" />
          
          {/* Blush (Yanak kızarması) */}
          <AnimatePresence>
            {isHappy && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <circle cx="75" cy="115" r="8" fill="#FCA5A5" opacity="0.6" filter="blur(2px)" />
                <circle cx="125" cy="115" r="8" fill="#FCA5A5" opacity="0.6" filter="blur(2px)" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Hair front / Bangs */}
          <path d="M55,80 Q100,50 145,80 L150,110 Q150,110 130,90 Q100,80 60,100 Z" fill="#8B5CF6" />
          
          {/* Eyes */}
          <g transform="translate(0, 5)">
            {isBored ? (
              <g>
                {/* Rolling Eyes (Göz devirme) */}
                <circle cx="82" cy="100" r="7" fill="white" />
                <circle cx="118" cy="100" r="7" fill="white" />
                <motion.circle 
                  cx="82" cy="100" r="3.5" fill="#2D3748" 
                  animate={{ 
                    cy: [100, 92, 92, 100],
                    cx: [82, 85, 79, 82]
                  }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
                />
                <motion.circle 
                  cx="118" cy="100" r="3.5" fill="#2D3748" 
                  animate={{ 
                    cy: [100, 92, 92, 100],
                    cx: [118, 121, 115, 118]
                  }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
                />
                {/* Heavy eyelids */}
                <motion.path 
                  d="M70,90 Q82,90 95,90" 
                  stroke="#FFDBAC" 
                  strokeWidth="8" 
                  fill="none"
                  animate={{ d: ["M70,90 Q82,90 95,90", "M70,95 Q82,95 95,95", "M70,90 Q82,90 95,90"] }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                />
                <motion.path 
                  d="M105,90 Q118,90 130,90" 
                  stroke="#FFDBAC" 
                  strokeWidth="8" 
                  fill="none"
                  animate={{ d: ["M105,90 Q118,90 130,90", "M105,95 Q118,95 130,95", "M105,90 Q118,90 130,90"] }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                />
              </g>
            ) : isHappy ? (
              <g>
                {/* Closing eyes with high cheeks effect */}
                <path d="M72,105 Q82,92 92,105" stroke="#2D3748" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M108,105 Q118,92 128,105" stroke="#2D3748" strokeWidth="4" fill="none" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                <circle cx="82" cy="100" r="6" fill="white" />
                <circle cx="118" cy="100" r="6" fill="white" />
                {/* Pupils with blinking */}
                <motion.circle 
                  cx="82" cy="100" r="3" fill="#2D3748"
                  animate={{ scaleY: [1, 1, 0, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
                <motion.circle 
                  cx="118" cy="100" r="3" fill="#2D3748"
                  animate={{ scaleY: [1, 1, 0, 1] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
                {/* Eyelids for blinking */}
                <motion.path 
                  d="M72,94 Q82,94 92,94" 
                  stroke="#FFDBAC" 
                  strokeWidth="0" 
                  fill="none"
                  animate={{ strokeWidth: [0, 0, 12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
                <motion.path 
                  d="M108,94 Q118,94 128,94" 
                  stroke="#FFDBAC" 
                  strokeWidth="0" 
                  fill="none"
                  animate={{ strokeWidth: [0, 0, 12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }}
                />
              </g>
            )}
          </g>

          {/* Mouth */}
          <g transform="translate(0, 5)">
            {isTalking ? (
              <motion.ellipse
                cx="100"
                cy="125"
                rx="8"
                ry="4"
                fill="#702459"
                animate={{ ry: [2, 6, 2] }}
                transition={{ duration: 0.2, repeat: Infinity }}
              />
            ) : isHappy ? (
              <g>
                {/* Big smile with more realistic teeth */}
                <path d="M82,128 Q100,148 118,128 Z" fill="#702459" />
                {/* Row of teeth - thin and natural */}
                <path 
                  d="M91,129 Q100,130.5 109,129 L108.5,132 Q100,134 91.5,132 Z" 
                  fill="white" 
                />
                {/* Very subtle tooth separators */}
                <g opacity="0.12">
                  <rect x="94.5" y="129" width="0.4" height="3" fill="#702459" />
                  <rect x="98.2" y="129.5" width="0.4" height="4" fill="#702459" />
                  <rect x="101.8" y="129.5" width="0.4" height="4" fill="#702459" />
                  <rect x="105.5" y="129" width="0.4" height="3" fill="#702459" />
                </g>
                {/* Subtle tongue / depth */}
                <path d="M92,142 Q100,146 108,142" stroke="#FF9999" strokeWidth="1.5" fill="none" opacity="0.3" />
              </g>
            ) : isBored ? (
              <path d="M92,135 Q100,132 108,135" stroke="#702459" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M90,130 Q100,138 110,130" stroke="#702459" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            )}
          </g>

          {/* Scarf / Outfit */}
          <path d="M65,145 Q100,165 135,145 L140,160 Q100,180 60,160 Z" fill="#5B21B6" />
        </motion.svg>
      </div>
    );
  }

  return null; // Default
};
