const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.session = await ai\.live\.connect\(\{\n\s*model: "gemini-3\.1-flash-live-preview",\n\s*callbacks: \{/,
    `this.session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede"
              }
            }
          }
        },
        callbacks: {`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed config");
