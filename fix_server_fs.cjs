const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "import https from \"https\";",
  "import https from \"https\";\nimport fs from \"fs\";"
);

fs.writeFileSync('server.ts', code);
