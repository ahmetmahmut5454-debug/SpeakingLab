const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /onclose: \(\) => \{\n\s*console\.log\("Gemini Live session closed\."\);\n\s*this\.isConnected = false;\n\s*this\.stop\(\); if \(this\.callbacks\.onBotFinished\) this\.callbacks\.onBotFinished\(\);\n\s*\}/,
    `onclose: (e) => {
          console.log("Gemini Live session closed.", e);
          this.isConnected = false;
          this.stop(); if (this.callbacks.onBotFinished) this.callbacks.onBotFinished();
        }`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched onclose to show reason");
