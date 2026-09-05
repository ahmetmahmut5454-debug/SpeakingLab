const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.session\.sendClientContent\(\{[\s\S]*?turns: \[\{ role: "user", parts: \[\{ text: "System Note: The student has been silent.*?\}\] \}\],[\s\S]*?turnComplete: true,[\s\S]*?\}\);/,
    `this.session.sendClientContent({
          turns: "System Note: The student has been silent. Without breaking character, provide EXACTLY ONE short example sentence of what they could say to help them, and then stop. Do NOT give long explanations. Do NOT ask multiple questions. Keep it extremely brief so you do not interrupt their thinking process.",
          turnComplete: true,
        });`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched eltBot.ts hint message format");
