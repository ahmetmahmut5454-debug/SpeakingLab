import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, LayoutDashboard, Calendar, Trash2, AudioLines, Mic, Sparkles } from 'lucide-react';
import { LocalReport } from '../store/sessionStore';
import { FeedbackMarkdown } from './FeedbackMarkdown';
import { FluencyHeatmap } from './FluencyHeatmap';

interface HistoryModalProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  historyLevelFilter: string;
  setHistoryLevelFilter: (filter: string) => void;
  historyModeFilter: string;
  setHistoryModeFilter: (filter: string) => void;
  pastReports: LocalReport[];
  loadingHistory: boolean;
  setPronunciationWord: (word: string | null) => void;
  handleDeleteReport: (id: string) => void;
  retryReportGeneration: (report: LocalReport) => void;
}

export function HistoryModal({
  showHistory,
  setShowHistory,
  historyLevelFilter,
  setHistoryLevelFilter,
  historyModeFilter,
  setHistoryModeFilter,
  pastReports,
  loadingHistory,
  setPronunciationWord,
  handleDeleteReport,
  retryReportGeneration
}: HistoryModalProps) {
  return (
    <AnimatePresence>
      {showHistory && (() => {
        const filteredReports = pastReports.filter(r => {
          if (historyLevelFilter !== "All" && r.level !== historyLevelFilter) return false;
          if (historyModeFilter !== "All" && r.mode !== historyModeFilter) return false;
          return true;
        });

        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
          >
            <div className="bg-slate-950 border-0 sm:border border-slate-900/10 rounded-none sm:rounded-[2rem] max-w-3xl w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
              <div className="flex flex-col sm:flex-row h-full">
                {/* Sidebar Filters */}
                <div className="w-full sm:w-64 shrink-0 bg-[#121316] border-b sm:border-b-0 sm:border-r border-slate-900/10 p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                      <History className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white uppercase tracking-tight">Archives</h2>
                      <p className="text-xs text-slate-500 font-medium">Past Feedbacks</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Level</label>
                      <select 
                        value={historyLevelFilter}
                        onChange={(e) => setHistoryLevelFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-white text-sm rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        <option value="All">All Levels</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Mode</label>
                      <select 
                        value={historyModeFilter}
                        onChange={(e) => setHistoryModeFilter(e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-white text-sm rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        <option value="All">All Modes</option>
                        <option value="Practice">Practice</option>
                        <option value="Task">Task</option>
                        <option value="IELTS">IELTS</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <button
                      onClick={() => setShowHistory(false)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors border border-slate-800"
                    >
                      Close Archives
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-[#0a0a0b] flex flex-col min-h-0 overflow-hidden">
                  {/* Stats Bar */}
                  <div className="shrink-0 bg-[#121316] border-b border-slate-900/10 p-4 sm:px-8 sm:py-6 flex justify-between items-center z-10 shadow-sm">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] text-slate-600/40 font-bold uppercase tracking-widest mb-1">
                          Total Records
                        </div>
                        <div className="text-3xl font-light text-slate-300">
                          {filteredReports.length}
                        </div>
                      </div>
                      <div className="w-px h-10 bg-slate-900/20" />
                      <div>
                        <div className="text-[10px] text-slate-600/40 font-bold uppercase tracking-widest mb-1">
                          Status
                        </div>
                        <div className="text-3xl font-light text-blue-400">
                          Active
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2 p-4 sm:p-6">
                    {loadingHistory ? (
                      <div className="flex-1 flex items-center justify-center text-slate-600/50 uppercase tracking-widest text-sm animate-pulse">
                        Loading Archives...
                      </div>
                    ) : filteredReports.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600/30">
                        <Calendar className="w-12 h-12 opacity-50" />
                        <p className="uppercase tracking-widest text-xs">
                          No records found for the selected filters.
                        </p>
                      </div>
                    ) : (
                      filteredReports.map((r) => (
                        <div
                          key={r.id}
                          className="bg-[#1a1b1e] border border-slate-900/5 rounded-xl p-6 relative group flex flex-col gap-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex gap-2 items-center">
                              <span className="px-2 py-1 bg-slate-900/10 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600/70">
                                {r.level}
                              </span>
                              <span className="px-2 py-1 bg-slate-900/5 rounded text-[10px] uppercase tracking-widest text-slate-600/50">
                                {r.mode}
                              </span>
                              <span className="text-[10px] uppercase tracking-widest text-slate-600/40 ml-2">
                                {r.createdAtTime ? new Date(r.createdAtTime).toLocaleDateString() : "Recent"}
                              </span>
                              {r.synced && (
                                <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] uppercase tracking-widest rounded ml-2 font-bold" title="Synced to Cloud">
                                  Synced
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteReport(r.id)}
                              className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-xs uppercase tracking-widest text-slate-600/50 border-l-2 border-indigo-500/50 pl-3">
                            {r.topic}
                          </div>
                          <div className="markdown-body text-sm text-slate-300 mt-2">
                            {r.reportText ? (
                              (() => {
                                const match = r.reportText.match(/(?:\*\s*)?\*?\*?Struggled Sounds\/Words:\*?\*?\s*(.+)/i);
                                const struggledText = match ? match[1] : null;
                                const cleanReport = r.reportText.replace(/(?:\*\s*)?\*?\*?Struggled Sounds\/Words:\*?\*?\s*(.+)\n?/i, '');
                                
                                return (
                                  <>
                                    {struggledText && (
                                      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
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
                                    <div className="mb-4">
                                      <FeedbackMarkdown content={cleanReport} onPracticeWord={setPronunciationWord} />
                                    </div>
                                    <FluencyHeatmap transcript={r.transcript || []} />
                                  </>
                                );
                              })()
                            ) : (
                              <div className="flex flex-col items-center gap-4 py-8 bg-slate-900/5 rounded-xl border border-dashed border-slate-900/20">
                                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                                <div className="text-center">
                                  <p className="text-sm font-bold text-slate-800">
                                    Feedback pending...
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    There was an issue generating this feedback
                                    during the session.
                                  </p>
                                </div>
                                <button
                                  onClick={() => retryReportGeneration(r)}
                                  className="px-6 py-2 bg-indigo-500 text-slate-900 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/20"
                                >
                                  Try Generating Again
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
}
