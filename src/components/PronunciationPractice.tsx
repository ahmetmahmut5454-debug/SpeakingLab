import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, X, Loader2, Volume2 } from 'lucide-react';
import { EltBot, BotContext } from '../lib/eltBot';

export function PronunciationPractice({ word, onClose }: { word: string, onClose: () => void }) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isActive, setIsActive] = useState(true); // default true while connecting, false when finished
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const botRef = useRef<EltBot | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const bot = new EltBot({
      onTranscription: (text, isModel) => {
        if (isMounted && isModel) {
          setIsSpeaking(true);
          setTimeout(() => { if (isMounted) setIsSpeaking(false); }, 3000);
        }
      },
      onError: (err) => {
        console.error(err);
        if (isMounted) {
          setError(err.message || String(err));
          setIsConnecting(false);
        }
      },
      onBotFinished: () => {
        if (isMounted) {
          setIsActive(false);
          setIsConnecting(false);
        }
      }
    });
    botRef.current = bot;

    const context: BotContext = {
      level: 'B1',
      objective: 'Pronunciation practice',
      topic: 'Pronunciation',
      mode: 'Task',
      taskDurationMinutes: 1,
      voice: 'Aoede',
      pronunciationPracticeWord: word
    };

    bot.start(context).then(() => {
      if (isMounted) {
        setIsConnecting(false);
        setIsActive(true);
      }
    }).catch(err => {
      if (isMounted) {
        setError(err.message || String(err));
        setIsConnecting(false);
      }
    });

    return () => {
      isMounted = false;
      bot.stop();
    };
  }, [word]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl flex flex-col items-center"
      >
        <button onClick={() => {
            botRef.current?.stop();
            onClose();
        }} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <Mic className={`w-8 h-8 ${isSpeaking ? 'text-orange-600 animate-pulse' : 'text-orange-400'}`} />
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-1">Repeat After Me</h2>
        <p className="text-slate-500 mb-6 text-center text-sm">Practicing pronunciation for:</p>
        
        <div className="text-3xl font-black text-orange-600 mb-8 bg-orange-50 px-6 py-3 rounded-2xl border border-orange-100">
          {word}
        </div>

        {isConnecting ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting to AI Tutor...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3">
             <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg">
               {error}
             </div>
             <button onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-700 underline">Close</button>
          </div>
        ) : !isActive ? (
          <div className="flex flex-col items-center gap-3">
             <div className="text-emerald-600 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
               Session Ended
             </div>
             <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold mt-2">Done</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
             <div className="text-emerald-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
               {isSpeaking ? <><Volume2 className="w-4 h-4" /> AI is speaking...</> : <><Mic className="w-4 h-4 animate-pulse" /> Listening...</>}
             </div>
             <p className="text-slate-400 text-xs text-center max-w-xs">
               The AI will say the word first. Listen carefully, then repeat it back.
             </p>
          </div>
        )}

      </motion.div>
    </div>
  );
}
