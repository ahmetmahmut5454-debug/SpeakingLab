const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
  /this\.currentStream = await navigator\.mediaDevices\.getUserMedia\(\{\s*audio:\s*\{\s*channelCount:\s*1,\s*sampleRate:\s*16000,?\s*\},\s*\}\);/g,
  "this.currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });"
);

fs.writeFileSync('src/lib/eltBot.ts', code);
