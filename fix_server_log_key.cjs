const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;",
  "const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;\n      console.log('Using API KEY starts with:', apiKey ? apiKey.substring(0, 5) : 'NONE');"
);

fs.writeFileSync('server.ts', code);
