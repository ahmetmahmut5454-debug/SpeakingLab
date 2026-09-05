const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /          const parts = message\.serverContent\?\.modelTurn\?\.parts;\n          console\.log\("Received parts from server: ", parts\?\.length\);/,
    `          console.log("Raw message from server:", JSON.stringify(message).substring(0, 500));
          const parts = message.serverContent?.modelTurn?.parts;
          console.log("Received parts from server: ", parts?.length);`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched eltBot logs");
