const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// I generated the prompt with markdown ticks but didn't escape them inside my template literal.
code = code.replace(/```json/g, '\\`\\`\\`json');
code = code.replace(/      ```/g, '      \\`\\`\\`');

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed escaping");
