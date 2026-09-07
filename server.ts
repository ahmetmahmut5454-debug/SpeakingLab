import express from "express";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import https from "https";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  const server = http.createServer(app);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  server.on("upgrade", (req, socket, head) => {
    // Normalize URL
    req.url = req.url!.replace(/^\/+/, "/");
    fs.appendFileSync("proxy_requests.log", "Manual Upgrade: " + req.url + "\n");
    
    if (req.url.startsWith("/ws") || req.url.startsWith("/v1alpha") || req.url.startsWith("/v1")) {
      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        socket.destroy();
        return;
      }
      
      const targetUrl = req.url.split('?')[0] + "?key=" + apiKey;
            
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
      if (req.headers['sec-websocket-extensions']) {
          (options.headers as any)['Sec-WebSocket-Extensions'] = req.headers['sec-websocket-extensions'];
      }
      if (req.headers['sec-websocket-protocol']) {
          (options.headers as any)['Sec-WebSocket-Protocol'] = req.headers['sec-websocket-protocol'];
      }
      
      const proxyReq = https.request(options);
      
      proxyReq.on('response', (res) => {
          fs.appendFileSync('proxy_requests.log', 'Response instead of upgrade: ' + res.statusCode + '\n');
          socket.destroy();
      });
      
      proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
          let headers = 'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
                       'Upgrade: WebSocket\r\n' +
                       'Connection: Upgrade\r\n' +
                       'Sec-WebSocket-Accept: ' + proxyRes.headers['sec-websocket-accept'] + '\r\n';
                       
          if (proxyRes.headers['sec-websocket-protocol']) {
              headers += 'Sec-WebSocket-Protocol: ' + proxyRes.headers['sec-websocket-protocol'] + '\r\n';
          }
          if (proxyRes.headers['sec-websocket-extensions']) {
              headers += 'Sec-WebSocket-Extensions: ' + proxyRes.headers['sec-websocket-extensions'] + '\r\n';
          }
          headers += '\r\n';
          
          socket.write(headers);
          
          if (proxyHead && proxyHead.length) socket.write(proxyHead);
          proxySocket.pipe(socket);
          if (head && head.length) proxySocket.write(head);
          socket.pipe(proxySocket);
      });
      
      proxyReq.on('error', (e) => {
          socket.destroy();
      });
      
      proxyReq.end();
      return;
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
