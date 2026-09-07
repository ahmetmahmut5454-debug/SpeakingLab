const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const app = express();
app.use('/ws', createProxyMiddleware({
  target: 'http://localhost:8080',
  pathRewrite: (path, req) => {
    console.log("Rewrite path:", path);
    console.log("Original URL:", req.originalUrl);
    return path;
  }
}));
app.listen(8081, () => {
  const http = require('http');
  http.get('http://localhost:8081/ws/test?hello=world', (res) => {
    process.exit(0);
  });
});
