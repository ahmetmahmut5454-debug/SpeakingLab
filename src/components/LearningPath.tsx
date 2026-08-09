import React, { useMemo } from 'react';
import { SavedReport } from '../lib/firebase';
import { extractScore } from '../lib/mastery';
import { predefinedScenarios, Scenario } from '../lib/scenarios';
import { Map, ArrowRight, BookOpen, MessageSquare, BookA } from 'lucide-react';

interface Props {
  reports: SavedReport[];
  userLevel: string;
  onSelectScenario: (scenario: Scenario) => void;
}

export const LearningPath: React.FC<Props> = ({ reports, userLevel, onSelectScenario }) => {
  const { focusArea, suggestedScenarios } = useMemo(() => {
    // Determine weakest area from last 5 reports
    const recent = [...reports].sort((a, b) => b.createdAtTime - a.createdAtTime).slice(0, 5);
    
    let totalFluency = 0, totalGrammar = 0, totalVocab = 0;
    let countFluency = 0, countGrammar = 0, countVocab = 0;

    recent.forEach(report => {
      if (!report.reportText) return;
      const f = extractScore(report.reportText, "Fluency Score");
      const g = extractScore(report.reportText, "Grammar Score");
      const v = extractScore(report.reportText, "Vocabulary Score");
      
      if (f) { totalFluency += f; countFluency++; }
      if (g) { totalGrammar += g; countGrammar++; }
      if (v) { totalVocab += v; countVocab++; }
    });

    const avgFluency = countFluency ? totalFluency / countFluency : 100;
    const avgGrammar = countGrammar ? totalGrammar / countGrammar : 100;
    const avgVocab = countVocab ? totalVocab / countVocab : 100;

    const scores = [
      { name: 'Fluency', score: avgFluency, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
      { name: 'Grammar', score: avgGrammar, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
      { name: 'Vocabulary', score: avgVocab, icon: BookA, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
    ];

    scores.sort((a, b) => a.score - b.score);
    const focusArea = scores[0];

    // Select Scenarios
    // 1. One at current level
    // 2. One at next level (or same if C1)
    // 3. One related to weak area (if we can infer, otherwise random)
    
    // Normalize levels for matching
    const matchLevel = (scenario: Scenario, target: string) => {
        if (target === "B1" || target === "B2") return scenario.level === "B1-B2";
        return scenario.level === target;
    }
    
    const getNextLevel = (lvl: string) => {
        if (lvl === "A1") return "A2";
        if (lvl === "A2") return "B1";
        if (lvl === "B1") return "B2";
        if (lvl === "B2") return "C1";
        return "C1";
    }
    
    const currentLevelScenarios = predefinedScenarios.filter(s => matchLevel(s, userLevel));
    const nextLevelScenarios = predefinedScenarios.filter(s => matchLevel(s, getNextLevel(userLevel)));
    
    const pickRandom = (arr: Scenario[], excludeIds: string[]) => {
        const available = arr.filter(a => !excludeIds.includes(a.id));
        if (available.length === 0) return arr[0];
        return available[Math.floor(Math.random() * available.length)];
    }

    const suggestions: Scenario[] = [];
    
    const s1 = pickRandom(currentLevelScenarios.length ? currentLevelScenarios : predefinedScenarios, []);
    if (s1) suggestions.push(s1);
    
    const s2 = pickRandom(nextLevelScenarios.length ? nextLevelScenarios : predefinedScenarios, suggestions.map(s => s.id));
    if (s2) suggestions.push(s2);
    
    const s3 = pickRandom(predefinedScenarios, suggestions.map(s => s.id));
    if (s3) suggestions.push(s3);

    return { focusArea, suggestedScenarios: suggestions };
  }, [reports, userLevel]);

  return (
    <div className="bg-white border border-slate-900/5 rounded-2xl p-6 mb-8 relative overflow-hidden shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Map className="w-4 h-4 text-emerald-500" />
          Recommended Learning Path
        </h3>
      </div>
      
      {reports.length > 0 && (
        <div className={`mb-6 p-4 rounded-xl border ${focusArea.border} ${focusArea.bg} flex items-center gap-4`}>
          <div className={`p-3 rounded-full bg-white shadow-sm ${focusArea.color}`}>
            <focusArea.icon className="w-6 h-6" />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${focusArea.color} mb-1`}>Current Focus Area</p>
            <p className="text-sm font-medium text-slate-700">
              Based on your recent sessions, you should focus on improving your <strong className={focusArea.color}>{focusArea.name}</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {suggestedScenarios.map((scenario, idx) => (
          <div 
            key={scenario.id} 
            className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group bg-slate-50 hover:bg-white"
            onClick={() => onSelectScenario(scenario)}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Step {idx + 1}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Level {scenario.level}
                </span>
              </div>
              <h4 className="font-bold text-slate-800 text-sm md:text-base group-hover:text-emerald-600 transition-colors">
                {scenario.title}
              </h4>
            </div>
            <button className="text-slate-400 group-hover:text-emerald-500 transition-colors p-2 bg-white rounded-full shadow-sm group-hover:shadow border border-slate-100 group-hover:border-emerald-100">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
