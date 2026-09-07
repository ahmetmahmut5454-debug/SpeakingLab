const OriginalWebSocket = WebSocket;
window = global;
window.WebSocket = function(url, protocols) {
    return new OriginalWebSocket(url, protocols);
};
window.WebSocket.prototype = OriginalWebSocket.prototype;
try {
  window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
} catch (e) {
  console.error("Error:", e.message);
}
