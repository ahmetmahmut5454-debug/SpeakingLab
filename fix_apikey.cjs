const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'export const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || "";',
    'export const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("gemini_custom_key") || "";'
);

code = code.replace(
    'const getAiClient = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });',
    'const getAiClient = () => new GoogleGenAI({ apiKey: getApiKey() });'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed API key fetching in eltBot.ts");
