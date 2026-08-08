import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, X, MessageCircle, RefreshCw, Layers } from 'lucide-react';

export function SpeakingTips() {
  const [isOpen, setIsOpen] = useState(false);

  const tips = [
    {
      title: 'Filler Words',
      icon: <MessageCircle className="w-5 h-5 text-indigo-500" />,
      content: 'Use natural fillers to avoid awkward silence:',
      examples: ['"Well, to be honest..."', '"That\'s an interesting question..."', '"Actually, I would say..."']
    },
    {
      title: 'Paraphrasing',
      icon: <RefreshCw className="w-5 h-5 text-emerald-500" />,
      content: 'If you forget a word, explain it:',
      examples: ['"It\'s a kind of device that..."', '"It\'s similar to a..."', '"The person who is responsible for..."']
    },
    {
      title: 'Structure',
      icon: <Layers className="w-5 h-5 text-amber-500" />,
      content: 'Extend your answers using the A.R.E.A method:',
      examples: ['Answer directly', 'Reason (Why?)', 'Example (For instance...)', 'Alternative (On the other hand...)']
    }
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-24 left-4 sm:top-24 sm:left-6 z-40 bg-white border border-slate-200 p-3 rounded-full shadow-lg hover:shadow-xl hover:bg-amber-50 transition-all group"
        title="Speaking Tips"
      >
        <Lightbulb className="w-6 h-6 text-amber-400 group-hover:text-amber-500 group-hover:animate-pulse" />
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
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              className="fixed top-36 left-4 sm:top-36 sm:left-6 z-50 w-[calc(100vw-32px)] sm:w-[320px] bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-800">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold">IELTS Speaking Tips</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {tips.map((tip, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {tip.icon}
                      <h4 className="font-semibold text-slate-800 text-sm">{tip.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600">{tip.content}</p>
                    <ul className="space-y-1.5">
                      {tip.examples.map((ex, i) => (
                        <li key={i} className="text-xs font-medium text-slate-700 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100">
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
