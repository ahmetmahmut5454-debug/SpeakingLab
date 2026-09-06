const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// I forgot to export getApiKey which was apparently used by translationService
const fix = `export const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || "";\n\nconst getAiClient = () =>`;

if (code.includes('const getAiClient = () =>')) {
    code = code.replace('const getAiClient = () =>', fix);
    fs.writeFileSync('src/lib/eltBot.ts', code);
    console.log("Added missing export!");
}
