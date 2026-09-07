const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "let normalized = path.replace(/^\\/+/, \"/\");",
  "let normalized = path.replace(/^\\/+/, \"/\");\n      normalized = normalized.replace(/([?&])key=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');"
);

fs.writeFileSync('server.ts', code);
