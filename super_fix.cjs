const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// 1. Change model
code = code.replace(
    'model: "gemini-2.0-flash-exp"',
    'model: "gemini-2.0-flash"'
);

// 2. Fix config schema
const oldConfig = `        config: {
          responseModalities: ["AUDIO"] as any,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          speechConfig: context.voice || (context.level === "C1" ? "Charon" : "Puck"),`;

const newConfig = `        config: {
          responseModalities: ["AUDIO"] as any,
          systemInstruction: systemInstruction,
          speechConfig: context.voice || (context.level === "C1" ? "Charon" : "Puck"),`;

code = code.replace(oldConfig, newConfig);

// 3. Fix realtime input payload
const oldInput = `                    this.session.sendRealtimeInput({
                      audio: {
                        data,
                        mimeType: "audio/pcm;rate=16000",
                      }
                    });`;

const newInput = `                    this.session.sendRealtimeInput({
                      media: [{
                        data,
                        mimeType: "audio/pcm;rate=16000",
                      }]
                    });`;
code = code.replace(oldInput, newInput);

// 4. Fix client content
const oldClientContent1 = `                    this.session.sendClientContent({
                      turns: [{ role: "user", parts: [{ text: triggerMessage }] }],
                      turnComplete: true,
                    });`;
const newClientContent1 = `                    this.session.sendClientContent({
                      turns: triggerMessage,
                      turnComplete: true,
                    });`;
code = code.replace(oldClientContent1, newClientContent1);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Applied super fix: model, schema, media array, client content string");
