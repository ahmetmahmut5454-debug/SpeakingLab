const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "console.log('Using API KEY starts with:', apiKey ? apiKey.substring(0, 5) : 'NONE');",
  "fs.appendFileSync('proxy_requests.log', 'API Key starts with: ' + (apiKey ? apiKey.substring(0, 5) : 'NONE') + '\\n');"
);

fs.writeFileSync('server.ts', code);
