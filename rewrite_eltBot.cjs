const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Undo all the `send({ clientContent: ... })` garbage
code = code.replace(
    /this\.session\.send\(\{\s*clientContent:\s*\{\s*turns:\s*\[\{\s*role:\s*"user",\s*parts:\s*\[\{\s*text:\s*triggerMessage\s*\}\]\s*\}\],\s*turnComplete:\s*true\s*\}\s*\}\);/g,
    `this.session.sendClientContent({ turns: [{ role: "user", parts: [{ text: triggerMessage }] }], turnComplete: true });`
);

code = code.replace(
    /this\.session\.send\(\{\s*clientContent:\s*\{\s*turns:\s*\[\{\s*role:\s*"user",\s*parts:\s*\[\{\s*text:\s*historyContext\s*\}\]\s*\}\],\s*turnComplete:\s*true\s*\}\s*\}\);/g,
    `this.session.sendClientContent({ turns: [{ role: "user", parts: [{ text: historyContext }] }], turnComplete: true });`
);

code = code.replace(
    /this\.session\.send\(\{\s*realtimeInput:\s*\{\s*mediaChunks:\s*\[\{\s*data,\s*mimeType:\s*"audio\/pcm;rate=16000",\s*\}\]\s*\}\s*\}\);/g,
    `this.session.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } });`
);

// We need to fix hint request too, just in case
code = code.replace(
    /this\.session\.sendClientContent\(\{\s*turns:\s*\[\{\s*role:\s*"user",\s*parts:\s*\[\{\s*text:\s*"System Note: The student has been silent. Provide EXACTLY ONE short example sentence of what they could say to help them."\s*\}\]\s*\}\],\s*turnComplete:\s*true,\s*\}\);/g,
    `this.session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "System Note: The student has been silent. Provide EXACTLY ONE short example sentence of what they could say to help them." }] }], turnComplete: true });`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Restored correct method calls");
