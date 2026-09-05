const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.session\.sendClientContent\(\{\n\s*turns: \[\{ role: "user", parts: \[\{ text: triggerMessage \}\] \}\],\n\s*turnComplete: true,\n\s*\}\);/,
    `this.session.send({ clientContent: { turns: [{ role: "user", parts: [{ text: triggerMessage }] }], turnComplete: true } });`
);

code = code.replace(
    /this\.session\.sendClientContent\(\{\n\s*turns: \[\{ role: "user", parts: \[\{ text: historyContext \}\] \}\],\n\s*turnComplete: true,\n\s*\}\);/,
    `this.session.send({ clientContent: { turns: [{ role: "user", parts: [{ text: historyContext }] }], turnComplete: true } });`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched sendClientContent");
