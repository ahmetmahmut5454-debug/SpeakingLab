const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "          options.headers['Sec-WebSocket-Extensions'] = req.headers['sec-websocket-extensions'];",
  "          (options.headers as any)['Sec-WebSocket-Extensions'] = req.headers['sec-websocket-extensions'];"
);
code = code.replace(
  "          options.headers['Sec-WebSocket-Protocol'] = req.headers['sec-websocket-protocol'];",
  "          (options.headers as any)['Sec-WebSocket-Protocol'] = req.headers['sec-websocket-protocol'];"
);

fs.writeFileSync('server.ts', code);

