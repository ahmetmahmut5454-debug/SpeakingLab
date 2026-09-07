const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Remove verbose logging
code = code.replace(/console\.log\("Gemini Live session opened\."\);/g, '');
code = code.replace(/this\.isConnected = true; console\.log\("Connected is now TRUE\. Sending setup messages\.\.\."\);/g, 'this.isConnected = true;');
code = code.replace(/console\.log\("Raw message from server:", message\);/g, '');
code = code.replace(/console\.log\("AI called endConversation function!"\);/g, '');
code = code.replace(/console\.log\("Gemini Live session closed\.", e\?\.code, e\?\.reason\);/g, '');
code = code.replace(/console\.error\("Live session error details:", error\?\.message, error\);/g, 'console.error("Live session error");');
code = code.replace(/console\.log\("Unexpected disconnect\."\);/g, '');
code = code.replace(/console\.log\("Sending hint request to bot\.\.\."\);/g, '');

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Cleaned up developer logs.");
