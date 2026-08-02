import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, CheckCircle2, Zap } from 'lucide-react';
import ReactConfetti from 'react-confetti';

interface Props {
  sessionsToday: number;
  goal: number;
}

export const DailyProgressBar: React.FC<Props> = ({ sessionsToday, goal }) => {
  const [animatedSessions, setAnimatedSessions] = useState(sessionsToday);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && sessionsToday > animatedSessions) {
      // Animate to the new value
      const timer = setTimeout(() => {
        setAnimatedSessions(sessionsToday);
        if (sessionsToday >= goal && animatedSessions < goal) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 5000);
        }
      }, 500); // slight delay
      return () => clearTimeout(timer);
    } else if (sessionsToday === 0) {
      setAnimatedSessions(0);
    } else if (!hasMounted) {
       setAnimatedSessions(sessionsToday);
    }
  }, [sessionsToday, goal, animatedSessions, hasMounted]);

  const progressPercentage = Math.min(100, (animatedSessions / goal) * 100);
  const isGoalReached = animatedSessions >= goal;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm z-50 px-4 py-3">
      {showCelebration && (
        <ReactConfetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.15}
          colors={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}
      
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2 whitespace-nowrap">
          {isGoalReached ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Target className="w-5 h-5 text-emerald-500" />
          )}
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-800">
            {isGoalReached ? "Daily Goal Met!" : "Daily Goal"}
          </span>
        </div>
        
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            <motion.div
              initial={{ width: `${Math.min(100, (Math.max(0, animatedSessions - 1) / goal) * 100)}%` }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
            >
              {/* Shine effect */}
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 skew-x-[-20deg] transform translate-x-1/2" />
            </motion.div>
          </div>
          <div className="flex items-center gap-1.5 min-w-[3.5rem] justify-end">
            <Zap className={`w-4 h-4 ${isGoalReached ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className={`text-sm font-black ${isGoalReached ? 'text-amber-500' : 'text-slate-500'}`}>
              <motion.span>
                {animatedSessions}
              </motion.span>
              <span className="text-slate-300 font-medium">/{goal}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
