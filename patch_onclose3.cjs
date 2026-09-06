const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /onclose: \(e\) => \{\n\s*console\.log\("Gemini Live session closed\.", e\);\n\s*this\.isConnected = false;\n\s*this\.stop\(\); if \(this\.callbacks\.onBotFinished\) this\.callbacks\.onBotFinished\(\);\n\s*\}/,
    `onclose: (e: any) => {
          console.log("Gemini Live session closed.", e);
          if (e && e.code && e.code !== 1000) {
              alert("Connection closed unexpectedly. Code: " + e.code + " Reason: " + e.reason);
          }
          this.isConnected = false;
          this.stop(); if (this.callbacks.onBotFinished) this.callbacks.onBotFinished();
        }`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched onclose3");
