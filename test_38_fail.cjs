const { GoogleGenAI } = require('@google/genai');

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const session = await ai.live.connect({
      model: "gemini-3.8-flash-live-preview",
      config: {
        responseModalities: ["AUDIO"]
      },
      callbacks: { onmessage: () => {} }
    });
    console.log("Connected successfully to 3.8-flash-live-preview!");
  } catch (e) {
    console.error("Failed 3.8-flash-live-preview:", e.message);
  }
}
run();
