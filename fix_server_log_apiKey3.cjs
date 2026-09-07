const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "fs.appendFileSync('proxy_status.log', 'APIKEY IN UPGRADE: ' + apiKey + '\\n');",
  "fs.appendFileSync('proxy_status.log', 'APIKEY IN UPGRADE: ' + apiKey + '\\nENV:' + JSON.stringify(process.env) + '\\n');"
);

fs.writeFileSync('server.ts', code);
