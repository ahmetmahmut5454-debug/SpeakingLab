const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'model: "gemini-2.0-flash-exp"',
    'model: "gemini-2.0-flash"'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
