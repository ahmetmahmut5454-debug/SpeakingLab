const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.session\.sendRealtimeInput\(\{\n                      media: \[\{\n                        data,\n                        mimeType: "audio\/pcm;rate=16000",\n                      \}\],\n                    \}\);/,
    `this.session.sendRealtimeInput({
                      audio: {
                        data,
                        mimeType: "audio/pcm;rate=16000",
                      }
                    });`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed sendRealtimeInput payload for audio");
