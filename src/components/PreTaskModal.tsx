import React from 'react';
import { motion, AnimatePresence } from "motion/react";
import { FileText, Phone } from "lucide-react";
import { predefinedScenarios, extractCueCardFromScenario } from "../lib/scenarios";
import { RoleAvatar } from "./AudioStageVisualizer";
import { BotContext } from "../lib/eltBot";

interface PreTaskModalProps {
  showPreTask: boolean;
  setShowPreTask: (show: boolean) => void;
  context: BotContext;
  setCueCardTopic: (topic: string | null) => void;
  toggleBot: () => void;
}

export const PreTaskModal: React.FC<PreTaskModalProps> = ({
  showPreTask,
  setShowPreTask,
  context,
  setCueCardTopic,
  toggleBot,
}) => {
  return (
    <AnimatePresence>
      {showPreTask && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-white border-0 sm:border-4 border-slate-200 p-4 sm:p-10 rounded-none sm:rounded-[2rem] max-w-lg w-full h-full sm:h-auto overflow-y-auto sm:overflow-visible shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="flex flex-col items-center gap-4 sm:gap-6 text-center pt-4 sm:pt-0">
              {predefinedScenarios.find((s) => s.id === context.scenarioId)?.imageUrl ? (
                <img
                  src={
                    predefinedScenarios.find((s) => s.id === context.scenarioId)
                      ?.imageUrl
                  }
                  alt="Scenario"
                  className="w-full h-40 object-cover rounded-2xl shadow-inner mb-2"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <RoleAvatar role={context.role} isActive={false} />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">
                  Scenario Briefing
                </h2>
                <p className="text-slate-700 font-medium text-sm leading-relaxed mb-4 bg-white/80 p-4 rounded-xl border border-slate-200 shadow-inner">
                  {context.studentBriefing ||
                    "Get ready to solve the problem using your language skills!"}
                </p>
              </div>
              {(() => {
                const currentScen = predefinedScenarios.find(
                  (s) => s.id === context.scenarioId
                );
                const cueCardPreview = extractCueCardFromScenario(currentScen);
                return (
                  <>
                    {cueCardPreview && (
                      <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-left mb-2">
                        <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                          <FileText className="w-4 h-4 text-amber-500" />
                          <span>IELTS Part 2 Cue Card Task</span>
                        </div>
                        <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed bg-white/90 p-3 rounded-xl border border-amber-200">
                          {cueCardPreview}
                        </pre>
                      </div>
                    )}
                    <div className="w-full bg-white/50 rounded-2xl p-6 text-left border border-slate-900/5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">
                        Key Vocabulary
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {context.vocabulary?.map((word, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-slate-900/5 border border-slate-900/10 rounded-lg text-sm text-slate-600/80"
                          >
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
              <div className="flex gap-4 w-full mt-4">
                <button
                  onClick={() => setShowPreTask(false)}
                  className="flex-1 py-4 bg-slate-900/5 border border-slate-900/10 rounded-xl hover:bg-slate-900/10 font-bold uppercase tracking-widest transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const currentScen = predefinedScenarios.find(
                      (s) => s.id === context.scenarioId
                    );
                    const cueCardText = extractCueCardFromScenario(currentScen);
                    if (cueCardText) {
                      setCueCardTopic(cueCardText);
                    }
                    setShowPreTask(false);
                    toggleBot();
                  }}
                  className="flex-[2] py-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 border border-emerald-500/30 text-emerald-300 rounded-xl font-bold uppercase tracking-widest transition-all text-xs shadow-lg"
                >
                  <Phone className="w-4 h-4 inline-block mr-2 -mt-1" /> Ready,
                  Connect
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
