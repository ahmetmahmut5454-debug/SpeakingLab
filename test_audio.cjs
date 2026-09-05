const fs = require('fs');
let code = fs.readFileSync('src/lib/audioManager.ts', 'utf8');

code = code.replace(
    /this\.source \.connect\(this\.compressor\);\n\s*this\.compressor\s*\.connect\(this\.analyser\);\n\s*this\.analyser\s*\.connect\(this\.workletNode\);\n\s*this\.workletNode\.connect\(this\.audioContext\.destination\);/,
    `this.source
      .connect(this.analyser);
    this.analyser
      .connect(this.workletNode);
    // WorkletNode should NOT connect to destination to prevent feedback loop
    // this.workletNode.connect(this.audioContext.destination);`
);

fs.writeFileSync('src/lib/audioManager.ts', code);
console.log("Patched audio manager");
