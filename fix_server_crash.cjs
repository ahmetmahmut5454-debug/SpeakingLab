const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "server.on('upgrade', (req, socket, head) => {",
  "server.on('upgrade', (req, socket, head) => {\n      socket.on('error', (e) => console.error('Socket error:', e));"
);
fs.writeFileSync('server.ts', code);
