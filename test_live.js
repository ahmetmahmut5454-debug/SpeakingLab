import { GoogleGenAI } from '@google/genai';

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
  try {
    const session = await ai.live.connect({
      model: "gemini-2.0-flash",
      config: {
        responseModalities: ["AUDIO"],
        systemInstruction: "You are an English tutor",
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Puck"
            }
          }
        },
      }
    });
    console.log("Connected successfully!");
    session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Hello?" }] }], turnComplete: true });
    
    // Listen for messages
    const originalSend = session.ws.send.bind(session.ws);
    
    let received = false;
    for await (const msg of session.receive()) {
      console.log("Received:", JSON.stringify(msg));
      received = true;
      break;
    }
  } catch (err) {
    console.error("FAILED TO CONNECT OR COMMUNICATE:", err);
  }
}
run();
