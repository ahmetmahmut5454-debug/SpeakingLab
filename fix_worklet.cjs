const fs = require('fs');
let code = fs.readFileSync('src/lib/audioManager.ts', 'utf8');

code = code.replace(
    /      console\.warn\("AudioWorklet load issue \(might be already registered\):", e\);\n      AudioProcessor\.workletLoaded = true;\n    \}/,
    `      console.warn("AudioWorklet load issue:", e);
      AudioProcessor.workletLoaded = true; // Assume it's loaded if it throws
    }`
);

fs.writeFileSync('src/lib/audioManager.ts', code);
console.log("Patched audio manager worklet catch");
