import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface GuideProps {
  isRunning: boolean;
  onStartPractice: () => void;
}

export const Guide = ({ isRunning, onStartPractice }: GuideProps) => {
  const [state, setState] = useState<"greeting" | "bored" | "hidden">(
    "greeting",
  );

  useEffect(() => {
    if (isRunning) {
      setState("hidden");
      return;
    }

    setState("greeting");

    // Switch to bored after 10 seconds of inactivity
    const timer = setTimeout(() => {
      setState("bored");
    }, 10000);

    return () => clearTimeout(timer);
  }, [isRunning]);

  if (state === "hidden") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-30 flex items-end gap-0"
      >
        {/* 3D Human Avatar (Like Lily/Oscar) */}
        <div className="relative -ml-4 z-10">
          <img
            src="https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=256&h=256"
            alt="Guide"
            className="w-28 h-28 md:w-40 md:h-40 rounded-full object-cover shadow-2xl border-4 border-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
          />
        </div>

        {/* Speech Bubble */}
        <motion.div
          key={state}
          initial={{ scale: 0, originX: 0, originY: 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="bg-white px-5 py-4 md:py-5 md:px-6 rounded-3xl rounded-bl-none shadow-xl border border-slate-200 mb-12 -ml-6 relative hover:shadow-2xl transition-shadow cursor-pointer max-w-[200px] md:max-w-[250px] z-20"
          onClick={onStartPractice}
        >
          <p className="font-extrabold text-slate-800 text-sm md:text-base leading-tight">
            {state === "greeting"
              ? "Let's do practice together! 🚀"
              : "I'm bored... aren't we going to practice? 🥱"}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-2 uppercase tracking-wide">
            Click here to start
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
