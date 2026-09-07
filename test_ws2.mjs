import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
global.fetch = fetch;

const ai = new GoogleGenAI({ apiKey: "proxy_key", httpOptions: { baseUrl: "http://localhost:3000" } });

async function run() {
    try {
        console.log("Connecting...");
        const session = await ai.live.connect({ 
            model: "gemini-2.0-flash",
            config: {
                systemInstruction: "You are a helpful assistant.",
            }
        });
        console.log("Connected!");
        
        session.on("message", (msg) => {
            console.log("Msg:", msg);
        });
        
        await session.send({ clientContent: { turns: [{ role: "user", parts: [{ text: "Hello" }] }], turnComplete: true } });
        console.log("Sent hello!");
        
        setTimeout(() => process.exit(0), 3000);
    } catch(e) {
        console.error("SDK Error:", e);
    }
}
run();
