const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Add more extensive logging to see EXACTLY what happens to the stream
// and if it receives anything at all.

code = code.replace(
    'console.log("Raw message from server:", JSON.stringify(message).substring(0, 500));',
    'console.log("Raw message from server:", message);'
);

code = code.replace(
    'this.isConnected = true;',
    'this.isConnected = true; console.log("Connected is now TRUE. Sending setup messages...");'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Added better logging to eltBot.ts");
