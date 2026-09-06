const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// 1. Add AudioPlayer to imports
code = code.replace(
    'import { AudioProcessor } from "./audioManager";',
    'import { AudioProcessor, AudioPlayer } from "./audioManager";'
);

// 2. Fix EltBot constructor
code = code.replace(
    /    this\.audioPlayer = \{\n      isPlaying: false,\n      playChunk: \(data: string, onLevel: \(l:number\)=>void\) => \{\},\n      clear: \(\) => \{\}\n    \};/,
    '    this.audioPlayer = new AudioPlayer();'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Restored audio playback!");
