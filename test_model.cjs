const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
    try {
        const response = await ai.models.get({model: 'gemini-3.8-flash'});
        console.log("Model exists:", response.name);
    } catch (e) {
        console.log("Error:", e.message);
    }
})();
