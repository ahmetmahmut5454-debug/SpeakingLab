const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    'baseUrl: window.location.protocol === "https:" ? `wss://${window.location.host}` : `ws://${window.location.host}`',
    'baseUrl: window.location.protocol === "https:" ? `https://${window.location.host}` : `http://${window.location.host}`'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed baseUrl in eltBot.ts");
