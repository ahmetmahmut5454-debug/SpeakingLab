import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { SavedReport } from '../lib/firebase';
import {
  extractFluencyScore,
  extractGrammarScore,
  extractVocabScore,
  extractPronunciationScore,
  extractOverallScore,
} from '../lib/mastery';
import { TrendingUp, TrendingDown, Target, Award, ShieldCheck, BarChart3, Layers, Calendar, ChevronRight } from 'lucide-react';

interface Props {
  reports: SavedReport[];
  onSelectReport?: (report: SavedReport) => void;
}

export const ProgressDashboard: React.FC<Props> = ({ reports, onSelectReport }) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'IELTS'>('IELTS');

  // Filter reports according to selected mode
  const filteredReports = useMemo(() => {
    const sorted = [...reports].sort((a, b) => a.createdAtTime - b.createdAtTime);
    if (filterMode === 'IELTS') {
      const ieltsOnly = sorted.filter(r => 
        r.mode === 'IELTS' || 
        r.mode === 'Task' || 
        (r.scenarioId && r.scenarioId.toLowerCase().includes('ielts')) ||
        (r.reportText && r.reportText.toLowerCase().includes('ielts'))
      );
      return ieltsOnly.length > 0 ? ieltsOnly : sorted;
    }
    return sorted;
  }, [reports, filterMode]);

  const chartData = useMemo(() => {
    return filteredReports.map((report, index) => {
      const text = report.reportText || "";
      
      const fluency = extractFluencyScore(text);
      const grammar = extractGrammarScore(text);
      const vocabulary = extractVocabScore(text);
      const pronunciation = extractPronunciationScore(text);
      let overall = extractOverallScore(text);

      const d = new Date(report.createdAtTime);
      const formattedDate = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

      return {
        id: report.id,
        rawReport: report,
        name: `Deneme ${index + 1}`,
        topic: report.topic || 'IELTS Speaking',
        Fluency: fluency !== null ? Number(fluency.toFixed(1)) : null,
        Grammar: grammar !== null ? Number(grammar.toFixed(1)) : null,
        Vocabulary: vocabulary !== null ? Number(vocabulary.toFixed(1)) : null,
        Pronunciation: pronunciation !== null ? Number(pronunciation.toFixed(1)) : null,
        Overall: overall !== null ? Number(overall.toFixed(1)) : null,
        date: formattedDate
      };
    });
  }, [filteredReports]);

  const validSessions = useMemo(() => {
    return chartData.filter(d => d.Overall !== null || d.Fluency !== null || d.Grammar !== null);
  }, [chartData]);

  const hasData = validSessions.length > 0;

  // Calculate detailed progress progression (First vs Latest)
  const scoreComparison = useMemo(() => {
    if (validSessions.length === 0) return null;

    const first = validSessions[0];
    const latest = validSessions[validSessions.length - 1];

    const calcDelta = (key: 'Overall' | 'Fluency' | 'Grammar' | 'Vocabulary' | 'Pronunciation') => {
      const fVal = first[key];
      const lVal = latest[key];
      if (fVal !== null && lVal !== null) {
        const delta = Number((lVal - fVal).toFixed(1));
        return { initial: fVal, current: lVal, delta };
      }
      return { initial: lVal ?? 0, current: lVal ?? 0, delta: 0 };
    };

    return {
      overall: calcDelta('Overall'),
      fluency: calcDelta('Fluency'),
      grammar: calcDelta('Grammar'),
      vocab: calcDelta('Vocabulary'),
      pronunciation: calcDelta('Pronunciation'),
      totalTests: validSessions.length
    };
  }, [validSessions]);

  const insights = useMemo(() => {
    if (!hasData || validSessions.length < 2) return null;

    const metrics = ['Fluency', 'Grammar', 'Vocabulary', 'Pronunciation'] as const;
    
    const changes = metrics.map(metric => {
      const values = validSessions.map(d => d[metric]).filter(v => v !== null) as number[];
      if (values.length >= 2) {
        const first = values[0];
        const last = values[values.length - 1];
        return { metric, delta: Number((last - first).toFixed(1)) };
      }
      return null;
    }).filter(c => c !== null) as { metric: string, delta: number }[];

    if (changes.length === 0) return null;

    changes.sort((a, b) => b.delta - a.delta);
    
    const mostImproved = changes[0].delta > 0 ? changes[0] : null;
    const needsFocus = changes[changes.length - 1].delta <= 0 ? changes[changes.length - 1] : null;

    return { mostImproved, needsFocus };
  }, [validSessions, hasData]);

  const radarData = useMemo(() => {
    if (validSessions.length === 0) return [];
    
    const latest = validSessions[validSessions.length - 1];
    const first = validSessions[0];

    return [
      { subject: 'Fluency', Sonuncu: latest.Fluency || 0, Ilk: first.Fluency || 0, fullMark: 9 },
      { subject: 'Vocabulary', Sonuncu: latest.Vocabulary || 0, Ilk: first.Vocabulary || 0, fullMark: 9 },
      { subject: 'Grammar', Sonuncu: latest.Grammar || 0, Ilk: first.Grammar || 0, fullMark: 9 },
      { subject: 'Pronunciation', Sonuncu: latest.Pronunciation || 0, Ilk: first.Pronunciation || 0, fullMark: 9 },
    ];
  }, [validSessions]);

  if (!hasData) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-8 text-center text-slate-500 shadow-sm">
        <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="font-bold text-slate-700 text-base">Henüz Yeterli IELTS Deneme Verisi Yok</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Deneme sınavlarını tamamladıkça IELTS Band Score gelişiminiz (Akıcılık, Kelime, Gramer, Telaffuz) detaylı grafik ve karşılaştırmalarla burada listelenecektir.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm space-y-8">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Bütünsel IELTS Gelişim ve Puan Analizi
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamamlanan {scoreComparison?.totalTests || 0} deneme sınavı arasındaki Band Score ve alt kriter gelişiminiz
          </p>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setFilterMode('IELTS')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'IELTS' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            IELTS Denemeleri
          </button>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filterMode === 'ALL' ? 'bg-white text-indigo-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tüm Pratikler
          </button>
        </div>
      </div>

      {/* STT & Accent Tolerance Safety Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-emerald-900">
            🛡️ Gelişmiş STT & Aksan Tolerans Filtresi Aktif
          </h4>
          <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
            Konuşmanız değerlendirilirken Web Speech / AI ses tanıma kaynaklı harf ve aksan yazım hataları (ör. "think" ➔ "thing") yapay zeka tarafından ayırt edilmekte, gerçek dil hakimiyetiniz adil IELTS kriterleriyle puanlanmaktadır.
          </p>
        </div>
      </div>

      {/* 4-Criteria Score Progression Metric Cards */}
      {scoreComparison && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Overall Band Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between shadow-md">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">🎯 General Band</span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white">{scoreComparison.overall.current}</span>
              <span className="text-xs text-slate-400">/ 9.0</span>
            </div>
            <div className="text-[11px] flex items-center gap-1 font-semibold">
              {scoreComparison.overall.delta >= 0 ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +{scoreComparison.overall.delta} Band
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> {scoreComparison.overall.delta} Band
                </span>
              )}
              <span className="text-slate-400 font-normal">({scoreComparison.overall.initial}’den)</span>
            </div>
          </div>

          {/* Fluency Card */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">🗣️ Fluency</span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900">{scoreComparison.fluency.current}</span>
              <span className="text-xs text-slate-500">/ 9.0</span>
            </div>
            <div className="text-[11px] flex items-center gap-1 font-semibold">
              {scoreComparison.fluency.delta >= 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +{scoreComparison.fluency.delta}
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> {scoreComparison.fluency.delta}
                </span>
              )}
              <span className="text-slate-500 font-normal">({scoreComparison.fluency.initial}’den)</span>
            </div>
          </div>

          {/* Lexical Card */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">📚 Vocabulary</span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900">{scoreComparison.vocab.current}</span>
              <span className="text-xs text-slate-500">/ 9.0</span>
            </div>
            <div className="text-[11px] flex items-center gap-1 font-semibold">
              {scoreComparison.vocab.delta >= 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +{scoreComparison.vocab.delta}
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> {scoreComparison.vocab.delta}
                </span>
              )}
              <span className="text-slate-500 font-normal">({scoreComparison.vocab.initial}’den)</span>
            </div>
          </div>

          {/* Grammar Card */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">📝 Grammar</span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900">{scoreComparison.grammar.current}</span>
              <span className="text-xs text-slate-500">/ 9.0</span>
            </div>
            <div className="text-[11px] flex items-center gap-1 font-semibold">
              {scoreComparison.grammar.delta >= 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +{scoreComparison.grammar.delta}
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> {scoreComparison.grammar.delta}
                </span>
              )}
              <span className="text-slate-500 font-normal">({scoreComparison.grammar.initial}’den)</span>
            </div>
          </div>

          {/* Pronunciation Card */}
          <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">🎤 Pronunciation</span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900">{scoreComparison.pronunciation.current}</span>
              <span className="text-xs text-slate-500">/ 9.0</span>
            </div>
            <div className="text-[11px] flex items-center gap-1 font-semibold">
              {scoreComparison.pronunciation.delta >= 0 ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +{scoreComparison.pronunciation.delta}
                </span>
              ) : (
                <span className="text-rose-500 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> {scoreComparison.pronunciation.delta}
                </span>
              )}
              <span className="text-slate-500 font-normal">({scoreComparison.pronunciation.initial}’den)</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Progression Line Chart & Radar Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl p-5 border border-slate-200 flex flex-col h-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Denemeler Arası Band Score Değişim Grafiği
            </h3>
            {insights?.mostImproved && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> En Yüksek Artış: {insights.mostImproved.metric} (+{insights.mostImproved.delta})
              </span>
            )}
          </div>

          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={validSessions} margin={{ top: 10, right: 15, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[3, 9]} ticks={[3, 4, 5, 6, 7, 8, 9]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                  labelStyle={{ fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="Overall" name="Overall Band" stroke="#0f172a" strokeWidth={3} dot={{ r: 5, fill: "#0f172a" }} activeDot={{ r: 7 }} connectNulls />
                <Line type="monotone" dataKey="Fluency" name="Akıcılık (Fluency)" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="Vocabulary" name="Kelime (Lexical)" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="Grammar" name="Gramer (Grammar)" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="Pronunciation" name="Telaffuz (Pron.)" stroke="#9333ea" strokeWidth={2} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Profile: First vs Latest Session */}
        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200 flex flex-col h-80">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
            İlk Deneme ➔ Son Deneme Karşılaştırması
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 9]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Radar name="İlk Deneme" dataKey="Ilk" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.4} />
                <Radar name="Son Deneme" dataKey="Sonuncu" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#0f172a' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Multi-Test Session History Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">Tüm IELTS Deneme Geçmişi</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Raporu açmak için denemeye tıklayın</span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {validSessions.slice().reverse().map((session, idx) => (
            <div
              key={session.id || idx}
              onClick={() => session.rawReport && onSelectReport?.(session.rawReport)}
              className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm shrink-0">
                  {session.Overall ? session.Overall.toFixed(1) : '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1">
                      {session.topic}
                    </h4>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium shrink-0">
                      {session.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deneme Sınavı #{validSessions.length - idx}
                  </p>
                </div>
              </div>

              {/* Sub-scores Pill Bar */}
              <div className="flex items-center gap-2 text-xs font-semibold self-start sm:self-auto">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                  Fluency: {session.Fluency ?? '-'}
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                  Lexical: {session.Vocabulary ?? '-'}
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                  Grammar: {session.Grammar ?? '-'}
                </span>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
                  Pron: {session.Pronunciation ?? '-'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

