import express from "express";
import "dotenv/config";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create an HTTP server so we can handle WebSockets
  const server = http.createServer(app);

  // WebSocket proxy for Gemini Live API
  const geminiProxy = createProxyMiddleware({
    target: "wss://generativelanguage.googleapis.com",
    changeOrigin: true,
    ws: true, // proxy websockets
    pathRewrite: (path, req) => {
      // Remove the dummy key and add the real API key
      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("No Gemini API key found in server environment!");
      }
      
      // Strip query string and add our own key
      const pathWithoutQuery = path.split('?')[0];
      return `${pathWithoutQuery}?key=${apiKey}`;
    },
    on: {
      error: (err) => {
         console.error("Proxy error:", err);
      }
    }
  });

  // Mount the proxy for WebSocket paths
  // The SDK hits /ws/...
  app.use("/ws", geminiProxy);
  app.use("/v1alpha", geminiProxy);
  app.use("/v1", geminiProxy);

  // API route for health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
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

  // We must listen on the `server`, not the `app`, so it binds WebSockets too!
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
