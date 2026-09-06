const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

const oldTools = `          tools: [
            {
              functionDeclarations: [
                {
                  name: "endConversation",
                  description: "Call this when the conversation naturally concludes.",
                  parameters: { type: 6, properties: {} },
                },
                {
                  name: "showCueCard",
                  description: "Call this function to show the Part 2 cue card to the student.",
                  parameters: { type: 6, properties: { topic: { type: 1, description: "A short phrase" } }, required: ["topic"] },
                },
              ],
            },
          ],`;

const newTools = `          tools: [
            {
              functionDeclarations: [
                {
                  name: "endConversation",
                  description: "Call this when the conversation naturally concludes.",
                  parameters: { type: 6, properties: {} },
                },
                ...(context.mode === "IELTS" || context.topic?.includes("IELTS") ? [{
                  name: "showCueCard",
                  description: "Call this function to show the Part 2 cue card to the student. ONLY call this when you have just introduced Part 2 and are ready to give the student their topic. Provide a short, generic topic string like 'A memorable holiday'.",
                  parameters: { type: 6, properties: { topic: { type: 1, description: "A short phrase describing the topic" } }, required: ["topic"] },
                }] : [])
              ],
            },
          ],`;

code = code.replace(oldTools, newTools);
fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed tools!");
