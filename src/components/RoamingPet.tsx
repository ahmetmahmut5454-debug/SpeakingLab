import React, { useState, useEffect } from "react";
import { motion, useAnimation } from "motion/react";
import { Mascot } from "./Mascot";

interface RoamingPetProps {
  outfit?: string;
}

export const RoamingPet = ({ outfit }: RoamingPetProps) => {
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isWalking, setIsWalking] = useState(true);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    // Basic random roaming logic
    const interval = setInterval(() => {
      const shouldWalk = Math.random() > 0.3; // 70% chance to be walking
      setIsWalking(shouldWalk);
      
      if (shouldWalk) {
        const shouldFlip = Math.random() > 0.8; // 20% chance to flip direction
        let newDir = direction;
        if (shouldFlip) {
          newDir = direction === "right" ? "left" : "right";
          setDirection(newDir);
        }
        
        // Move
        const moveAmount = Math.random() * 15 + 5; // 5 to 20 vw
        let newPos = newDir === "right" ? position + moveAmount : position - moveAmount;
        
        // Bounds checking
        if (newPos > 80) {
          newPos = 80;
          setDirection("left");
        } else if (newPos < 0) {
          newPos = 0;
          setDirection("right");
        }
        
        setPosition(newPos);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [direction, position]);

  return (
    <motion.div
      className="fixed bottom-0 z-50 pointer-events-none"
      initial={{ left: "0vw" }}
      animate={{ 
        left: `${position}vw`,
      }}
      transition={{ type: "tween", ease: "linear", duration: 3 }}
    >
      <motion.div
        animate={{ scaleX: direction === "right" ? 1 : -1 }}
        transition={{ duration: 0.3 }}
      >
        <Mascot 
          className="w-24 h-24 md:w-32 md:h-32 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" 
          outfit={outfit} 
          isWalking={isWalking}
        />
      </motion.div>
    </motion.div>
  );
};
