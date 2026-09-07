import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
global.fetch = fetch;

const ai = new GoogleGenAI({ apiKey: "proxy_key", httpOptions: { baseUrl: "http://localhost:3000" } });

async function run() {
    try {
        console.log("Connecting...");
        const session = await ai.live.connect({ 
            model: "gemini-3.1-flash-live-preview",
            callbacks: {
                onsetupcomplete: () => console.log("Setup complete!"),
                onmessage: (msg) => console.log("Msg:", msg.serverContent ? 'serverContent' : msg),
                onerror: (e) => console.error("Err!", e),
                onclose: () => console.log("Closed")
            },
            config: {
                systemInstruction: { parts: [{ text: "You are a helpful assistant." }] },
            }
        });
        console.log("Connected!");
        
        await session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Hello" }] }], turnComplete: true });
        console.log("Sent hello!");
        
        setTimeout(() => process.exit(0), 5000);
    } catch(e) {
        console.error("SDK Error:", e);
    }
}
run();
