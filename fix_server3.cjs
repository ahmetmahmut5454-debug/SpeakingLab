const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "proxyReq.on('response', (res) => {\n          socket.destroy();\n      });",
  "proxyReq.on('response', (res) => {\n          fs.appendFileSync('proxy_requests.log', 'Response instead of upgrade: ' + res.statusCode + '\\n');\n          socket.destroy();\n      });"
);
fs.writeFileSync('server.ts', code);
