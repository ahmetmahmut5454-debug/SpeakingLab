const fs = require('fs');

function fixFile(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');

    // Replace getAiClient or GoogleGenAI initialization
    if (filePath.includes('eltBot.ts')) {
        code = code.replace(
            /export const getApiKey = \(\) => "proxy_key";\nconst getAiClient = \(\) => new GoogleGenAI\(\{\s*apiKey:\s*getApiKey\(\),\s*httpOptions:\s*\{\s*baseUrl:\s*window\.location\.protocol\s*===\s*"https:"\s*\?\s*`https:\/\/\$\{window\.location\.host\}`\s*:\s*`http:\/\/\$\{window\.location\.host\}`\s*\}\s*\}\);\n/,
            `export const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || "proxy_key";
const getAiClient = () => {
    const key = getApiKey();
    if (key !== "proxy_key") {
        // Direct connection (for Vercel)
        return new GoogleGenAI({ apiKey: key });
    }
    // Proxy connection (for local / AI Studio)
    return new GoogleGenAI({ 
        apiKey: key, 
        httpOptions: { baseUrl: window.location.protocol === "https:" ? \`https://\${window.location.host}\` : \`http://\${window.location.host}\` } 
    });
};
`
        );
    } else if (filePath.includes('geminiInsights.ts')) {
        code = code.replace(
            /const apiKey = "proxy_key";\n\s*const ai = new GoogleGenAI\(\{ apiKey, httpOptions: \{ baseUrl: window\.location\.protocol === "https:" \? `https:\/\/\$\{window\.location\.host\}` : `http:\/\/\$\{window\.location\.host\}` \} \}\);/,
            `const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "proxy_key";
  let ai;
  if (apiKey !== "proxy_key") {
    ai = new GoogleGenAI({ apiKey });
  } else {
    ai = new GoogleGenAI({ 
        apiKey, 
        httpOptions: { baseUrl: window.location.protocol === "https:" ? \`https://\${window.location.host}\` : \`http://\${window.location.host}\` } 
    });
  }`
        );
    }
    
    fs.writeFileSync(filePath, code);
}

fixFile('src/lib/eltBot.ts');
fixFile('src/lib/geminiInsights.ts');
