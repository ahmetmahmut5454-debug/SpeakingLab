import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

// Load .env first, then .env.local to override
dotenv.config();
if (fs.existsSync(".env.local")) {
    const envConfig = dotenv.parse(fs.readFileSync(".env.local"));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  const apiKey = process.env.GEMINI_API_KEY;

  // Set up the websocket and REST proxy
  const apiProxy = createProxyMiddleware({
      target: "https://generativelanguage.googleapis.com",
      changeOrigin: true,
      ws: true,
      pathRewrite: (path, req) => {
          let newPath = path.replace(/^\/+/, "/");
          newPath = newPath.replace(/([?&])key=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
          return newPath + (newPath.includes('?') ? '&' : '?') + 'key=' + apiKey;
      },
      onProxyReqWs: (proxyReq, req, socket, options, head) => {
         proxyReq.setHeader('Host', 'generativelanguage.googleapis.com');
      }
  });

  // Proxy WebSocket Live API
  app.use('/ws', apiProxy);
  // Proxy REST API (generateContent)
  app.use('/v1beta', apiProxy);
  app.use('/v1', apiProxy);
  app.use('/v1alpha', apiProxy);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const server = http.createServer(app);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
