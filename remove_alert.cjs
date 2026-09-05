const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /alert\("Gemini Live session opened successfully!"\);\n/,
    ``
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Removed alert");
