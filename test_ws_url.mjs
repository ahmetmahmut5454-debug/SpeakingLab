import { GoogleGenAI } from "@google/genai";
import http from "http";

const server = http.createServer((req, res) => res.end("ok"));
server.on("upgrade", (req, socket) => {
    console.log("UPGRADE URL REQUESTED BY SDK:", req.url);
    socket.destroy();
    process.exit(0);
});
server.listen(4000, async () => {
    const ai = new GoogleGenAI({ apiKey: "fake", httpOptions: { baseUrl: "http://localhost:4000" } });
    try {
        await ai.live.connect({ model: "gemini-3.1-flash-live-preview" });
    } catch(e) {}
});
