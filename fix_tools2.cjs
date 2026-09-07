const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'parameters: { type: "OBJECT", properties: {} }',
    '// no parameters needed for endConversation'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Removed empty parameters from endConversation");
