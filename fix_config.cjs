const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

const oldConfig = `        config: {
          responseModalities: ["AUDIO"] as any,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            speechConfig: context.voice || (context.level === "C1" ? "Charon" : "Puck")
          },`;

const newConfig = `        config: {
          responseModalities: ["AUDIO"] as any,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          speechConfig: context.voice || (context.level === "C1" ? "Charon" : "Puck"),`;

code = code.replace(oldConfig, newConfig);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed config.");
