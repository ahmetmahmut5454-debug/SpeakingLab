import type { SavedReport } from "./firebase";

export const extractScore = (text: string, keyword: string): number | null => {
  if (!text) return null;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Matches markdown headers, bolding, lists, colons, equal signs, brackets, e.g.
  // **Estimated Band Score**: **6.5**, - Fluency: 7.0 / 9.0, ### Grammar Score = 6.5
  const regex = new RegExp(
    `[#*|\\-\\s]*${escaped}[#*|\\-\\s]*[:=\\-|]?\\s*[*_\\[(]*\\s*(?:Band|Skoru?|Score|Puan)?\\s*[*_]*\\s*([0-9]+(?:\\.[0-9]+)?)(?:\\s*\\/\\s*\\d+(?:\\.\\d+)?)?`,
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
  // First, try exact regex keyword parsing
  for (const kw of keywords) {
    const strict = extractScore(text, kw);
    if (strict !== null) return strict;
  }
  
  // Heuristic line-by-line fallback
  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    const matchedKw = keywords.find(kw => lower.includes(kw.toLowerCase()));
    if (matchedKw) {
      const kwIdx = lower.indexOf(matchedKw.toLowerCase());
      const afterKw = line.substring(kwIdx + matchedKw.length);
      // Remove denominators e.g. / 9, / 9.0, / 10, / 100 so they are not mistaken for scores
      const noDenominator = afterKw.replace(/\/\s*(?:9(?:\.0)?|10|100)\b/g, '');
      const matches = noDenominator.match(/\b([0-9](?:\.[0-9]+)?)\b/g);
      if (matches) {
        const vals = matches.map(m => parseFloat(m)).filter(v => v >= 0 && v <= 9);
        if (vals.length > 0) {
          // The first number immediately following the criteria label is the score
          return vals[0]; 
        }
      }
    }
  }
  return null;
};

export const extractFluencyScore = (text: string): number | null => {
  return extractRobustScore(text, [
    "Fluency & Coherence Score",
    "Fluency and Coherence Score",
    "Fluency & Coherence",
    "Fluency and Coherence",
    "Fluency Score",
    "Fluency",
    "Akıcılık ve Tutarlılık",
    "Akıcılık"
  ]);
};

export const extractGrammarScore = (text: string): number | null => {
  return extractRobustScore(text, [
    "Grammatical Range & Accuracy Score",
    "Grammatical Range and Accuracy Score",
    "Grammatical Range & Accuracy",
    "Grammatical Range and Accuracy",
    "Grammar Score",
    "Grammatical Range",
    "Grammar",
    "Grammatical",
    "Gramer ve Doğruluk",
    "Dilbilgisi",
    "Gramer"
  ]);
};

export const extractVocabScore = (text: string): number | null => {
  return extractRobustScore(text, [
    "Lexical Resource Score",
    "Lexical Resource",
    "Vocabulary Score",
    "Vocabulary",
    "Lexical",
    "Kelime Kaynağı",
    "Kelime Bilgisi",
    "Kelime"
  ]);
};

export const extractPronunciationScore = (text: string): number | null => {
  return extractRobustScore(text, [
    "Pronunciation Score",
    "Pronunciation and Clarity Score",
    "Pronunciation & Clarity Score",
    "Pronunciation & Clarity",
    "Pronunciation and Clarity",
    "Pronunciation",
    "Telaffuz Skoru",
    "Telaffuz"
  ]);
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

  const valid = [fluency, lexical, grammar, pronunciation].filter((x): x is number => x !== null);
  
  let calculatedBand: number;
  if (valid.length >= 2) {
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
    calculatedBand = calculateIELTSBandScore(
      fluency ?? avg,
      lexical ?? avg,
      grammar ?? avg,
      pronunciation ?? avg
    );
  } else {
    const rawBand = extractOverallScore(reportText);
    calculatedBand = rawBand !== null && rawBand <= 9 ? rawBand : 6.0;
  }

  const formattedBand = calculatedBand.toFixed(1);
  
  // Robust replacement or insertion of the overall Estimated Band Score
  const aggressiveRegex = /([#*|\-\s]*(?:Estimated\s+|Overall\s+|IELTS\s+)?Band(?: Score)?[#*|\-\s]*:?\s*[*_\\[(]*\s*(?:Band\s*)?[*_]*)\b([0-9](?:\.[0-9]+)?)\b/i;
  if (aggressiveRegex.test(reportText)) {
    return reportText.replace(aggressiveRegex, `$1${formattedBand}`);
  } else {
    const lines = reportText.split('\n');
    let replaced = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes("band score") || lines[i].toLowerCase().includes("overall score")) {
        lines[i] = lines[i].replace(/\b([0-9](?:\.[0-9]+)?)\b/, formattedBand);
        replaced = true;
        break;
      }
    }
    if (replaced) return lines.join('\n');

    // If no band score line exists, insert under Section 1 header
    const headerRegex = /(###\s*1\.[^\n]*\n)/i;
    if (headerRegex.test(reportText)) {
      return reportText.replace(headerRegex, `$1- **Estimated Band Score**: ${formattedBand}\n`);
    }
    return `- **Estimated Band Score**: ${formattedBand}\n\n` + reportText;
  }
};

export const extractOverallScore = (text: string): number | null => {
  if (!text) return null;

  // If all 4 criterion sub-scores are present, calculate the official IELTS band score directly
  const fluency = extractFluencyScore(text);
  const grammar = extractGrammarScore(text);
  const vocab = extractVocabScore(text);
  const pron = extractPronunciationScore(text);
  
  const validScores = [fluency, grammar, vocab, pron].filter((s): s is number => s !== null);
  if (validScores.length === 4) {
    return calculateIELTSBandScore(fluency!, vocab!, grammar!, pron!);
  }

  const band = extractScore(text, "Estimated Band Score") ??
               extractScore(text, "Overall Band Score") ??
               extractScore(text, "IELTS Band Score") ??
               extractScore(text, "Overall Band") ??
               extractScore(text, "Band Score") ??
               extractScore(text, "Tahmini Band Skoru") ??
               extractScore(text, "Overall Score") ??
               extractScore(text, "Genel Skor");
  if (band !== null) return band;

  if (validScores.length >= 2) {
    const sum = validScores.reduce((acc, v) => acc + v, 0);
    const avg = sum / validScores.length;
    return calculateIELTSBandScore(
      fluency ?? avg,
      vocab ?? avg,
      grammar ?? avg,
      pron ?? avg
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
