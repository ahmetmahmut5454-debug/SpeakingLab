const fs = require('fs');

// 1. Clean Header.tsx
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
header = header.replace(/<button\s*onClick=\{\(\) => \{\s*const currentKey = localStorage\.getItem\("gemini_custom_key"\)[\s\S]*?<Settings className="w-4 h-4" \/> API\s*<\/button>/m, '');
fs.writeFileSync('src/components/Header.tsx', header);

// 2. Clean eltBot.ts
let eltBot = fs.readFileSync('src/lib/eltBot.ts', 'utf8');
eltBot = eltBot.replace(/export const getApiKey = \(\) => \{[\s\S]*?return import\.meta\.env\.VITE_GEMINI_API_KEY \|\| "proxy_key";\s*\};/m, 'export const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || "proxy_key";');
fs.writeFileSync('src/lib/eltBot.ts', eltBot);

console.log("Cleanup done.");
