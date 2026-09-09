const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Replace everything related to getAiClient and getApiKey
code = code.replace(
    /export const getApiKey = \(\) => "proxy_key";\s*const getAiClient = \(\) => new GoogleGenAI\(\{\s*apiKey: getApiKey\(\),\s*httpOptions: \{ baseUrl: window\.location\.protocol === "https:" \? `https:\/\/\$\{window\.location\.host\}` : `http:\/\/\$\{window\.location\.host\}` \}\s*\}\);/,
    `export const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || "proxy_key";
const getAiClient = () => {
    const key = getApiKey();
    if (key !== "proxy_key") {
        return new GoogleGenAI({ apiKey: key });
    }
    return new GoogleGenAI({ 
        apiKey: key, 
        httpOptions: { baseUrl: window.location.protocol === "https:" ? \`https://\${window.location.host}\` : \`http://\${window.location.host}\` } 
    });
};`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
