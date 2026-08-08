const fs = require('fs');

const code = `import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, X, MessageCircle, RefreshCw, Layers, Zap, Target } from 'lucide-react';

interface SpeakingTipsProps {
  mode: string;
  level: string;
}

export function SpeakingTips({ mode, level }: SpeakingTipsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tips = useMemo(() => {
    const baseTips = [];

    // Mode specific tips
    if (mode === 'IELTS') {
      baseTips.push({
        title: 'IELTS Fluency',
        icon: <Zap className="w-5 h-5 text-indigo-500" />,
        content: 'Keep talking, even if you make a mistake. Self-correction is okay but don\\'t let it stop your flow.',
        examples: ['"What I mean is..."', '"Or rather..."']
      });
      baseTips.push({
        title: 'Structure (A.R.E.A)',
        icon: <Layers className="w-5 h-5 text-amber-500" />,
        content: 'Extend your answers for better coherence:',
        examples: ['Answer directly', 'Reason (Why?)', 'Example (For instance...)']
      });
    } else if (mode === 'Task') {
      baseTips.push({
        title: 'Task Achievement',
        icon: <Target className="w-5 h-5 text-emerald-500" />,
        content: 'Make sure you address all parts of the prompt clearly.',
        examples: ['"The main problem here is..."', '"I suggest that we..."']
      });
    } else {
      baseTips.push({
        title: 'Natural Conversation',
        icon: <MessageCircle className="w-5 h-5 text-indigo-500" />,
        content: 'Relax and focus on communicating your ideas naturally.',
        examples: ['"You know..."', '"Actually..."', '"To be honest..."']
      });
    }

    // Level specific tips
    if (['A1', 'A2'].includes(level)) {
      baseTips.push({
        title: 'Keep It Simple',
        icon: <RefreshCw className="w-5 h-5 text-emerald-500" />,
        content: 'Use short, simple sentences. Don\\'t worry about complex grammar.',
        examples: ['"I like this because..."', '"It is very good."']
      });
    } else if (['B1', 'B2'].includes(level)) {
      baseTips.push({
        title: 'Paraphrasing',
        icon: <RefreshCw className="w-5 h-5 text-blue-500" />,
        content: 'If you forget a word, explain what it means:',
        examples: ['"It\\'s a kind of..."', '"It\\'s similar to..."']
      });
    } else {
      baseTips.push({
        title: 'Advanced Vocabulary',
        icon: <Zap className="w-5 h-5 text-purple-500" />,
        content: 'Try to incorporate idiomatic expressions and less common vocabulary.',
        examples: ['"It\\'s a double-edged sword..."', '"In the grand scheme of things..."']
      });
    }

    return baseTips;
  }, [mode, level]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-slate-900 border border-slate-700 p-3.5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_10px_40px_-5px_rgba(0,0,0,0.6)] hover:bg-slate-800 transition-all group flex items-center gap-3"
        title="Quick Tips"
      >
        <Lightbulb className="w-5 h-5 text-amber-400 group-hover:animate-pulse" />
        <span className="text-white font-bold text-sm tracking-wide hidden sm:block">Quick Tips</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 sm:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[360px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-800">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold">
                    {mode === 'IELTS' ? 'IELTS Strategies' : mode === 'Task' ? 'Task Strategies' : 'Practice Tips'} 
                    <span className="text-slate-400 font-normal ml-2">({level})</span>
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {tips.map((tip, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {tip.icon}
                      <h4 className="font-bold text-slate-800 text-sm">{tip.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{tip.content}</p>
                    <ul className="space-y-1.5">
                      {tip.examples.map((ex, i) => (
                        <li key={i} className="text-xs font-semibold text-slate-700 bg-slate-50 py-2 px-3 rounded-lg border border-slate-100">
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
`;

fs.writeFileSync('src/components/SpeakingTips.tsx', code);
