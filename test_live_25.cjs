const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: "AIzaSyDummyKey" });
(async () => {
    try {
        console.log("Connecting...");
        const session = await ai.live.connect({
            model: 'gemini-2.5-flash',
            config: {
                responseModalities: ["AUDIO"]
            },
            callbacks: {
                onopen: () => {
                    console.log("Opened 2.5!");
                    process.exit(0);
                },
                onerror: (e) => {
                    console.log("Error 2.5!", e);
                    process.exit(1);
                }
            }
        });
    } catch (e) {
        console.error("Catch Error:", e);
    }
})();
