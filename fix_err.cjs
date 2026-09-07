const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'console.error("Error starting EltBot", err);',
    'console.error("Error starting EltBot", err?.message, err);'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
