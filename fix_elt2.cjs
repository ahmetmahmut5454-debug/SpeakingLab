const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Remove the one I just added
code = code.replace('        config: { httpOptions: { baseUrl: `ws://${window.location.host}` } },\n', '');

// Add it to the existing config
code = code.replace(
    '        config: {\n          responseModalities: ["AUDIO"] as any,',
    '        config: {\n          httpOptions: { baseUrl: window.location.protocol === "https:" ? `wss://${window.location.host}` : `ws://${window.location.host}` },\n          responseModalities: ["AUDIO"] as any,'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed config property.");
