const fs = require('fs');
let code = fs.readFileSync('src/lib/geminiInsights.ts', 'utf8');

// Force it to use proxy_key
code = code.replace(
    'const apiKey = getApiKey();\n  if (!apiKey) {\n    throw new Error("API key is missing.");\n  }',
    'const apiKey = "proxy_key";'
);
// Also modify the ai client initialization
code = code.replace(
    'const ai = new GoogleGenAI({ apiKey });',
    'const ai = new GoogleGenAI({ apiKey, httpOptions: { baseUrl: window.location.protocol === "https:" ? `https://${window.location.host}` : `http://${window.location.host}` } });'
);

fs.writeFileSync('src/lib/geminiInsights.ts', code);
console.log("Fixed geminiInsights proxy.");
