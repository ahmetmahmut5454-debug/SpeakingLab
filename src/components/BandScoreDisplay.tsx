import React from 'react';
import { motion } from 'motion/react';
import { Award, Zap, BookOpen, CheckCircle, Volume2, ShieldCheck } from 'lucide-react';
import {
  extractOverallScore,
  extractFluencyScore,
  extractVocabScore,
  extractGrammarScore,
  extractPronunciationScore,
} from '../lib/mastery';

interface BandScoreDisplayProps {
  content?: string;
  overall?: number | null;
  fluency?: number | null;
  lexical?: number | null;
  grammar?: number | null;
  pronunciation?: number | null;
}

const getCEFRDescriptor = (band: number): { label: string; cefr: string; color: string; badgeBg: string } => {
  if (band >= 8.5) return { label: 'Expert / Native Proficiency', cefr: 'C2', color: 'text-amber-400', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  if (band >= 7.0) return { label: 'Good / Operational User', cefr: 'C1', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  if (band >= 6.5) return { label: 'Competent / Independent User', cefr: 'B2', color: 'text-blue-400', badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  if (band >= 5.5) return { label: 'Modest / Basic User', cefr: 'B1', color: 'text-indigo-400', badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
  if (band >= 4.0) return { label: 'Extremely Limited User', cefr: 'A2', color: 'text-purple-400', badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  return { label: 'Non User / Beginner', cefr: 'A1', color: 'text-slate-400', badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
};

export const BandScoreDisplay: React.FC<BandScoreDisplayProps> = ({
  content = '',
  overall: propOverall,
  fluency: propFluency,
  lexical: propLexical,
  grammar: propGrammar,
  pronunciation: propPronunciation,
}) => {
  const overall = propOverall ?? extractOverallScore(content);
  const fluency = propFluency ?? extractFluencyScore(content);
  const lexical = propLexical ?? extractVocabScore(content);
  const grammar = propGrammar ?? extractGrammarScore(content);
  const pronunciation = propPronunciation ?? extractPronunciationScore(content);

  if (overall === null && fluency === null) {
    return null;
  }

  const bandVal = overall ?? 6.0;
  const descriptor = getCEFRDescriptor(bandVal);

  // SVG Gauge calculations (semi-circle or full ring)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  // Band is 0 - 9
  const percentage = Math.min(1, Math.max(0, bandVal / 9));
  const strokeDashoffset = circumference - percentage * circumference;

  const subCriteria = [
    { label: 'Fluency & Coherence', score: fluency, icon: Zap, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500' },
    { label: 'Lexical Resource', score: lexical, icon: BookOpen, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500' },
    { label: 'Grammatical Range', score: grammar, icon: CheckCircle, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500' },
    { label: 'Pronunciation', score: pronunciation, icon: Volume2, color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="my-6 rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden"
    >
      {/* Background glow decoration */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
        {/* Medal / Circular Gauge Section */}
        <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-48 p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl text-center">
          <div className="relative w-28 h-28 flex items-center justify-center mb-2">
            {/* SVG Circular Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="text-slate-700/60"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="56"
                cy="56"
                r={radius}
                className="text-amber-400"
                strokeWidth="8"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Score in Center */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {bandVal.toFixed(1)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Band Score
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 justify-center mb-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">IELTS Speaking</span>
          </div>

          <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${descriptor.badgeBg}`}>
            {descriptor.cefr} • {descriptor.label}
          </div>
        </div>

        {/* Sub-criteria progress bars */}
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Assessment Criteria Breakdown
            </span>
            <span className="text-xs font-semibold text-slate-400">Scale: 0.0 - 9.0</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subCriteria.map((item) => {
              const val = item.score ?? bandVal;
              const subPct = Math.min(100, Math.max(0, (val / 9) * 100));
              const Icon = item.icon;

              return (
                <div key={item.label} className="bg-slate-800/50 border border-slate-700/40 p-3 rounded-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-white font-mono">
                      {val.toFixed(1)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${item.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${subPct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
