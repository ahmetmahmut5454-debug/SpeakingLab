const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /systemInstruction: \{ parts: \[\{ text: systemInstruction \}\] \},/,
    `systemInstruction: systemInstruction,`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched eltBot.ts config");
