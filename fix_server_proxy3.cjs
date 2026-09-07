const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "console.log(\"Upgraded WS:\", req.url);",
  "console.log(\"Upgraded WS:\", req.url, \" -> \", options.path);"
);

fs.writeFileSync('server.ts', code);
