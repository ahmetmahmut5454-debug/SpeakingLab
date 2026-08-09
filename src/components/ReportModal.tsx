import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, AudioLines, Mic } from 'lucide-react';
import { SavedReport } from '../store/sessionStore';
import { FeedbackMarkdown } from './FeedbackMarkdown';
import { FluencyHeatmap } from './FluencyHeatmap';
import { isIELTSSession } from '../lib/eltBot';

interface ReportModalProps {
  report: SavedReport | null;
  setReport: (report: SavedReport | null) => void;
  setPronunciationWord: (word: string | null) => void;
  transcript: any[];
}

export function ReportModal({
  report,
  setReport,
  setPronunciationWord,
  transcript
}: ReportModalProps) {
  return (
    <AnimatePresence>
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-white border-0 sm:border border-slate-900/10 rounded-none sm:rounded-2xl max-w-lg w-full h-full sm:h-auto sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 shrink-0 p-4 sm:p-8 sm:pb-6 bg-white border-b border-slate-100 z-10">
              <LayoutDashboard className="w-6 h-6 text-emerald-500" />
              <div>
                {(() => {
                  const isIeltsReport = report.mode === "IELTS" ||
                                        isIELTSSession({
                                          mode: report.mode as any,
                                          topic: report.topic,
                                          objective: report.topic,
                                          scenarioId: report.scenarioId,
                                          level: report.level as any,
                                        } as any) ||
                                        (report.reportText && (
                                          report.reportText.toLowerCase().includes("band score") ||
                                          report.reportText.toLowerCase().includes("ielts") ||
                                          report.reportText.toLowerCase().includes("fluency & coherence")
                                        ));
                  return (
                    <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight">
                      {isIeltsReport ? "IELTS Mock Assessment" : report.mode === "Task" ? "Scenario Task" : "Free Practice"} ({report.level})
                    </h2>
                  );
                })()}
                <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                  <span>{new Date(report.createdAtTime).toLocaleDateString()}</span>
                  {report.durationMs && (
                    <>
                      <span>•</span>
                      <span>{Math.round(report.durationMs / 60000)}m {Math.round((report.durationMs % 60000) / 1000)}s</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 p-4 sm:p-8">
              {(() => {
                const match = report.reportText.match(/(?:\*\s*)?\*?\*?Struggled Sounds\/Words:\*?\*?\s*(.+)/i);
                const struggledText = match ? match[1] : null;
                const cleanReport = report.reportText.replace(/(?:\*\s*)?\*?\*?Struggled Sounds\/Words:\*?\*?\s*(.+)\n?/i, '');
                
                return (
                  <>
                    {struggledText && (
                      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                          <AudioLines className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">Pronunciation Focus</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {struggledText.split(/[,;]+/).map((chunk, i) => {
                            const word = chunk.trim().replace(/[^a-zA-Z]/g, '');
                            if (!word) return null;
                            return (
                              <button
                                key={i}
                                onClick={() => setPronunciationWord(word)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-bold transition-colors shadow-sm active:scale-95"
                              >
                                <Mic className="w-3.5 h-3.5" />
                                {word}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="mb-6">
                      <FeedbackMarkdown content={cleanReport} onPracticeWord={setPronunciationWord} />
                    </div>
                    <FluencyHeatmap transcript={transcript} />
                  </>
                );
              })()}
            </div>
            
            <div className="shrink-0 p-4 sm:p-8 sm:pt-6 bg-white border-t border-slate-100 z-10">
              <button
                onClick={() => setReport(null)}
                className="w-full py-3 bg-slate-900/5 border border-slate-900/10 rounded-lg hover:bg-slate-900/10 font-bold uppercase tracking-widest transition-all"
              >
                Close Feedback
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
