const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

if (!code.includes('OriginalWebSocket')) {
  const patch = `
const OriginalWebSocket = window.WebSocket;
window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
    if (typeof url === 'string') {
        url = url.replace(/\\/\\/ws\\//g, '/ws/');
    } else if (url instanceof URL) {
        url.pathname = url.pathname.replace(/^\\/\\/ws\\//, '/ws/');
    }
    return new OriginalWebSocket(url, protocols);
} as any;
window.WebSocket.prototype = OriginalWebSocket.prototype;
window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
window.WebSocket.OPEN = OriginalWebSocket.OPEN;
window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
`;
  code = code.replace(
    'export const cleanTranscript = (text: string) => {',
    patch + '\nexport const cleanTranscript = (text: string) => {'
  );
  fs.writeFileSync('src/lib/eltBot.ts', code);
}
