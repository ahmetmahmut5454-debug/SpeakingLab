const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
code = code.replace(
  "    define: {\n      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),\n    },",
  ""
);
fs.writeFileSync('vite.config.ts', code);
