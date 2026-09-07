const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: "" });
(async () => {
    try {
        console.log("Connecting...");
        const session = await ai.live.connect({
            model: 'gemini-2.0-flash',
            callbacks: {
                onopen: () => console.log("Opened!"),
                onclose: () => console.log("Closed!"),
                onerror: () => console.log("Error!")
            }
        });
    } catch (e) {
        console.error("Catch Error:", e);
    }
})();
