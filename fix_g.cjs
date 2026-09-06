const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// The file still has duplicates starting with `}G{`. Let's wipe all of these duplicates globally using proper regex.
// Basically, we have this pattern: `\s*\}[a-zA-Z]\{\s*` connecting blocks.
code = code.replace(/\n\s*\}[a-zA-Z]\{\s*\n/g, '\n');
code = code.replace(/\}[a-zA-Z]\{/g, '');

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Wiped all letter braces.");
