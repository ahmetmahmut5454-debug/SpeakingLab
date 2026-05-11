import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Character } from "./Character";

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
        {/* Character Avatar (Lily Style) */}
        <div className="relative -ml-4 z-10 scale-x-[-1]">
          <Character
            type="lily"
            expression={state === "bored" ? "bored" : "idle"}
            className="w-32 h-32 md:w-48 md:h-48"
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
          {/* Bubble Tail */}
          <div className="absolute bottom-0 left-0 -mb-2 w-4 h-4 bg-white border-b border-l border-slate-200 transform -rotate-45" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
