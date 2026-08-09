import React from 'react';
import { motion, AnimatePresence } from "motion/react";

interface OnboardingModalProps {
  showOnboarding: boolean;
  isRunning: boolean;
  showPreTask: boolean;
  showHistory: boolean;
  report: any; // We can use 'any' or proper type if imported
  setShowOnboarding: (show: boolean) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  showOnboarding,
  isRunning,
  showPreTask,
  showHistory,
  report,
  setShowOnboarding,
}) => {
  return (
    <AnimatePresence>
      {showOnboarding &&
        !isRunning &&
        !showPreTask &&
        !showHistory &&
        !report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 max-w-sm w-full"
          >
            <div className="bg-white border border-slate-900/10 p-8 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-emerald-500/10">
                🎓
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-2">
                Let's do practice together!
              </h2>
              <p className="text-slate-600/70 font-medium text-sm leading-relaxed mb-6">
                Pick a scenario from the selector below, review your briefing, and
                start speaking. I'll track your English level and reward you
                with Points and cool new items!
              </p>
              <button
                onClick={() => setShowOnboarding(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-yellow-500 text-blue-950 font-bold uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(250,204,21,0.3)]"
              >
                Start Learning
              </button>
            </div>
          </motion.div>
        )}
    </AnimatePresence>
  );
};
