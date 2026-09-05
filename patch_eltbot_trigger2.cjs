const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.session\.sendClientContent\(\{\s*turns: triggerMessage,\s*turnComplete: true,\s*\}\);/,
    `this.session.sendClientContent({
                    turns: [{ role: "user", parts: [{ text: triggerMessage }] }],
                    turnComplete: true,
                  });`
);

code = code.replace(
    /this\.session\.sendClientContent\(\{\s*turns: historyContext,\s*turnComplete: true,\s*\}\);/,
    `this.session.sendClientContent({
                    turns: [{ role: "user", parts: [{ text: historyContext }] }],
                    turnComplete: true,
                  });`
);

code = code.replace(
    /this\.session\.sendClientContent\(\{\s*turns: "System Note: The student has been silent[^"]*",\s*turnComplete: true,\s*\}\);/,
    `this.session.sendClientContent({
          turns: [{ role: "user", parts: [{ text: "System Note: The student has been silent. Without breaking character, provide EXACTLY ONE short example sentence of what they could say to help them, and then stop. Do NOT give long explanations. Do NOT ask multiple questions. Keep it extremely brief so you do not interrupt their thinking process." }] }],
          turnComplete: true,
        });`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched eltBot.ts trigger message format back to array");
