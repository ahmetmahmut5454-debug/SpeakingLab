import React, { useMemo } from 'react';
import { SavedReport } from '../lib/firebase';
import { extractEstimatedLevel } from '../lib/mastery';
import { Trophy } from 'lucide-react';

interface Props {
  reports: SavedReport[];
  unlockedItems: string[];
}

export const LevelProgress: React.FC<Props> = ({ reports, unlockedItems }) => {
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    for (const report of reports) {
      if (report.reportText) {
        const level = extractEstimatedLevel(report.reportText);
        if (level) {
          counts[level] = (counts[level] || 0) + 1;
        }
      }
    }
    return counts;
  }, [reports]);

  const progress = useMemo(() => {
    // Current highest unlocked level badge
    const hasC1 = unlockedItems.includes("badge_level_c1");
    const hasB2 = unlockedItems.includes("badge_level_b2");
    const hasB1 = unlockedItems.includes("badge_level_b1");
    const hasA2 = unlockedItems.includes("badge_level_a2");

    if (!hasA2) {
      const count = (levelCounts["A2"] || 0) + (levelCounts["B1"] || 0) + (levelCounts["B2"] || 0) + (levelCounts["C1"] || 0) + (levelCounts["C2"] || 0);
      return { target: "A2 Pioneer", current: count, total: 10, nextLevel: "A2" };
    }
    if (!hasB1) {
      const count = (levelCounts["B1"] || 0) + (levelCounts["B2"] || 0) + (levelCounts["C1"] || 0) + (levelCounts["C2"] || 0);
      return { target: "B1 Achiever", current: count, total: 15, nextLevel: "B1" };
    }
    if (!hasB2) {
      const count = (levelCounts["B2"] || 0) + (levelCounts["C1"] || 0) + (levelCounts["C2"] || 0);
      return { target: "B2 Specialist", current: count, total: 20, nextLevel: "B2" };
    }
    if (!hasC1) {
      const count = (levelCounts["C1"] || 0) + (levelCounts["C2"] || 0);
      return { target: "C1 Master", current: count, total: 30, nextLevel: "C1" };
    }
    
    return { target: "All Mastered", current: 1, total: 1, nextLevel: "MAX" };
  }, [levelCounts, unlockedItems]);

  const percent = Math.min(100, Math.round((progress.current / progress.total) * 100));

  return (
    <div className="bg-white border border-slate-900/5 rounded-2xl p-5 mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          Next Milestone: {progress.target}
        </h3>
        <span className="text-xs font-bold text-slate-700">
          {progress.nextLevel === "MAX" ? "Completed" : `${progress.current} / ${progress.total}`}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-amber-400 h-2.5 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {progress.nextLevel !== "MAX" && (
        <p className="text-[9px] text-slate-500 mt-3 font-medium uppercase tracking-widest text-center">
          Complete {progress.total - progress.current} more valid {progress.nextLevel} sessions to rank up!
        </p>
      )}
    </div>
  );
};
