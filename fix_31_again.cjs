const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Change model back to 3.1
code = code.replace(/model: "gemini-2\.0-flash-exp"/, 'model: "gemini-3.1-flash-live-preview"');
// Change another just in case
code = code.replace(/model: "gemini-3\.8-flash-live-preview"/, 'model: "gemini-3.1-flash-live-preview"');

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed model to 3.1");
