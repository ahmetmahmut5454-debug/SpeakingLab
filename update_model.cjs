const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(/model: "gemini-3\.1-flash-live-preview"/, 'model: "gemini-3.8-flash-live-preview"');
code = code.replace(
    /voiceName: "Aoede"/,
    `voiceName: "Aoede" // Other options: "Puck", "Charon", "Kore", "Fenrir" depending on preference`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Updated model to Gemini 3.8 and verified speech config");
