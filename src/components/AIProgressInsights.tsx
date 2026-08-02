import React, { useState, useEffect } from 'react';
import { LocalReport } from '../lib/indexedDB';
import { generateProgressSummary } from '../lib/geminiInsights';
import { Sparkles, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  reports: LocalReport[];
}

export const AIProgressInsights: React.FC<Props> = ({ reports }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    improvements: string[];
    persistentIssues: string[];
    summary: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (reports.length < 2) {
      setError("Complete at least 2 sessions to generate AI insights.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateProgressSummary(reports);
      if (result) {
        setInsights(result);
      } else {
        setError("Could not generate insights.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate AI insights.");
    } finally {
      setLoading(false);
    }
  };

  if (reports.length < 2) return null;

  return (
    <div className="bg-white border border-slate-900/5 rounded-2xl p-6 mb-8 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          AI Progress Analysis
        </h3>
        {!insights && !loading && (
          <button
            onClick={fetchInsights}
            className="text-xs font-bold bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors border border-purple-200"
          >
            Generate Insights
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-sm font-medium uppercase tracking-widest animate-pulse">Analyzing recent sessions...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-sm text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">
          {error}
          <div className="mt-2">
            <button onClick={fetchInsights} className="underline text-red-600 font-bold text-xs uppercase">Try Again</button>
          </div>
        </div>
      )}

      {insights && !loading && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-slate-700 text-sm md:text-base leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {insights.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recent Improvements
              </h4>
              <ul className="space-y-2">
                {insights.improvements.map((imp, idx) => (
                  <li key={idx} className="text-sm text-emerald-800 flex items-start gap-2">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    {imp}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Areas to Focus
              </h4>
              <ul className="space-y-2">
                {insights.persistentIssues.map((issue, idx) => (
                  <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
