const fs = require('fs');
let code = fs.readFileSync('src/lib/audioManager.ts', 'utf8');

code = code.replace(
    /this\.workletNode\.connect\(this\.audioContext\.destination\);/,
    `// this.workletNode.connect(this.audioContext.destination);`
);

fs.writeFileSync('src/lib/audioManager.ts', code);
console.log("Patched audio manager 3");
