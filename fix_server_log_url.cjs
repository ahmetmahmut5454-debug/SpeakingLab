const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'key=' + apiKey;",
  "targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'key=' + apiKey;\n      fs.appendFileSync('proxy_requests.log', 'Final URL: ' + targetUrl + '\\n');"
);

fs.writeFileSync('server.ts', code);
