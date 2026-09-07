const { createProxyMiddleware } = require("http-proxy-middleware");
const geminiProxy = createProxyMiddleware({ target: "https://google.com" });
console.log("Upgrade function:", typeof geminiProxy.upgrade);
