const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(/\n\s*\}\,\{\s*\n/g, '\n');
code = code.replace(/\}\,\{/g, '');

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Wiped comma braces.");
