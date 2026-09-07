import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3000/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=proxy_key');

ws.on('open', () => {
    console.log("Opened WS!");
    // Send a setup message (JSON)
    ws.send(JSON.stringify({
        setup: {
            model: "models/gemini-2.0-flash-exp"
        }
    }));
});

ws.on('message', (data) => {
    console.log("Received data:", data.toString());
});

ws.on('close', () => {
    console.log("Closed WS");
});

ws.on('error', (e) => {
    console.error("WS Error", e);
});

setTimeout(() => process.exit(0), 5000);
