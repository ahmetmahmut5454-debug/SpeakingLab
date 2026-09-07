import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
global.fetch = fetch;

const ai = new GoogleGenAI({ apiKey: "proxy_key", httpOptions: { baseUrl: "http://localhost:3000" } });

async function run() {
    try {
        console.log("Connecting...");
        const session = await ai.live.connect({ 
            model: "gemini-2.0-flash"
        });
        console.log("Connected!");
        
        console.log("Session object methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(session)));
        console.log("Session object keys:", Object.keys(session));
        
        process.exit(0);
    } catch(e) {
        console.error("SDK Error:", e);
    }
}
run();
