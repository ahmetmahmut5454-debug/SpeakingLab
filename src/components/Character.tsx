import React from "react";
import { motion } from "motion/react";

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
          
          {/* Hair front / Bangs */}
          <path d="M55,80 Q100,50 145,80 L150,110 Q150,110 130,90 Q100,80 60,100 Z" fill="#8B5CF6" />
          
          {/* Eyes */}
          <g transform="translate(0, 5)">
            {isBored ? (
              <>
                <rect x="75" y="95" width="15" height="3" rx="1.5" fill="#2D3748" />
                <rect x="110" y="95" width="15" height="3" rx="1.5" fill="#2D3748" />
                {/* Eyelids for bored look */}
                <path d="M70,85 Q82,88 95,85" stroke="#7C3AED" strokeWidth="4" fill="none" opacity="0.3" />
                <path d="M105,85 Q118,88 130,85" stroke="#7C3AED" strokeWidth="4" fill="none" opacity="0.3" />
              </>
            ) : isHappy ? (
              <>
                <path d="M75,100 Q82,90 90,100" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M110,100 Q117,90 125,100" stroke="#2D3748" strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="82" cy="100" r="5" fill="#2D3748" />
                <circle cx="118" cy="100" r="5" fill="#2D3748" />
              </>
            )}
          </g>

          {/* Mouth */}
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
          ) : isBored ? (
            <path d="M90,130 Q100,128 110,130" stroke="#702459" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M90,125 Q100,135 110,125" stroke="#702459" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* Scarf / Outfit */}
          <path d="M65,145 Q100,165 135,145 L140,160 Q100,180 60,160 Z" fill="#5B21B6" />
        </motion.svg>
      </div>
    );
  }

  return null; // Default
};
