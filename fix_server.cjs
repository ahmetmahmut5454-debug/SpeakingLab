const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  'target: "https://generativelanguage.googleapis.com",',
  'target: "wss://generativelanguage.googleapis.com",'
);
code = code.replace(
  "return path.split('?')[0] + \"?key=\" + apiKey;",
  "let cleanPath = path.replace(/^\\/+/, '/');\n      return cleanPath.split('?')[0] + '?key=' + apiKey;"
);
fs.writeFileSync('server.ts', code);
