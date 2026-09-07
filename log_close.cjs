const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'onclose: () => {',
    'onclose: (e: any) => {\n            console.log("Gemini Live session closed.", e?.code, e?.reason);'
);

code = code.replace(
    'onerror: (error: any) => {',
    'onerror: (error: any) => {\n            console.error("Live session error details:", error?.message, error);'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Added close/error event logging");
