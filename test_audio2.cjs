const fs = require('fs');
let code = fs.readFileSync('src/lib/audioManager.ts', 'utf8');

code = code.replace('const pcmData = new Int16Array(bytes.buffer);', `
    if (bytes.length % 2 !== 0) {
        console.warn("Odd byte length:", bytes.length);
    }
    // safely create Int16Array
    const bufferLength = Math.floor(bytes.length / 2) * 2;
    const pcmData = new Int16Array(bytes.buffer, 0, bufferLength / 2);
`);

fs.writeFileSync('src/lib/audioManager.ts', code);
console.log("Injected safe pcm");
