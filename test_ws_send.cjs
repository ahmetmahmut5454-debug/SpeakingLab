const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=proxy_key');

ws.on('open', () => {
    console.log('Proxy Opened!');
    ws.send(JSON.stringify({ clientContent: { turns: [] } }));
    console.log('Sent data!');
});

ws.on('message', (data) => {
    console.log('Received:', data.toString());
    process.exit(0);
});

ws.on('error', (e) => console.error('Proxy Error!', e.message));
ws.on('close', () => { console.log('Closed'); process.exit(1); });
