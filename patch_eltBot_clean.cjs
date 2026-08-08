const fs = require('fs');

const cleanFunc = `
export const cleanTranscript = (text: string) => {
  if (!text) return text;
  let cleaned = text.replace(/\\s+/g, " ").trim();
  
  // 1. Remove redundant word repeats (e.g., "ben ben" -> "ben", "I I I" -> "I")
  let prev;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/\\b([\\w\\u00C0-\\u017F]+)\\s+\\1\\b/gi, "$1");
  } while (cleaned !== prev);

  // 2. Clean up self-correction markers and fillers
  const fillers = ["yani", "şey", "işte", "ıı", "eee", "ee", "hmm", "öhm", "aa", "hı hı", "he", "heh", "I mean", "um", "uh", "like", "you know", "aslında", "ne bileyim", "nasıl desem"];
  const regex = new RegExp(\`\\\\b(\${fillers.join('|')})\\\\b\`, 'gi');
  cleaned = cleaned.replace(regex, "");

  // Cleanup extra spaces and punctuation left behind
  cleaned = cleaned.replace(/\\s+/g, " ").trim();
  cleaned = cleaned.replace(/^[.,?!]\\s*/, "");
  cleaned = cleaned.replace(/\\s+([.,?!])/g, "$1");

  return cleaned || text; // fallback to original if completely emptied
};
`;

let content = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Insert cleanTranscript function
if (!content.includes('export const cleanTranscript')) {
  content = content.replace('export type ProficiencyLevel', cleanFunc + '\nexport type ProficiencyLevel');
}

// Apply to transcription callback
content = content.replace(
  'this.callbacks.onTranscription?.(text, false);',
  'this.callbacks.onTranscription?.(cleanTranscript(text), false);'
);
// Also for output transcription from API if needed? No, AI output doesn't need this.
// Wait, the user said "from the transcript before displaying it to the user".
// Does the Web Speech API trigger this? Let's check where `onTranscription` is called.
// Actually, `this.transcriptHistory.push(\`[Student]: \${text}\`)` is also there.
// If we want the AI to give feedback on fillers, we should keep the uncleaned text in `transcriptHistory`, so the AI can analyze it.
// The user says "bunları feedbackte de düzgün göster". This means the AI should evaluate these 6 categories.

fs.writeFileSync('src/lib/eltBot.ts', content);
