const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'mediaChunks: [{',
    'media: [{'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed sendRealtimeInput to use 'media' instead of 'mediaChunks'");
