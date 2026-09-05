const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /audio: \{[\s\S]*?data,[\s\S]*?mimeType: "audio\/pcm;rate=16000",[\s\S]*?\},/,
    `mediaChunks: [{
                      data,
                      mimeType: "audio/pcm;rate=16000",
                    }],`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched eltBot.ts audio format");
