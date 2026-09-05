const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /voiceName: "Aoede" \/\/ Other options: "Puck", "Charon", "Kore", "Fenrir" depending on preference/,
    `voiceName: context.voice || "Puck" // Using 'Puck' for a very natural, conversational tone`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Updated voice to Puck");
