const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The Gemini SDK uses `/v1alpha` for standard HTTP calls, and `/ws` for websockets.
code = code.replace('app.use("/ws", geminiProxy);', 'app.use("/ws", geminiProxy);\n  app.use("/v1alpha", geminiProxy);\n  app.use("/v1", geminiProxy);');

fs.writeFileSync('server.ts', code);
console.log("Updated server proxy routes.");
