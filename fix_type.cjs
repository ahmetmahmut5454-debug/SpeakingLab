const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'parameters: { type: 6, properties: {} }',
    'parameters: { type: "OBJECT", properties: {} }'
);

code = code.replace(
    'parameters: { type: 6, properties: { topic: { type: 1, description: "A short phrase describing the topic" } }, required: ["topic"] }',
    'parameters: { type: "OBJECT", properties: { topic: { type: "STRING", description: "A short phrase describing the topic" } }, required: ["topic"] }'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed function declaration types.");
