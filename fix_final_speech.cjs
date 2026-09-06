const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

const oldConfig = `        config: {
          responseModalities: ["AUDIO"] as any,
          speechConfig: context.voice || (context.level === "C1" ? "Charon" : "Puck"),
          systemInstruction: { parts: [{ text: systemInstruction }] },`;

const newConfig = `        config: {
          responseModalities: ["AUDIO"] as any,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: context.voice || (context.level === "C1" ? "Charon" : "Puck"),
              }
            }
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },`;

code = code.replace(oldConfig, newConfig);

// Also let's fix handleUnexpectedDisconnect to actually reset the UI so the user isn't stuck if a crash happens
const oldDisconnect = `  handleUnexpectedDisconnect() {
    console.log("Unexpected disconnect.");
  }`;
  
const newDisconnect = `  handleUnexpectedDisconnect() {
    console.log("Unexpected disconnect.");
    if (this.callbacks.onBotFinished) {
      this.callbacks.onBotFinished();
    }
  }`;
code = code.replace(oldDisconnect, newDisconnect);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed speech config & disconnect handler");
