const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
    try {
        console.log("Connecting to 3.8...");
        const session = await ai.live.connect({
            model: 'gemini-3.8-flash',
            config: {
                responseModalities: ["AUDIO"]
            },
            callbacks: {
                onopen: () => {
                    console.log("Opened 3.8!");
                    process.exit(0);
                },
                onerror: (e) => {
                    console.log("Error 3.8!", e.message);
                    process.exit(1);
                },
                onclose: (e) => {
                    console.log("Closed 3.8!");
                    process.exit(1);
                }
            }
        });
    } catch (e) {
        console.error("Catch Error:", e);
    }
})();
