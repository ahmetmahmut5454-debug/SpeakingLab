import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ticket, Utensils, Headset, Home, Landmark, Briefcase, UserCircle } from "lucide-react";
import { audioLevelEmitter } from "../lib/audioLevelEmitter";

export const RoleAvatar = ({
  role,
  isActive,
}: {
  role?: string;
  isActive: boolean;
}) => {
  const renderIcon = () => {
    switch (role) {
      case "station":
        return <Ticket className="w-8 h-8" />;
      case "restaurant":
        return <Utensils className="w-8 h-8" />;
      case "support":
        return <Headset className="w-8 h-8" />;
      case "roommate":
        return <Home className="w-8 h-8" />;
      case "mayor":
        return <Landmark className="w-8 h-8" />;
      case "investor":
        return <Briefcase className="w-8 h-8" />;
      default:
        return <UserCircle className="w-8 h-8" />;
    }
  };

  return (
    <motion.div
      aria-label={role ? `Role avatar: ${role}` : "AI Tutor Avatar"}
      animate={{
        boxShadow: isActive
          ? "0 0 50px rgba(96, 165, 250, 0.6)"
          : "0 0 0px rgba(96, 165, 250, 0)",
        scale: isActive ? 1.1 : 1,
      }}
      className={`relative rounded-full p-4 border flex items-center justify-center transition-colors duration-500 z-20 ${role ? "border-blue-500/50 bg-blue-500/20 text-blue-300" : "border-slate-700/30 bg-slate-800/50 text-slate-400"}`}
    >
      {renderIcon()}
    </motion.div>
  );
};

export const SmoothWaveform = React.memo(({
  level,
  isUser,
  isActive = false,
}: {
  level: number;
  isUser: boolean;
  isActive?: boolean;
}) => {
  const numBars = 5;
  const clampedLevel = Math.max(0, Math.min(100, level));
  
  return (
    <div className="flex items-center justify-center gap-1.5 md:gap-2 h-32 w-24 md:w-32" aria-hidden="true">
      {Array.from({ length: numBars }).map((_, i) => {
        // Bell curve: highest in the middle
        const distance = Math.abs(i - Math.floor(numBars / 2));
        const bellFactor = 1 - (distance * 0.3);
        
        // Add a fixed but distinct multiplier per bar so they don't all move identically
        const noiseMultiplier = [0.8, 1.2, 1.0, 1.3, 0.7][i];
        
        // Base minimum height when active but silent, and reactive height when talking
        const minHeight = isActive ? 8 : 4;
        const activeHeight = Math.max(minHeight, clampedLevel * bellFactor * noiseMultiplier * 1.5);
        
        // Determine colors for gradient/glow
        const color = isUser 
           ? (i % 2 === 0 ? "#34d399" : "#facc15") // emerald / yellow for user
           : (i % 2 === 0 ? "#60a5fa" : "#c084fc"); // blue / purple for bot

        return (
          <motion.div
            key={i}
            animate={{ 
              height: isActive ? activeHeight : 4,
              opacity: isActive ? (clampedLevel > 5 ? 1 : 0.5) : 0.1
            }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25, 
              mass: 0.5 
            }}
            className="w-2 md:w-3 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: isActive && clampedLevel > 5 ? `0 0 16px ${color}, 0 0 32px ${color}` : "none",
            }}
          />
        );
      })}
    </div>
  );
});

export const AudioStageVisualizer = React.memo(({
  isRunning,
  role,
  mode,
}: {
  isRunning: boolean;
  role?: string;
  mode?: string;
}) => {
  const [userLevel, setUserLevel] = useState(0);
  const [botLevel, setBotLevel] = useState(0);

  useEffect(() => {
    const unsubUser = audioLevelEmitter.subscribeUser((lvl) => setUserLevel(lvl));
    const unsubBot = audioLevelEmitter.subscribeBot((lvl) => setBotLevel(lvl));

    return () => {
      unsubUser();
      unsubBot();
    };
  }, []);

  const statusText = !isRunning
    ? "Session stopped"
    : userLevel > botLevel + 5
    ? "Listening to student"
    : botLevel > userLevel + 5
    ? "AI Tutor speaking"
    : "Active connection - Waiting for audio";

  return (
    <>
      {/* Screen Reader Live Region */}
      <div className="sr-only" role="status" aria-live="polite">
        {statusText}
      </div>

      {/* Central Unified Synergy Visualizer */}
      <div className="relative z-10 flex items-center justify-center gap-4 md:gap-12 h-40 w-full" aria-hidden="true">
        {/* User Waveform */}
        <div className="flex-1 flex justify-end">
           <SmoothWaveform level={userLevel} isUser={true} isActive={isRunning} />
        </div>

        {/* Central Avatar */}
        <div className="shrink-0 relative">
          <RoleAvatar
            role={mode === "Task" ? role : undefined}
            isActive={botLevel > 15}
          />
          {/* Central ambient glow behind avatar based on conversation intensity */}
          <motion.div 
            className="absolute inset-0 rounded-full -z-10 mix-blend-screen"
            animate={{
              boxShadow: (userLevel > 10 || botLevel > 10) ? "0 0 80px 20px rgba(255,255,255,0.1)" : "0 0 0px 0px rgba(255,255,255,0)",
              scale: (userLevel > 10 || botLevel > 10) ? 1.5 : 1
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Bot Waveform */}
        <div className="flex-1 flex justify-start">
           <SmoothWaveform level={botLevel} isUser={false} isActive={isRunning} />
        </div>
      </div>

      {/* Dynamic Status Labels */}
      <AnimatePresence>
        {isRunning && (
          <>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`absolute left-6 md:left-10 bottom-6 md:bottom-10 flex flex-col gap-1 transition-opacity duration-500 ${userLevel > botLevel + 5 ? "opacity-100" : "opacity-40"}`}
            >
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
                Human
              </span>
              <span className="text-[9px] md:text-xs uppercase tracking-widest text-emerald-200/50 font-medium">
                Transmitting
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`absolute right-6 md:right-10 bottom-6 md:bottom-10 flex flex-col items-end gap-1 transition-opacity duration-500 ${botLevel > userLevel + 5 ? "opacity-100" : "opacity-40"}`}
            >
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                AI Core
              </span>
              <span className="text-[9px] md:text-xs uppercase tracking-widest text-blue-200/50 font-medium">
                Processing
              </span>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
