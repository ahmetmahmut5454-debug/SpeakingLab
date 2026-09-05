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
    session.sendRealtimeInput({
      audio: {
        data: Buffer.alloc(16000 * 2).toString('base64'),
        mimeType: "audio/pcm;rate=16000"
      }
    });
    console.log("Sent audio chunk!");
    setTimeout(() => {
        session.close();
    }, 2000);
  } catch (e) {
    console.error("Failed:", e);
  }
}
run();
