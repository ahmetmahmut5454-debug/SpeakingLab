const fs = require('fs');
let code = `import express from "express";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Intercept and normalize WebSocket URLs in middleware (though this only hits GET requests, not UPGRADE)
  app.use((req, res, next) => {
    req.url = req.url.replace(/^\\/+/, "/");
    next();
  });

  const apiProxy = createProxyMiddleware({
    target: "https://generativelanguage.googleapis.com",
    changeOrigin: true,
    ws: true,
    pathRewrite: (path, req) => {
      let normalized = path.replace(/^\\/+/, "/");
      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (normalized.includes("?")) {
          return normalized + "&key=" + apiKey;
      }
      return normalized + "?key=" + apiKey;
    },
    onProxyReqWs: (proxyReq, req, socket, options, head) => {
       console.log("Upgraded WS:", req.url);
    }
  });

  app.use("/ws", apiProxy);
  app.use("/v1alpha", apiProxy);
  app.use("/v1beta", apiProxy);
  app.use("/v1", apiProxy);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  const server = http.createServer(app);

  // We need to handle the manual upgrade because http-proxy-middleware relies on app.listen,
  // but we are using http.createServer. Actually app.listen creates it anyway.
  // We explicitly catch upgrade to fix the double slash before it hits the proxy middleware.
  server.on('upgrade', (req, socket, head) => {
      req.url = req.url.replace(/^\\/+/, "/");
      if (req.url.startsWith("/ws") || req.url.startsWith("/v1alpha") || req.url.startsWith("/v1")) {
          apiProxy.upgrade(req, socket, head);
      }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
`;

fs.writeFileSync('server.ts', code);
