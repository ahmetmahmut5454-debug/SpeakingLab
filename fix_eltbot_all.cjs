const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// 1. Remove the window.WebSocket monkey patch
code = code.replace(/const OriginalWebSocket = window\.WebSocket;[\s\S]*?window\.WebSocket\.prototype = OriginalWebSocket\.prototype;/m, '');

// 2. Fix the try/catch in start()
code = code.replace(/catch\s*\(err\)\s*{\s*console\.error\("Error starting EltBot", err, err\);\s*}/m, 'catch (err) { console.error("Error starting EltBot", err); if (this.callbacks.onError) this.callbacks.onError(err); throw err; }');

// 3. Fix getUserMedia
code = code.replace(/await navigator\.mediaDevices\.getUserMedia\(\{\s*audio:\s*true\s*\}\);/m, 'await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });');

// 4. Fix error and close handlers
code = code.replace(/onerror:\s*\(error:\s*any\)\s*=>\s*{[\s\S]*?this\.handleUnexpectedDisconnect\(\);\s*},/m, 'onerror: (error: any) => { console.error("Live session error:", error); this.isConnected = false; if (this.callbacks.onError) this.callbacks.onError(error); this.handleUnexpectedDisconnect(); },');

code = code.replace(/onclose:\s*\(e:\s*any\)\s*=>\s*{[\s\S]*?this\.handleUnexpectedDisconnect\(\);\s*},/m, 'onclose: (e: any) => { console.log("Gemini Live session closed."); this.isConnected = false; this.handleUnexpectedDisconnect(); },');

// 5. Fix model in generateReport
code = code.replace(/const models = \["gemini-2\.0-flash"\];/m, 'const models = ["gemini-2.5-flash", "gemini-1.5-flash"];');

fs.writeFileSync('src/lib/eltBot.ts', code);
