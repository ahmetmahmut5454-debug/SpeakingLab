const fs = require('fs');
let content = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// standardFormat
content = content.replace(
  '* **Strengths:** [Examples from transcript]',
  '* **Fillers & Hesitations:** [Identify any thinking noises, redundant word repeats, or filler words (e.g. şey, yani, umm) used. Mention if they affected the flow.]\n            * **Strengths:** [Examples from transcript]'
);

// ieltsFormat (search for "### 🗣️ Fluency & Coherence" and add beneath the strict feedback)
content = content.replace(
  '* [Strict feedback on speaking at length, hesitation, and linking words based on the Band Descriptors]',
  '* [Strict feedback on speaking at length, hesitation, and linking words based on the Band Descriptors]\n            * **Fillers & Hesitations:** [Identify any thinking noises, redundant word repeats, or filler words (e.g. şey, yani, umm) used. Mention if they affected the flow.]'
);

fs.writeFileSync('src/lib/eltBot.ts', content);
