const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "proxySocket.pipe(socket);",
  "proxySocket.on('data', d => console.log('S->C bytes:', d.length)); proxySocket.pipe(socket);"
);
code = code.replace(
  "socket.pipe(proxySocket);",
  "socket.on('data', d => console.log('C->S bytes:', d.length)); socket.pipe(proxySocket);"
);
fs.writeFileSync('server.ts', code);
