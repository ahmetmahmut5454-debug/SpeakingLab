import { SavedReport } from "./firebase";

export const extractScore = (text: string, keyword: string) => {
  if (!text) return null;
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Matches markdown headers, bolding, lists, colons, equal signs, brackets, e.g.
  // **Grammar Score**: 85, - Vocabulary: [70], ### Fluency & Coherence Score = 7.5
  const regex = new RegExp(
    `(?:\\*\\*|\\*|#|\\||-)*\\s*${escapedKeyword}(?:\\*\\*|\\*|#)*\\s*[:=\\|-]?\\s*(?:\\[|\\(|Band\\s*|Skoru?\\s*)?([0-9]+(?:\\.[0-9]+)?)`,
    'i'
  );
  const match = regex.exec(text);
  if (match && match[1]) {
     const val = parseFloat(match[1]);
     return isNaN(val) ? null : val;
  }
  return null;
};

/**
 * Calculates official IELTS overall band score from the 4 criterion sub-scores.
 * IELTS rounding rule:
 * - Average is rounded to the nearest half band.
 * - If average ends in .25, rounds UP to .5.
 * - If average ends in .75, rounds UP to next whole band (.0).
 */
export const calculateIELTSBandScore = (
  fluency: number,
  lexical: number,
  grammar: number,
  pronunciation: number
): number => {
  const avg = (fluency + lexical + grammar + pronunciation) / 4;
  const floor = Math.floor(avg);
  const decimal = Math.round((avg - floor) * 1000) / 1000;

  if (decimal < 0.25) {
    return floor;
  } else if (decimal < 0.75) {
    return floor + 0.5;
  } else {
    return floor + 1.0;
  }
};

export const extractRobustScore = (text: string, keywords: string[]): number | null => {
  if (!text) return null;
  // First, try the old strict parsing which is fast and accurate if format is exactly right
  for (const kw of keywords) {
    const strict = extractScore(text, kw);
    if (strict !== null) return strict;
  }
  
  // If strict fails, we fall back to line-by-line heuristic parsing
  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      // Avoid matching numbering at start of line like "1. ", "2) "
      const cleanLine = line.replace(/^[0-9]+[\.\)]\s*/, '');
      // Look for any standard IELTS band score (1 to 9, multiple of 0.5)
      const matches = cleanLine.match(/\b([1-9](?:\.[05])?)\b/g);
      if (matches) {
        const vals = matches.map(m => parseFloat(m)).filter(v => v >= 1 && v <= 9);
        if (vals.length > 0) {
          // Return the last found number, which is most likely the actual score 
          // e.g. "Fluency Score 1. Assessment: 7.5" -> returns 7.5
          return vals[vals.length - 1]; 
        }
      }
    }
  }
  return null;
};

export const extractFluencyScore = (text: string): number | null => {
  return extractRobustScore(text, ["Fluency & Coherence Score", "Fluency Score", "Fluency & Coherence", "Fluency"]);
};

export const extractGrammarScore = (text: string): number | null => {
  return extractRobustScore(text, ["Grammatical Range & Accuracy Score", "Grammar Score", "Grammatical Range & Accuracy", "Grammar", "Grammatical"]);
};

export const extractVocabScore = (text: string): number | null => {
  return extractRobustScore(text, ["Lexical Resource Score", "Vocabulary Score", "Lexical Resource", "Vocabulary", "Lexical"]);
};

export const extractPronunciationScore = (text: string): number | null => {
  return extractRobustScore(text, ["Pronunciation Score", "Pronunciation"]);
};

/**
 * Ensures an IELTS report has a mathematically consistent Estimated Band Score
 * calculated from its 4 criteria scores using official IELTS rounding rules.
 */
export const processIELTSReportScores = (reportText: string): string => {
  if (!reportText) return reportText;

  const fluency = extractFluencyScore(reportText);
  const lexical = extractVocabScore(reportText);
  const grammar = extractGrammarScore(reportText);
  const pronunciation = extractPronunciationScore(reportText);

  // Default to 6.0 or the average of others if some are missing to ALWAYS enforce math.
  const f = fluency ?? 6.0;
  const l = lexical ?? 6.0;
  const g = grammar ?? 6.0;
  const p = pronunciation ?? 6.0;
  
  const calculatedBand = calculateIELTSBandScore(f, l, g, p);
  const formattedBand = calculatedBand.toFixed(1);
  
  // Very robust replacement of the overall score
    const aggressiveRegex = /((?:\*?\*?(?:Estimated\s+|Overall\s+)?Band(?: Score)?\*?\*?\s*:\s*\*?\*?\s*))([0-9.]+)/i;
    if (aggressiveRegex.test(reportText)) {
      return reportText.replace(aggressiveRegex, `$1${formattedBand}`);
    } else {
        // Fallback: Just look for any line containing "Band Score" and replace its number
        const lines = reportText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes("band score") || lines[i].toLowerCase().includes("overall score")) {
                 lines[i] = lines[i].replace(/\b([0-9](?:\.[0-9]+)?)\b/, formattedBand);
                 break;
            }
        }
        return lines.join('\n');
    }
};

export const extractOverallScore = (text: string): number | null => {
  const band = extractScore(text, "Estimated Band Score") ??
               extractScore(text, "Overall Band Score") ??
               extractScore(text, "Overall Band") ??
               extractScore(text, "Band Score") ??
               extractScore(text, "Tahmini Band Skoru") ??
               extractScore(text, "Overall Score");
  if (band !== null) return band;

  const fluency = extractFluencyScore(text);
  const grammar = extractGrammarScore(text);
  const vocab = extractVocabScore(text);
  const pron = extractPronunciationScore(text);
  
  const validScores = [fluency, grammar, vocab, pron].filter((s): s is number => s !== null);
  if (validScores.length >= 2) {
    const sum = validScores.reduce((acc, v) => acc + v, 0);
    return calculateIELTSBandScore(
      fluency ?? sum / validScores.length,
      vocab ?? sum / validScores.length,
      grammar ?? sum / validScores.length,
      pron ?? sum / validScores.length
    );
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
  const bandScore = extractOverallScore(text);
  if (bandScore !== null) {
    // If it's 0-9 IELTS band score
    if (bandScore <= 9) {
      if (bandScore >= 8.5) return "C2";
      if (bandScore >= 7.0) return "C1";
      if (bandScore >= 6.5) return "B2";
      if (bandScore >= 5.5) return "B1";
      if (bandScore >= 4.0) return "A2";
      return "A1";
    } else {
      // 0-100 percentage
      if (bandScore >= 85) return "C2";
      if (bandScore >= 70) return "C1";
      if (bandScore >= 55) return "B2";
      if (bandScore >= 40) return "B1";
      if (bandScore >= 25) return "A2";
      return "A1";
    }
  }
  
  return null;
};

export const checkMasteryUnlocks = (reports: SavedReport[]): string[] => {
  const sorted = [...reports].sort((a, b) => a.createdAt - b.createdAt);
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
    
    // Quality & Pedagogy Check: Skip brief/spam sessions (<45s or empty reports)
    const sessionDuration = report.durationMs || 0;
    const isQualifyingSession = sessionDuration >= 45000 || report.reportText.length >= 250;
    if (!isQualifyingSession) continue;

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
