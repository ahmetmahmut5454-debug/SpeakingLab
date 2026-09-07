const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'console.error("Live session error:", error);',
    'console.error("Live session error:", error); alert("Live session error: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));'
);

code = code.replace(
    'console.log("Gemini Live session closed.");',
    'console.log("Gemini Live session closed."); alert("Gemini Live session closed unexpectedly");'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
