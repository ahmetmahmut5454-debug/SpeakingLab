const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');
code = code.replace(
  'model: "gemini-2.0-flash",',
  'model: "gemini-3.1-flash-live-preview",'
);
fs.writeFileSync('src/lib/eltBot.ts', code);
