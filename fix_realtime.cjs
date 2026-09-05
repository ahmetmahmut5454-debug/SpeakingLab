const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /mediaChunks: \[\{\n\s*data,\n\s*mimeType: "audio\/pcm;rate=16000",\n\s*\}\],/,
    `audio: {
                        data,
                        mimeType: "audio/pcm;rate=16000",
                      },`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed sendRealtimeInput format");
