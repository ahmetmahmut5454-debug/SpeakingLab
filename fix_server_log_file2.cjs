const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;",
  "const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;\n      fs.appendFileSync('proxy_requests.log', 'API Key starts with: ' + (apiKey ? apiKey.substring(0, 5) : 'NONE') + '\\n');\n      fs.appendFileSync('proxy_requests.log', 'Req URL: ' + targetUrl + '\\n');"
);

fs.writeFileSync('server.ts', code);
