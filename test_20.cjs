const { GoogleGenAI } = require('@google/genai');

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const session = await ai.live.connect({
      model: "gemini-2.0-flash-exp",
      config: {
        responseModalities: ["AUDIO"]
      },
      callbacks: { onmessage: () => {} }
    });
    console.log("Connected successfully to 2.0-flash-exp!");
  } catch (e) {
    console.error("Failed 2.0-flash-exp:", e.message);
  }
}
run();
