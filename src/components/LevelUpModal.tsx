import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Sparkles, ChevronUp, X } from 'lucide-react';
import ReactConfetti from 'react-confetti';

interface Props {
  badgeId: string;
  onClose: () => void;
}

export const LevelUpModal: React.FC<Props> = ({ badgeId, onClose }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  const getLevelInfo = () => {
    switch(badgeId) {
      case "badge_level_a2": return { title: "A2 Pioneer", level: "A2", color: "from-teal-400 to-emerald-500", icon: "🌱" };
      case "badge_level_b1": return { title: "B1 Achiever", level: "B1", color: "from-blue-400 to-indigo-500", icon: "🚀" };
      case "badge_level_b2": return { title: "B2 Specialist", level: "B2", color: "from-indigo-400 to-violet-500", icon: "🔥" };
      case "badge_level_c1": return { title: "C1 Master", level: "C1", color: "from-purple-400 to-pink-500", icon: "👑" };
      default: return { title: "Level Up!", level: "??", color: "from-amber-400 to-orange-500", icon: "⭐" };
    }
  };

  const info = getLevelInfo();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      {dimensions.width > 0 && (
        <ReactConfetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
          colors={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']}
        />
      )}
      
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="relative bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20 overflow-hidden"
      >
        <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${info.color}`} />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.2, damping: 15 }}
            className={`w-32 h-32 rounded-full mb-6 flex items-center justify-center text-6xl shadow-2xl bg-gradient-to-br ${info.color} text-white border-4 border-white`}
          >
            {info.icon}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2 text-amber-500 font-bold tracking-widest uppercase text-sm">
              <Sparkles className="w-4 h-4" />
              Proficiency Unlocked
              <Sparkles className="w-4 h-4" />
            </div>
            
            <h2 className="text-4xl font-black mb-2 text-slate-800">
              {info.title}
            </h2>
            
            <p className="text-slate-500 text-base mb-8">
              Congratulations! You've successfully proved your mastery at the <strong className="text-slate-700">{info.level}</strong> level. Keep up the amazing work!
            </p>

            <button
              onClick={onClose}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg uppercase tracking-wider shadow-lg bg-gradient-to-r ${info.color} hover:opacity-90 transition-opacity transform hover:scale-[1.02] active:scale-95`}
            >
              Continue Learning
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
