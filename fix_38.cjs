const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Change model to the real 2.0-flash-exp
code = code.replace(/model: "gemini-3\.8-flash-live-preview"/, 'model: "gemini-2.0-flash-exp"');

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed model 3.8 to 2.0-flash-exp");
