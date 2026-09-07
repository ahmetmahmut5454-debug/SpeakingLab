const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    "socket.pipe(proxySocket);",
    "if (head && head.length) proxySocket.write(head);\n          socket.pipe(proxySocket);"
);

fs.writeFileSync('server.ts', code);
