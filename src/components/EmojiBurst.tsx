import React, { useEffect } from "react";
import { motion } from "motion/react";

export const EmojiBurst = ({
  icon,
  onComplete,
}: {
  icon: string;
  onComplete: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    angle: Math.random() * Math.PI * 2,
    speed: 50 + Math.random() * 150,
    size: 1 + Math.random() * 2,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.speed * 2,
            y: Math.sin(p.angle) * p.speed * 2,
            scale: p.size,
            rotate: p.rotation + 360,
            opacity: 0,
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute text-4xl"
        >
          {icon}
        </motion.div>
      ))}
    </div>
  );
};
