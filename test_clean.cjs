const cleanTranscript = (text) => {
  let cleaned = text.replace(/\s+/g, " ").trim();
  
  // 1. Remove redundant word repeats (e.g., "ben ben" -> "ben", "I I I" -> "I")
  let prev;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/\b([\w\u00C0-\u017F]+)\s+\1\b/gi, "$1");
  } while (cleaned !== prev);

  // 2. Clean up self-correction markers ("yani", "şey", "I mean")
  // We'll replace instances of these with a space, then clean up spaces.
  const fillers = ["yani", "şey", "işte", "ıı", "eee", "hmm", "öhm", "hı hı", "I mean", "um", "uh", "you know"];
  const regex = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(regex, "");

  // Cleanup extra spaces and punctuation left behind
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/^[.,?!]\s*/, ""); // remove leading punctuation
  cleaned = cleaned.replace(/\s+([.,?!])/g, "$1"); // fix space before punctuation

  return cleaned;
};

console.log(cleanTranscript("ben ben aslında"));
console.log(cleanTranscript("yarın... yani bugün gidiyorum"));
console.log(cleanTranscript("saat üçte, yani dörtte buluşalım"));
console.log(cleanTranscript("I I mean I think um it is good"));
