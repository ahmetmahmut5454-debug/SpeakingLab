const OriginalWebSocket = global.WebSocket;
class PatchedWebSocket {
    constructor(url, protocols) {
        if (typeof url === 'string' && url.includes('//ws/')) {
            url = url.replace('//ws/', '/ws/');
        }
        return new OriginalWebSocket(url, protocols);
    }
}
