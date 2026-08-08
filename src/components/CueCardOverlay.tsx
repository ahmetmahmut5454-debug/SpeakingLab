import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, X, Clock, Play, Mic, Maximize2 } from 'lucide-react';

interface CueCardOverlayProps {
  topic: string;
  onClose: () => void;
}

export function CueCardOverlay({ topic, onClose }: CueCardOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [phase, setPhase] = useState<'preparation' | 'speaking'>('preparation');
  const [isMinimized, setIsMinimized] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = (isLast: boolean = false) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(isLast ? 1046.50 : 880, audioCtx.currentTime); 
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (isLast ? 0.4 : 0.1));

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + (isLast ? 0.4 : 0.1));
    } catch (e) {
      console.warn("AudioContext not supported or couldn't play beep", e);
    }
  };

  useEffect(() => {
    if (phase === 'preparation' && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      
      if (timeLeft <= 5 && timeLeft > 0) {
        playBeep(timeLeft === 1);
      }
      
      return () => clearInterval(timerId);
    } else if (phase === 'preparation' && timeLeft === 0) {
      setPhase('speaking');
    }
  }, [phase, timeLeft]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
         audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-20 z-[90] bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setIsMinimized(false)}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${phase === 'preparation' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
               {phase === 'preparation' ? <Clock className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cue Card</h3>
              <p className="text-xs text-slate-500 font-medium">
                 {phase === 'preparation' ? `${timeLeft}s prep time` : 'Speaking Time'}
              </p>
            </div>
            <Maximize2 className="w-4 h-4 text-slate-400 ml-2" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-[2rem] max-w-2xl w-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden relative"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between p-6 sm:px-8 sm:pt-8 bg-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                      IELTS Speaking Part 2
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      Candidate Task Card
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 rounded-full transition-colors bg-white/50"
                    title="Minimize"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 sm:px-8 pb-8 flex-1">
                <div className="bg-slate-50/50 rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-inner">
                  <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-medium whitespace-pre-wrap text-base sm:text-lg">
                    {topic}
                  </div>
                </div>
              </div>

              {/* Footer / Timer */}
              <div className={`p-6 sm:px-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-500 ${phase === 'preparation' ? 'bg-indigo-50/80 border-indigo-100/50' : 'bg-emerald-50/80 border-emerald-100/50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`relative flex items-center justify-center w-14 h-14 rounded-full border-4 ${phase === 'preparation' ? 'border-indigo-200 bg-white' : 'border-emerald-200 bg-white'} shadow-sm`}>
                    {phase === 'preparation' ? (
                       <span className={`text-lg font-bold tabular-nums z-10 text-indigo-600`}>
                         {timeLeft}
                       </span>
                    ) : (
                       <Mic className={`w-6 h-6 z-10 text-emerald-500 animate-pulse`} />
                    )}
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
                      Start Speaking
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      Finish Task
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
