const { GoogleGenAI } = require('@google/genai');

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: ["AUDIO"]
      }
    });
    console.log("Connected successfully!");
    session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Hello" }] }] });
    console.log("Sent hello!");
  } catch (e) {
    console.error("Failed:", e);
  }
}
run();
