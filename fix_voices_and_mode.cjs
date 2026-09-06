const fs = require('fs');

// 1. Fix App.tsx defaults and options
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Remove Zephyr option
appCode = appCode.replace(
  /<option value="Zephyr" className="bg-white text-slate-900 font-medium">Zephyr \(Female, Energetic\)<\/option>\n/,
  ''
);

// Fix default value logic in select
appCode = appCode.replace(
  /context\.voice \|\|\n\s*\(context\.level === "C1" \? "Charon" : "Zephyr"\)/g,
  'context.voice || "Puck"'
);

fs.writeFileSync('src/App.tsx', appCode);

// 2. Fix VoiceType and system instructions in eltBot.ts
let botCode = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Remove Zephyr from VoiceType
botCode = botCode.replace(
  /\| "Zephyr"\s*/g,
  ''
);

// Fix base system instruction for Practice/Task
// The current code has:
/*
      let systemInstruction = `
        You are an IELTS Speaking Examiner and English Tutor.
        You are talking with a student at CEFR ${context.level}.
        Keep your responses conversational and natural.
      `;
*/
botCode = botCode.replace(
  /let systemInstruction = `\n\s*You are an IELTS Speaking Examiner and English Tutor\.\n\s*You are talking with a student at CEFR \$\{context\.level\}\.\n\s*Keep your responses conversational and natural\.\n\s*`;/g,
  `let systemInstruction = \`
        You are a friendly, helpful English conversational tutor.
        You are talking with a student at CEFR \${context.level}.
        Keep your responses conversational, natural, and highly adaptive to the user's topic.
        \${context.topic ? 'The user wants to talk about: ' + context.topic : ''}
      \`;`
);

fs.writeFileSync('src/lib/eltBot.ts', botCode);
console.log("Fixed voices and modes.");
