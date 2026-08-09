import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, LayoutDashboard, Calendar, Trash2, AudioLines, Mic, Sparkles, Clock } from 'lucide-react';

import { FeedbackMarkdown } from './FeedbackMarkdown';
import { FluencyHeatmap } from './FluencyHeatmap';
import { deleteReportFromDb, getUserReports, SavedReport } from '../lib/firebase';
import { useSessionStore } from '../store/sessionStore';

interface HistoryModalProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  setPronunciationWord: (word: string | null) => void;
  retryReportGeneration: (report: SavedReport) => void;
}

export function HistoryModal({
  showHistory,
  setShowHistory,
  setPronunciationWord,
  retryReportGeneration
}: HistoryModalProps) {
  const [historyLevelFilter, setHistoryLevelFilter] = useState<string>("All");
  const [historyModeFilter, setHistoryModeFilter] = useState<string>("All");
  const { pastReports, setPastReports } = useSessionStore();
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  React.useEffect(() => {
    if (showHistory) {
      const load = async () => {
        setLoadingHistory(true);
        const reports = await getUserReports();
        setPastReports(reports);
        setLoadingHistory(false);
      };
      load();
    }
  }, [showHistory]);

  const handleDeleteReport = async (id: string) => {
    await deleteReportFromDb(id);
    setPastReports(pastReports.filter((r) => r.id !== id));
  };

  return (
    <AnimatePresence>
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="bg-white border-0 sm:border border-slate-200/60 p-6 sm:p-8 rounded-none sm:rounded-[2.5rem] max-w-4xl w-full h-full sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
            <button
              onClick={() => setShowHistory(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              ✕
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pr-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Past Sessions
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Review your progress</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={historyLevelFilter}
                  onChange={(e) => setHistoryLevelFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none shadow-sm cursor-pointer"
                >
                  <option value="All">All Levels</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="IELTS">IELTS</option>
                </select>
                <select
                  value={historyModeFilter}
                  onChange={(e) => setHistoryModeFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none shadow-sm cursor-pointer"
                >
                  <option value="All">All Modes</option>
                  <option value="Practice">Practice</option>
                  <option value="Task">Task</option>
                  <option value="IELTS">IELTS Mock</option>
                </select>
              </div>
            </div>
            
            {/* Heatmap Section */}
            

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-8">
              {loadingHistory ? (
                <div className="text-center p-8 text-slate-500 animate-pulse bg-slate-50 rounded-2xl">
                  Loading your history...
                </div>
              ) : pastReports.length === 0 ? (
                <div className="text-center p-12 text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                    <History className="w-8 h-8 text-slate-300" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">No past sessions found.</p>
                    <p className="text-sm">Complete a practice or task to see it here!</p>
                  </div>
                </div>
              ) : (
                pastReports
                  .filter((r) => {
                    const passLevel =
                      historyLevelFilter === "All" ||
                      r.level === historyLevelFilter;
                    const passMode =
                      historyModeFilter === "All" ||
                      r.mode === historyModeFilter;
                    return passLevel && passMode;
                  })
                  .map((r, i) => (
                    <div
                      key={i}
                      className="p-5 sm:p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                    >
                      {/* Decorative accent line */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-blue-500 opacity-50" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(r.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            {" "}
                            {new Date(r.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                              r.mode === "Task"
                                ? "bg-amber-100 text-amber-700"
                                : r.mode === "IELTS"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {r.mode}
                          </span>
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-black uppercase tracking-widest">
                            {r.level}
                          </span>
                          {r.durationMs && (
                             <span className="text-xs font-bold text-slate-400 flex items-center gap-1 ml-1 border border-slate-100 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3" />
                                {Math.round(r.durationMs / 60000)}m
                             </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteReport(r.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {r.topic && (
                         <div className="mb-4">
                            <h4 className="text-sm font-bold text-slate-800 leading-snug">
                              {r.topic}
                            </h4>
                         </div>
                      )}

                      {!r.reportText ? (
                        <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 text-amber-700 text-sm font-medium">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <p>No feedback was generated for this session.</p>
                          </div>
                          {r.transcript && r.transcript.length > 0 && (
                            <button 
                              onClick={() => retryReportGeneration(r)}
                              className="px-4 py-2 bg-white border border-amber-200 hover:bg-amber-100 text-amber-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm whitespace-nowrap"
                            >
                              Generate Now
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-100 prose prose-sm prose-slate max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600">
                          <FeedbackMarkdown 
                            content={r.reportText} 
                            onPracticeWord={setPronunciationWord}
                          />
                        </div>
                      )}
                      
                      {r.transcript && r.transcript.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <details className="group/details">
                            <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors flex items-center gap-2 select-none outline-none">
                              <span className="p-1.5 bg-slate-100 rounded-md group-hover/details:bg-indigo-50 group-hover/details:text-indigo-600 transition-colors">
                                <AudioLines className="w-3.5 h-3.5" />
                              </span>
                              View Conversation Transcript
                            </summary>
                            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto text-sm space-y-3 shadow-inner custom-scrollbar">
                              {r.transcript.map((line, idx) => {
                                const isUser = line.startsWith("[Student]:");
                                const text = line.replace(/\[(Student|Tutor)\]:\s*/, "");
                                return (
                                  <div key={idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] ${
                                      isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {isUser ? <Mic className="w-3 h-3" /> : '🤖'}
                                    </div>
                                    <div className={`px-3 py-2 rounded-2xl max-w-[85%] ${
                                      isUser 
                                        ? 'bg-indigo-50 text-indigo-900 rounded-tr-sm border border-indigo-100/50' 
                                        : 'bg-slate-50 text-slate-700 rounded-tl-sm border border-slate-200/50'
                                    }`}>
                                      {text}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
