const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /if \(\s*typeof process !== "undefined" &&\s*process\.env &&\s*process\.env\.GEMINI_API_KEY\s*\) \{\s*\/\/\s*@ts-ignore\s*return process\.env\.GEMINI_API_KEY;\s*\}/,
    `try { return process.env.GEMINI_API_KEY; } catch(e) {}`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched getApiKey");
