import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
global.fetch = fetch;

const ai = new GoogleGenAI({ apiKey: "proxy_key", httpOptions: { baseUrl: "http://localhost:3000" } });

async function run() {
    try {
        console.log("Connecting...");
        // Use v1alpha for live API just in case? Or use the interactions API directly?
        const session = await ai.live.connect({ 
            model: "gemini-2.0-flash",
            onsetupcomplete: () => console.log("Setup Complete!"),
            onmessage: (msg) => console.log("Msg!", msg),
            onerror: (e) => console.log("Err!", e),
            onclose: () => console.log("Closed")
        });
        console.log("Connected!");
        
        await session.send({ parts: [{ text: "Hello" }] });
        console.log("Sent hello!");
        
        setTimeout(() => process.exit(0), 3000);
    } catch(e) {
        console.error("SDK Error:", e);
    }
}
run();
