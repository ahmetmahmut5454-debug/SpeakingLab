const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');
code = code.replace(
  'const getAiClient = () => new GoogleGenAI({ apiKey: getApiKey() });',
  'const getAiClient = () => new GoogleGenAI({ apiKey: getApiKey(), httpOptions: { baseUrl: window.location.protocol === "https:" ? `https://${window.location.host}` : `http://${window.location.host}` } });'
);
fs.writeFileSync('src/lib/eltBot.ts', code);
