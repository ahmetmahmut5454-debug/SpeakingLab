const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Using regex to wipe out everything that looks like the corrupted block starting at 'e{' or 'r{'
// The previous match logic failed because there are multiple matches now.

code = code.replace(/\n\s*\}[a-z]\{\s*\n/g, '\n');
code = code.replace(/\s*\}[a-z]\{/g, '');

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Wiped braces 2.");
