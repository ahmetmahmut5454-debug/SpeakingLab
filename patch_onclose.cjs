const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /onclose: \(\(e: any\) => \{\|onclose: \(e\) => \{/,
    `onclose: (e: any) => {
          console.log("Gemini Live session closed.", e);
          if (e && e.code && e.code !== 1000) {
              alert("Connection closed unexpectedly. Code: " + e.code + " Reason: " + e.reason);
          }`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched onclose");
