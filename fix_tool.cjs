const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.session\.sendToolResponse\(\[\s*\{\s*functionResponse:\s*\{\s*name:\s*"endConversation",\s*id:\s*fc\.id,\s*response:\s*\{\s*success:\s*true\s*\}\s*,\s*\}\s*,\s*\}\s*,\s*\]\);/g,
    `this.session.sendToolResponse({ functionResponses: [{ name: "endConversation", id: fc.id, response: { success: true } }] });`
);

code = code.replace(
    /this\.session\.sendToolResponse\(\[\s*\{\s*functionResponse:\s*\{\s*name:\s*"showCueCard",\s*id:\s*fc\.id,\s*response:\s*\{\s*success:\s*true,\s*instruction:\s*"[^"]+"\s*\}\s*,\s*\}\s*,\s*\}\s*,\s*\]\);/g,
    `this.session.sendToolResponse({ functionResponses: [{ name: "showCueCard", id: fc.id, response: { success: true, instruction: "Tool successful." } }] });`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed tool responses");
