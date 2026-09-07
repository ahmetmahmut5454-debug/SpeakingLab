import WebSocket from 'ws';
const ws = new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=AIzaSyD3L2qUlEVFZDbqpSkMq3gdG_S4gNy5pbo');

ws.on('open', () => {
    ws.send(JSON.stringify({
        setup: {
            model: "models/gemini-3.1-flash-live-preview"
        }
    }));
});
ws.on('message', (data) => {
    console.log("Received:", data.toString().substring(0, 100));
    ws.close();
});
ws.on('close', (code, reason) => {
    console.log("Closed WS, code:", code, "reason:", reason.toString());
});
