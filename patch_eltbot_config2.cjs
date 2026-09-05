const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /systemInstruction: systemInstruction,/,
    `systemInstruction: { parts: [{ text: systemInstruction }] },`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched eltBot.ts config back to parts");
