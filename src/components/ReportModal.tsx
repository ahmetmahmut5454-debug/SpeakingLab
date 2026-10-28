import { SavedReport } from '../lib/firebase';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, AudioLines, Mic } from 'lucide-react';

import { FeedbackMarkdown } from './FeedbackMarkdown';
import { FluencyHeatmap } from './FluencyHeatmap';
import { isIELTSSession } from '../lib/eltBot';

interface ReportModalProps {
  report: SavedReport | null;
  setReport: (report: SavedReport | null) => void;
  setPronunciationWord: (word: string | null) => void;
  transcript: any[];
  retryReportGeneration?: (report: SavedReport) => void;
}

export function ReportModal({
  report,
  setReport,
  setPronunciationWord,
  transcript,
  retryReportGeneration
}: ReportModalProps) {
  const [retrying, setRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (!report || !retryReportGeneration) return;
    setRetrying(true);
    try {
      await retryReportGeneration(report);
    } finally {
      setRetrying(false);
    }
  };

  const getFormattedDate = (createdAt: any) => {
    let time = Date.now();
    if (typeof createdAt === 'number') time = createdAt;
    else if (createdAt?.toMillis) time = createdAt.toMillis();
    else if (createdAt?.seconds) time = createdAt.seconds * 1000;
    else if (typeof createdAt === 'string') {
      const parsed = new Date(createdAt).getTime();
      if (!isNaN(parsed)) time = parsed;
    }
    return new Date(time).toLocaleDateString();
  };

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
                  const rawReportText = typeof report.reportText === 'string' ? report.reportText : '';
                  const isIeltsReport = report.mode === "IELTS" ||
                                        isIELTSSession({
                                          mode: report.mode as any,
                                          topic: report.topic,
                                          objective: report.topic,
                                          scenarioId: report.scenarioId,
                                          level: report.level as any,
                                        } as any) ||
                                        (rawReportText && (
                                          rawReportText.toLowerCase().includes("band score") ||
                                          rawReportText.toLowerCase().includes("ielts") ||
                                          rawReportText.toLowerCase().includes("fluency & coherence")
                                        ));
                  return (
                    <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight">
                      {isIeltsReport ? "IELTS Speaking Assessment" : report.mode === "Task" ? "Scenario Task" : "Free Practice"}{report.level && report.level !== "IELTS" ? ` (${report.level})` : ""}
                    </h2>
                  );
                })()}
                <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                  <span>{getFormattedDate(report.createdAt)}</span>
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
                const rawReportText = typeof report.reportText === 'string' ? report.reportText : '';
                const hasValidReport =
                  rawReportText.trim().length > 0 &&
                  !rawReportText.includes("❌") &&
                  rawReportText.trim() !== "No transcript available.";

                if (!hasValidReport) {
                  return (
                    <div className="py-8 px-4 text-center space-y-4">
                      <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                        <AudioLines className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base mb-1">
                          Detaylı Geri Bildirim Hazırlanıyor
                        </h3>
                        <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                          Bu oturumun detaylı değerlendirme raporu henüz tamamlanmadı veya bağlantı kaynaklı gecikti.
                        </p>
                      </div>
                      {retryReportGeneration && (
                        <button
                          onClick={handleRetry}
                          disabled={retrying}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                          {retrying ? "Rapor Oluşturuluyor..." : "Raporu Tekrar Oluştur"}
                        </button>
                      )}
                      {transcript && transcript.length > 0 && (
                        <div className="mt-8 text-left">
                          <FluencyHeatmap transcript={transcript} />
                        </div>
                      )}
                    </div>
                  );
                }

                const match = rawReportText.match(/(?:\*\s*)?\*?\*?Struggled Sounds\/Words:\*?\*?\s*(.+)/i);
                const struggledText = match ? match[1] : null;
                const cleanReport = rawReportText.replace(/(?:\*\s*)?\*?\*?Struggled Sounds\/Words:\*?\*?\s*(.+)\n?/i, '');
                
                return (
                  <>
                    {struggledText && (
                      <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl shrink-0">
                        <div className="flex items-center gap-2 mb-2">
                          <AudioLines className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">Pronunciation Focus</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {struggledText.split(/[,;]+/).map((chunk: any, i: number) => {
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
