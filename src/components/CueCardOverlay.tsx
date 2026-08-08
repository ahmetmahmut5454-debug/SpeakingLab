import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, X, Clock, Play } from 'lucide-react';

interface CueCardOverlayProps {
  topic: string;
  onClose: () => void;
}

export function CueCardOverlay({ topic, onClose }: CueCardOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [phase, setPhase] = useState<'preparation' | 'speaking'>('preparation');

  useEffect(() => {
    if (phase === 'preparation' && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerId);
    } else if (phase === 'preparation' && timeLeft === 0) {
      setPhase('speaking');
    }
  }, [phase, timeLeft]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                IELTS Speaking Part 2
              </h2>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
                Candidate Task Card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-10 bg-white flex-1 min-h-[300px] flex flex-col justify-center">
          <div className="prose prose-lg sm:prose-xl prose-slate max-w-none text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
            {topic}
          </div>
        </div>

        {/* Footer / Timer */}
        <div className={`p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-500 ${phase === 'preparation' ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 ${phase === 'preparation' ? 'border-indigo-200 bg-white' : 'border-emerald-200 bg-white'} shadow-sm`}>
              <Clock className={`absolute w-6 h-6 ${phase === 'preparation' ? 'text-indigo-400 opacity-20' : 'text-emerald-400 opacity-20'}`} />
              <span className={`text-xl font-bold tabular-nums z-10 ${phase === 'preparation' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                {phase === 'preparation' ? timeLeft : 'GO'}
              </span>
            </div>
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${phase === 'preparation' ? 'text-indigo-900' : 'text-emerald-900'}`}>
                {phase === 'preparation' ? 'Preparation Time' : 'Speaking Time'}
              </h3>
              <p className={`text-sm font-medium ${phase === 'preparation' ? 'text-indigo-600/70' : 'text-emerald-600/70'}`}>
                {phase === 'preparation' ? 'You have 1 minute to prepare.' : 'Please speak for 1 to 2 minutes.'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {phase === 'preparation' ? (
              <button
                onClick={() => setPhase('speaking')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                Skip Prep
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <X className="w-5 h-5" />
                Close Card
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
