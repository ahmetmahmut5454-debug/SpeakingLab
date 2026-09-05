const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.session = await ai\.live\.connect\(\{\n\s*model: "gemini-3\.1-flash-live-preview",\n\s*config: \{/,
    `this.session = await ai.live.connect({
        model: "gemini-2.0-flash-exp",
        config: {`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched model name");
