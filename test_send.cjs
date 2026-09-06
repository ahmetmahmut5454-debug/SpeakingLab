const { GoogleGenAI } = require('@google/genai');

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const session = await ai.live.connect({
      model: "gemini-2.0-flash-exp",
      config: {
        responseModalities: ["AUDIO"]
      },
      callbacks: { 
        onmessage: (msg) => console.log("MSG:", JSON.stringify(msg).substring(0, 200)),
        onclose: (e) => console.log("CLOSED:", e),
        onerror: (e) => console.log("ERROR:", e)
      }
    });
    console.log("Connected. Sending content...");
    session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Hello!" }] }], turnComplete: true });
    
    setTimeout(() => {
        session.close();
    }, 3000);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
run();
