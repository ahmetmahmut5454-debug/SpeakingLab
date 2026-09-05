const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');
code = code.replace(/model: "gemini-2\.0-flash-exp"/, 'model: "gemini-3.1-flash-live-preview"');
fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Reverted model to 3.1");
