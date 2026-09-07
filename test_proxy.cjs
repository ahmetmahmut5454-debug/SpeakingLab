const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: "proxy_key", httpOptions: { baseUrl: 'ws://localhost:3000' } });
(async () => {
    try {
        console.log("Connecting to proxy...");
        const session = await ai.live.connect({
            model: 'gemini-2.5-flash',
            config: {
                responseModalities: ["AUDIO"]
            },
            callbacks: {
                onopen: () => {
                    console.log("Proxy Opened 2.5!");
                    process.exit(0);
                },
                onerror: (e) => {
                    console.log("Proxy Error!", e.message);
                    process.exit(1);
                }
            }
        });
    } catch (e) {
        console.error("Catch Error:", e);
    }
})();
