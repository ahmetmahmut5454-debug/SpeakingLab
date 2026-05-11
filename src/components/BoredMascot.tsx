import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mascot } from "./Mascot";

export const BoredMascot = ({
  isRunning,
  outfit,
  onStartPractice,
}: {
  isRunning: boolean;
  outfit?: string;
  onStartPractice: () => void;
}) => {
  const [showBored, setShowBored] = useState(false);

  useEffect(() => {
    if (isRunning) {
      setShowBored(false);
      return;
    }

    // Wait 12 seconds of inactivity to prompt the user
    const timer = setTimeout(() => {
      setShowBored(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [isRunning]);

  return (
    <AnimatePresence>
      {showBored && (
        <motion.div
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 200, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-30 flex items-end gap-3 flex-col sm:flex-row-reverse"
        >
          <Mascot
            expression="bored"
            outfit={outfit}
            className="w-28 h-28 md:w-36 md:h-36 drop-shadow-2xl"
          />
          <motion.div
            initial={{ scale: 0, originX: 1, originY: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="bg-white px-5 py-3 md:py-4 md:px-6 rounded-2xl rounded-br-none shadow-xl border border-slate-200 mb-6 relative hover:shadow-2xl transition-shadow cursor-pointer"
            onClick={() => {
              setShowBored(false);
              onStartPractice();
            }}
          >
            <p className="font-extrabold text-slate-800 text-sm md:text-base leading-tight">
              Aren't we going to practice? 🦉
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Don't let your streak freeze! Click to start.
            </p>
            {/* Small triangle for speech bubble */}
            <div className="absolute -bottom-3 right-4 w-4 h-4 bg-white border-b border-r border-slate-200 transform rotate-45" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
