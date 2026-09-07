const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'model: "gemini-2.0-flash"',
    'model: "gemini-2.0-flash-exp"'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Reverted model to gemini-2.0-flash-exp");
