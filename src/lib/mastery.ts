import { LocalReport } from "./indexedDB";

export const extractScore = (text: string, keyword: string) => {
  const regex = new RegExp(`\\*?\\*?${keyword}\\*?\\*?\\s*:\\s*\\*?\\*?\\s*([0-9.]+)`, 'i');
  const match = regex.exec(text);
  if (match && match[1]) {
     const val = parseFloat(match[1]);
     return isNaN(val) ? null : val;
  }
  return null;
};

export const extractEstimatedLevel = (text: string): string | null => {
  // Try CEFR first
  const cefrRegex = /\*?\*?Estimated Level\*?\*?\s*:\s*\**\s*([A-C][1-2])/i;
  let match = cefrRegex.exec(text);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }
  
  // Try Band Score mapping
  const bandScore = extractScore(text, "Estimated Band Score");
  if (bandScore !== null) {
    if (bandScore >= 8.5) return "C2";
    if (bandScore >= 7.0) return "C1";
    if (bandScore >= 5.5) return "B2";
    if (bandScore >= 4.0) return "B1";
    if (bandScore >= 3.0) return "A2";
    return "A1";
  }
  
  return null;
};

export const checkMasteryUnlocks = (reports: LocalReport[]): string[] => {
  const sorted = [...reports].sort((a, b) => a.createdAtTime - b.createdAtTime);
  const unlockedBadges: string[] = [];

  const checkConsecutiveImprovement = (keyword: string, badgeId: string) => {
    let currentStreak = 0;
    let lastScore: number | null = null;
    let hasImprovedInStreak = false;

    for (const report of sorted) {
      if (!report.reportText) continue;
      const score = extractScore(report.reportText, keyword);
      if (score !== null) {
        if (lastScore !== null) {
          if (score >= lastScore) {
            currentStreak++;
            if (score > lastScore) {
              hasImprovedInStreak = true;
            }
          } else {
            currentStreak = 1;
            hasImprovedInStreak = false;
          }
        } else {
          currentStreak = 1;
          hasImprovedInStreak = false;
        }
        lastScore = score;
        
        if (currentStreak >= 5 && hasImprovedInStreak) {
          if (!unlockedBadges.includes(badgeId)) {
            unlockedBadges.push(badgeId);
          }
        }
      }
    }
  };

  const levelCounts: Record<string, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
    C1: 0,
    C2: 0,
  };

  for (const report of sorted) {
    if (!report.reportText) continue;
    const level = extractEstimatedLevel(report.reportText);
    if (level) {
      // Valid if they targeted that level or were rated at that level.
      // The user gets points/counts for the level they performed at.
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    }
  }

  // A2 Badge: 10 sessions at A2 or above
  const a2AndAbove = (levelCounts["A2"] || 0) + (levelCounts["B1"] || 0) + (levelCounts["B2"] || 0) + (levelCounts["C1"] || 0) + (levelCounts["C2"] || 0);
  if (a2AndAbove >= 10 && !unlockedBadges.includes("badge_level_a2")) {
    unlockedBadges.push("badge_level_a2");
  }

  // B1 Badge: 15 sessions at B1 or above
  const b1AndAbove = (levelCounts["B1"] || 0) + (levelCounts["B2"] || 0) + (levelCounts["C1"] || 0) + (levelCounts["C2"] || 0);
  if (b1AndAbove >= 15 && !unlockedBadges.includes("badge_level_b1")) {
    unlockedBadges.push("badge_level_b1");
  }

  // B2 Badge: 20 sessions at B2 or above
  const b2AndAbove = (levelCounts["B2"] || 0) + (levelCounts["C1"] || 0) + (levelCounts["C2"] || 0);
  if (b2AndAbove >= 20 && !unlockedBadges.includes("badge_level_b2")) {
    unlockedBadges.push("badge_level_b2");
  }

  // C1 Badge: 30 sessions at C1 or above
  const c1AndAbove = (levelCounts["C1"] || 0) + (levelCounts["C2"] || 0);
  if (c1AndAbove >= 30 && !unlockedBadges.includes("badge_level_c1")) {
    unlockedBadges.push("badge_level_c1");
  }

  checkConsecutiveImprovement("Fluency Score", "badge_fluency_master");
  checkConsecutiveImprovement("Grammar Score", "badge_grammar_master");
  checkConsecutiveImprovement("Vocabulary Score", "badge_vocabulary_master");

  return unlockedBadges;
};
