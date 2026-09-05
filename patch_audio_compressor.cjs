const fs = require('fs');
let code = fs.readFileSync('src/lib/audioManager.ts', 'utf8');

code = code.replace(
    /this\.compressor = this\.audioContext\.createDynamicsCompressor\(\);[\s\S]*?this\.compressor\.release\.setValueAtTime\(0\.25, this\.audioContext\.currentTime\);/g,
    `// Compressor removed for debugging`
);

code = code.replace(
    /this\.source\.connect\(this\.compressor\);\s*this\.compressor\.connect\(this\.analyser\);/g,
    `this.source.connect(this.analyser);`
);

fs.writeFileSync('src/lib/audioManager.ts', code);
console.log("Removed compressor from audioManager.ts");
