const { GoogleGenAI } = require('@google/genai');

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: ["AUDIO"],
        systemInstruction: { parts: [{ text: "You are a helpful assistant." }] },
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Puck"
            }
          }
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: "endConversation",
                description: "Call this when finished.",
                parameters: { type: "OBJECT", properties: {} }
              }
            ]
          }
        ]
      },
      callbacks: { 
        onmessage: (msg) => console.log("MSG:", JSON.stringify(msg).substring(0, 200)),
        onclose: (e) => console.log("CLOSED:", e),
        onerror: (e) => console.log("ERROR:", e)
      }
    });
    console.log("Connected to 3.1 FULL. Sending content...");
    session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Hello!" }] }], turnComplete: true });
    
    setTimeout(() => {
        session.close();
    }, 3000);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
run();
