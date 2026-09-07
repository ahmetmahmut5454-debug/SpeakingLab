const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'turns: triggerMessage,',
    'turns: [{ role: "user", parts: [{ text: triggerMessage }] }],'
);

code = code.replace(
    'turns: historyContext,',
    'turns: [{ role: "user", parts: [{ text: historyContext }] }],'
);

code = code.replace(
    'turns: "System Note: The student has been silent. Provide EXACTLY ONE short example sentence of what they could say to help them.",',
    'turns: [{ role: "user", parts: [{ text: "System Note: The student has been silent. Provide EXACTLY ONE short example sentence of what they could say to help them." }] }],'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed sendClientContent turns to be Content[]");
