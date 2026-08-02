import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LocalReport } from '../lib/indexedDB';

interface Props {
  reports: LocalReport[];
}

export const ProgressDashboard: React.FC<Props> = ({ reports }) => {
  const chartData = useMemo(() => {
    // Sort reports by time ascending to show progress left-to-right
    const sorted = [...reports].sort((a, b) => a.createdAtTime - b.createdAtTime);
    const last5 = sorted.slice(-5);
    
    return last5.map((report, index) => {
      const text = report.reportText || "";
      
      const extractScore = (keyword: string) => {
        // Match things like "**Fluency Score:** 5.5" or "**Fluency Score**: 5.5" or "Fluency Score: 5.5"
        const regex = new RegExp(`\\*?\\*?${keyword}\\*?\\*?\\s*:\\s*\\*?\\*?\\s*([0-9.]+)`, 'i');
        const match = regex.exec(text);
        if (match && match[1]) {
           const val = parseFloat(match[1]);
           return isNaN(val) ? null : val;
        }
        return null;
      };

      const fluency = extractScore('Fluency Score');
      const grammar = extractScore('Grammar Score');
      const vocabulary = extractScore('Vocabulary Score');
      let overall = extractScore('Estimated Band Score');
      
      // If we don't find "Estimated Band Score", maybe check "Estimated Level" and convert A1-C2 to 1-6?
      // Since it's for IELTS band score mostly, we will leave it null if not found.

      return {
        name: `S${index + 1}`,
        Fluency: fluency,
        Grammar: grammar,
        Vocabulary: vocabulary,
        Overall: overall,
        date: new Date(report.createdAtTime).toLocaleDateString()
      };
    });
  }, [reports]);

  const hasData = chartData.some(d => d.Fluency !== null || d.Grammar !== null || d.Vocabulary !== null || d.Overall !== null);

  if (!hasData) {
    return (
      <div className="bg-white border border-slate-900/5 rounded-2xl p-6 mb-8 text-center text-slate-500 text-sm">
        <p>No score data available for recent sessions.</p>
        <p className="text-xs mt-2 opacity-60">Complete more sessions to see your progress trends.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-900/5 rounded-2xl p-6 mb-8">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
        Progress Trends (Last 5 Sessions)
      </h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#1e293b' }}
              labelStyle={{ fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="Overall" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
            <Line type="monotone" dataKey="Fluency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="Grammar" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="Vocabulary" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
