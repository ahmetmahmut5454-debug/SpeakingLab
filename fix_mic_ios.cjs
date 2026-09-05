const fs = require('fs');
let code = fs.readFileSync('src/lib/audioManager.ts', 'utf8');

code = code.replace(
    /AudioProcessor\.globalContext\.resume\(\)\.catch\(\(\) => \{\}\);/,
    `AudioProcessor.globalContext.resume().then(() => console.log('Mic AudioContext unlocked')).catch(() => {});`
);

code = code.replace(
    /AudioPlayer\.globalContext\.resume\(\)\.catch\(\(\) => \{\}\);/,
    `AudioPlayer.globalContext.resume().then(() => console.log('Player AudioContext unlocked')).catch(() => {});`
);

fs.writeFileSync('src/lib/audioManager.ts', code);
console.log("Patched audio context logs");
