const fs = require('fs');
let code = fs.readFileSync('src/lib/translationService.ts', 'utf8');
code = code.replace(
  'const ai = new GoogleGenAI({ apiKey });',
  'const ai = new GoogleGenAI({ apiKey, httpOptions: { baseUrl: window.location.protocol === "https:" ? `https://${window.location.host}` : `http://${window.location.host}` } });'
);
fs.writeFileSync('src/lib/translationService.ts', code);
