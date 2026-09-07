const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "console.log('APIKEY IN UPGRADE:', apiKey);",
  "fs.appendFileSync('proxy_status.log', 'APIKEY IN UPGRADE: ' + apiKey + '\\n');"
);

fs.writeFileSync('server.ts', code);
