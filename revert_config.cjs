const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

const newConfig = `        config: {
          generationConfig: {
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
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },`;

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

code = code.replace(newConfig, oldConfig);
fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Reverted config structure!");
