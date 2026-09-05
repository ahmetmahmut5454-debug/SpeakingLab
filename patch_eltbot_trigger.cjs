const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.session\.sendClientContent\(\{[\s\S]*?turns: \[\{ role: "user", parts: \[\{ text: triggerMessage \}\] \}\],[\s\S]*?turnComplete: true,[\s\S]*?\}\);/,
    `this.session.sendClientContent({
                    turns: triggerMessage,
                    turnComplete: true,
                  });`
);

code = code.replace(
    /this\.session\.sendClientContent\(\{[\s\S]*?turns: \[\{ role: "user", parts: \[\{ text: historyContext \}\] \}\],[\s\S]*?turnComplete: true,[\s\S]*?\}\);/,
    `this.session.sendClientContent({
                    turns: historyContext,
                    turnComplete: true,
                  });`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched eltBot.ts trigger message format");
