const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// The clean operation introduced a massive loop of "i{" all over the file.
// Let's strip the file and get a clean version from git if possible, or we just write a fresh version for the report parsing.
// Actually, this file is completely mangled. 

code = code.replace(/\n\s*\}i\{\s*\n/g, '\n');
code = code.replace(/\s*\}i\{/g, '');

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Cleaned i braces.");
