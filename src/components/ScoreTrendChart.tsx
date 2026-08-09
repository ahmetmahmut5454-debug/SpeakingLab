import React, { useMemo } from 'react';
import { SavedReport } from '../lib/firebase';
import { extractOverallScore, extractFluencyScore, extractGrammarScore, extractVocabScore } from '../lib/mastery';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Props {
  reports: SavedReport[];
}

export const ScoreTrendChart: React.FC<Props> = ({ reports }) => {
  const chartData = useMemo(() => {
    // Sort chronologically
    const sorted = [...reports].sort((a, b) => a.createdAtTime - b.createdAtTime);
    // Take the last 10
    const last10 = sorted.slice(-10);
    
    return last10.map((report, idx) => {
      let overallScore = 0;
      if (report.reportText) {
        const extracted = extractOverallScore(report.reportText);
        if (extracted !== null) {
          // If extracted score is 0-9 (IELTS band score), scale to 100 for consistent trend visualization
          overallScore = extracted <= 9 ? Math.round((extracted / 9) * 100) : Math.round(extracted);
        } else {
          const fluency = extractFluencyScore(report.reportText) || 0;
          const grammar = extractGrammarScore(report.reportText) || 0;
          const vocab = extractVocabScore(report.reportText) || 0;
          const count = (fluency ? 1 : 0) + (grammar ? 1 : 0) + (vocab ? 1 : 0);
          const raw = count > 0 ? (fluency + grammar + vocab) / count : 0;
          overallScore = raw <= 9 ? Math.round((raw / 9) * 100) : Math.round(raw);
        }
      }
      
      const date = new Date(report.createdAtTime);
      return {
        name: `Session ${idx + 1}`,
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: overallScore || null,
      };
    }).filter(d => d.score !== null);
  }, [reports]);

  if (chartData.length < 2) return null;

  return (
    <div className="bg-white border border-slate-900/5 rounded-2xl p-5 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          Progress Trend (Last 10 Sessions)
        </h3>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              dy={10}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              name="Overall Score"
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
