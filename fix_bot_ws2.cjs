const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(/window\.WebSocket\.CONNECTING = OriginalWebSocket\.CONNECTING;/g, '');
code = code.replace(/window\.WebSocket\.OPEN = OriginalWebSocket\.OPEN;/g, '');
code = code.replace(/window\.WebSocket\.CLOSING = OriginalWebSocket\.CLOSING;/g, '');
code = code.replace(/window\.WebSocket\.CLOSED = OriginalWebSocket\.CLOSED;/g, '');

fs.writeFileSync('src/lib/eltBot.ts', code);
