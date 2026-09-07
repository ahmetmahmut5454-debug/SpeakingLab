const fs = require('fs');
let code = `
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import https from "https";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const server = http.createServer(app);

  server.on('upgrade', (req, socket, head) => {
      let targetUrl = req.url.replace(/^\\/+/, "/");
      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      
      targetUrl = targetUrl.replace(/([?&])key=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'key=' + apiKey;

      const options = {
          hostname: 'generativelanguage.googleapis.com',
          port: 443,
          path: targetUrl,
          method: 'GET',
          headers: {
              'Connection': 'Upgrade',
              'Upgrade': 'websocket',
              'Sec-WebSocket-Key': req.headers['sec-websocket-key'],
              'Sec-WebSocket-Version': req.headers['sec-websocket-version'],
              'Host': 'generativelanguage.googleapis.com'
          }
      };
      
      const proxyReq = https.request(options);
      
      proxyReq.on('response', (res) => {
          socket.write(\`HTTP/1.1 \${res.statusCode} \${res.statusMessage}\\r\\n\\r\\n\`);
          res.pipe(socket);
      });
      
      proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
          let headers = 'HTTP/1.1 101 Web Socket Protocol Handshake\\r\\n' +
                       'Upgrade: WebSocket\\r\\n' +
                       'Connection: Upgrade\\r\\n' +
                       'Sec-WebSocket-Accept: ' + proxyRes.headers['sec-websocket-accept'] + '\\r\\n\\r\\n';
          socket.write(headers);
          if (proxyHead && proxyHead.length) socket.write(proxyHead);
          proxySocket.pipe(socket);
          socket.pipe(proxySocket);
      });
      
      proxyReq.on('error', (e) => socket.destroy());
      proxyReq.end();
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}
startServer();
`;

fs.writeFileSync('server.ts', code);
