import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { LocalReport } from '../lib/indexedDB';
import {
  extractFluencyScore,
  extractGrammarScore,
  extractVocabScore,
  extractPronunciationScore,
  extractOverallScore,
} from '../lib/mastery';
import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

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
      
      const fluency = extractFluencyScore(text);
      const grammar = extractGrammarScore(text);
      const vocabulary = extractVocabScore(text);
      const pronunciation = extractPronunciationScore(text);
      let overall = extractOverallScore(text);

      return {
        name: `S${index + 1}`,
        Fluency: fluency,
        Grammar: grammar,
        Vocabulary: vocabulary,
        Pronunciation: pronunciation,
        Overall: overall,
        date: new Date(report.createdAtTime).toLocaleDateString()
      };
    });
  }, [reports]);

  const hasData = chartData.some(d => d.Fluency !== null || d.Grammar !== null || d.Vocabulary !== null || d.Overall !== null);

  const insights = useMemo(() => {
    if (!hasData || chartData.length < 2) return null;

    const metrics = ['Fluency', 'Grammar', 'Vocabulary'] as const;
    
    const changes = metrics.map(metric => {
      const values = chartData.map(d => d[metric]).filter(v => v !== null) as number[];
      if (values.length >= 2) {
        const first = values[0];
        const last = values[values.length - 1];
        return { metric, delta: last - first };
      }
      return null;
    }).filter(c => c !== null) as { metric: string, delta: number }[];

    if (changes.length === 0) return null;

    changes.sort((a, b) => b.delta - a.delta);
    
    const mostImproved = changes[0].delta > 0 ? changes[0].metric : null;
    const needsFocus = changes[changes.length - 1].delta <= 0 ? changes[changes.length - 1].metric : null;

    return { mostImproved, needsFocus };
  }, [chartData, hasData]);

    const radarData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    // find the latest valid score for each metric
    const getLatest = (metric: 'Fluency' | 'Grammar' | 'Vocabulary' | 'Pronunciation') => {
      for (let i = chartData.length - 1; i >= 0; i--) {
        const item = chartData[i] as any;
        if (item[metric] !== null && item[metric] !== undefined) {
          return item[metric];
        }
      }
      return 0; // fallback
    };

    return [
      { subject: 'Fluency', score: getLatest('Fluency'), fullMark: 9 },
      { subject: 'Vocabulary', score: getLatest('Vocabulary'), fullMark: 9 },
      { subject: 'Grammar', score: getLatest('Grammar'), fullMark: 9 },
      { subject: 'Pronunciation', score: getLatest('Pronunciation'), fullMark: 9 },
    ];
  }, [chartData]);

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
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Progress Trends (Last 5 Sessions)
        </h3>
        
        {insights && (
          <div className="flex gap-3">
            {insights.mostImproved && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Most Improved: {insights.mostImproved}</span>
              </div>
            )}
            {insights.needsFocus && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-amber-700">
                <Target className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Needs Focus: {insights.needsFocus}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4">
        <div className="h-64 w-full flex flex-col">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Score Progression</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 9]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1e293b' }}
                labelStyle={{ fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="Overall" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
              <Line type="monotone" dataKey="Fluency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={true} animationDuration={1500} animationBegin={200} animationEasing="ease-out" />
              <Line type="monotone" dataKey="Grammar" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={true} animationDuration={1500} animationBegin={400} animationEasing="ease-out" />
              <Line type="monotone" dataKey="Vocabulary" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={true} animationDuration={1500} animationBegin={600} animationEasing="ease-out" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="h-64 w-full flex flex-col">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Current Proficiency Profile</h4>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 9]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Current Skills" dataKey="score" stroke="#6366f1" fill="#818cf8" fillOpacity={0.5} isAnimationActive={true} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
