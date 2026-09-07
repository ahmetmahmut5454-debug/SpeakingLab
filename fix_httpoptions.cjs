const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
  /httpOptions:\s*\{\s*baseUrl:\s*window\.location\.protocol\s*===\s*"https:"\s*\?\s*`https:\/\/\$\{window\.location\.host\}`\s*:\s*`http:\/\/\$\{window\.location\.host\}`\s*\},/g,
  ''
);

fs.writeFileSync('src/lib/eltBot.ts', code);
