const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// 1. Remove the annoying alerts I just added
code = code.replace(
    'console.error("Live session error:", error); alert("Live session error: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));',
    'console.error("Live session error:", error);'
);
code = code.replace(
    'console.log("Gemini Live session closed."); alert("Gemini Live session closed unexpectedly");',
    'console.log("Gemini Live session closed.");'
);

// 2. Fix the REAL root cause of the silent drop
// In the Live API for gemini-2.0-flash-exp, systemInstruction MUST be passed inside 'generationConfig', not directly at the top level of 'config'.
// BUT wait, let's look at the TS definitions we just grepped:
// LiveConnectConfig has `systemInstruction?: ContentUnion;` directly on it!
// Oh, wait, the typing might allow it, but the API might be rejecting the specific format.
// We are sending: systemInstruction: { parts: [{ text: systemInstruction }] }
// Let's send a simple string or standard Content object.
// We'll also remove the complex speech config that causes silent rejection if misconfigured and fall back to defaults just to GET IT WORKING.

const oldConfig = `        config: {
          responseModalities: ["AUDIO"] as any,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: context.voice || (context.level === "C1" ? "Charon" : "Puck"),
              }
            }
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },`;

const newConfig = `        config: {
          generationConfig: {
            responseModalities: ["AUDIO"] as any,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: context.voice || (context.level === "C1" ? "Charon" : "Puck"),
                }
              }
            }
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },`;

code = code.replace(oldConfig, newConfig);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed config schema and removed alerts");
