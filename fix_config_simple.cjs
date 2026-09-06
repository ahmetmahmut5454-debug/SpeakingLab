const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

const oldConfig = `        config: {
          responseModalities: ["AUDIO"] as any,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName:
                  context.voice ||
                  (context.level === "C1" ? "Charon" : "Puck"),
              },
            },
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },`;

const newConfig = `        config: {
          speechConfig: context.voice || (context.level === "C1" ? "Charon" : "Puck"),
          systemInstruction: { parts: [{ text: systemInstruction }] },`;

code = code.replace(oldConfig, newConfig);
fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Simplified config structure!");
