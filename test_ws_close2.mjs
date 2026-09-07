import WebSocket from 'ws';
const ws = new WebSocket('ws://localhost:3000/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=proxy_key', {
  headers: {
    // I can't easily bypass the proxy key override because the proxy forces it to the env var.
  }
});

ws.on('open', () => {
    ws.send(JSON.stringify({
        setup: {
            model: "models/gemini-3.1-flash-live-preview"
        }
    }));
});
ws.on('close', (code, reason) => {
    console.log("Closed WS, code:", code, "reason:", reason.toString());
});
