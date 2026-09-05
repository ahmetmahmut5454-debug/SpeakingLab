const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.session\.sendClientContent\(\{/,
    `console.log("SENDING SYSTEM TRIGGER MESSAGE");
                  this.session.sendClientContent({`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched sending log");
