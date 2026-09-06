const fs = require('fs');
let code = fs.readFileSync('src/lib/audioManager.ts', 'utf8');

code = code.replace('const binary = window.atob(base64Data);', `
    console.log("Received chunk length:", base64Data.length);
    let binary;
    try {
        binary = window.atob(base64Data);
    } catch(e) {
        console.error("Failed to decode base64 audio chunk:", e);
        return;
    }
`);

fs.writeFileSync('src/lib/audioManager.ts', code);
console.log("Injected audio logs");
