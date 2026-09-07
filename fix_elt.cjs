const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// The client requires a non-empty api key, so we pass 'proxy_key'
code = code.replace(
    'export const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("gemini_custom_key") || "";',
    'export const getApiKey = () => "proxy_key";'
);

// Add httpOptions to live.connect
// We want to proxy the WebSocket via our backend
code = code.replace(
    '        model: "gemini-2.0-flash",\n        callbacks: {',
    '        model: "gemini-2.0-flash",\n        config: { httpOptions: { baseUrl: `ws://${window.location.host}` } },\n        callbacks: {'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Updated eltBot.ts to use proxy.");
