import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash",
            contents: "Hello",
        });
        console.log("REST works!", response.text);
    } catch(e) {
        console.error("REST failed:", e.message);
    }
}
run();
