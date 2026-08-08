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
          ? "0 0 40px rgba(96, 165, 250, 0.4)"
          : "0 0 0px rgba(96, 165, 250, 0)",
        scale: isActive ? 1.05 : 1,
      }}
      className={`relative rounded-full p-4 border flex items-center justify-center transition-colors duration-500 ${role ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-slate-900/10 bg-slate-900/5 text-slate-600/40"}`}
    >
      {renderIcon()}
    </motion.div>
  );
};

export const VoiceBar = React.memo(({
  level,
  color,
  isActive = false,
}: {
  level: number;
  color: string;
  isActive?: boolean;
  delayOffset?: number;
}) => {
  const bars = [1, 2, 3, 4, 5, 6, 7, 8];
  return (
    <div className="flex flex-col gap-1 items-center justify-end h-32 w-4" aria-hidden="true">
      {bars.map((i) => {
        const threshold = i * 12;
        const active = level > threshold;
        const isBreathing = isActive && level <= 12 && i <= 2;

        return (
          <div
            key={i}
            style={{
              backgroundColor: active ? color : "#1e1e1e",
              opacity: active ? 1 : isBreathing ? 0.4 : 0.2,
              boxShadow: active ? `0 0 10px ${color}` : "none",
              transition: "all 75ms ease-out",
            }}
            className="w-full h-2 rounded-sm"
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
      <div className="relative z-10 flex items-end justify-center gap-12 h-40" aria-hidden="true">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-[6px]">
            <VoiceBar level={userLevel} color="#34d399" isActive={isRunning} delayOffset={0} />
            <VoiceBar level={userLevel * 0.9} color="#34d399" isActive={isRunning} delayOffset={0.2} />
            <VoiceBar level={userLevel * 1.1} color="#34d399" isActive={isRunning} delayOffset={0.4} />
          </div>
        </div>

        <div className="mx-2 md:mx-6 self-center shrink-0">
          <RoleAvatar
            role={mode === "Task" ? role : undefined}
            isActive={botLevel > 15}
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-[6px]">
            <VoiceBar level={botLevel * 1.1} color="#60a5fa" isActive={isRunning} delayOffset={0.4} />
            <VoiceBar level={botLevel} color="#60a5fa" isActive={isRunning} delayOffset={0} />
            <VoiceBar level={botLevel * 0.9} color="#60a5fa" isActive={isRunning} delayOffset={0.2} />
          </div>
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
              className={`absolute left-10 bottom-10 flex flex-col gap-1 transition-opacity duration-300 ${userLevel > botLevel + 5 ? "opacity-100" : "opacity-40"}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400">
                Human
              </span>
              <span className="text-xs uppercase tracking-widest text-blue-200/50 font-medium">
                Transmitting
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`absolute right-10 bottom-10 flex flex-col items-end gap-1 transition-opacity duration-300 ${botLevel > userLevel + 5 ? "opacity-100" : "opacity-40"}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                AI Core
              </span>
              <span className="text-xs uppercase tracking-widest text-blue-200/50 font-medium">
                Processing
              </span>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
