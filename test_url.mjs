import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";
global.fetch = fetch;

const ai = new GoogleGenAI({ apiKey: "proxy_key", httpOptions: { baseUrl: "http://localhost:3000" } });

console.log("Connecting...");
try {
    const session = await ai.live.connect({ model: "gemini-2.0-flash" });
} catch(e) {
    console.error(e);
}
