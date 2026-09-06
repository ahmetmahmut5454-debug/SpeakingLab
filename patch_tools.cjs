const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// The tools array is defined inline inside ai.live.connect({ config: { tools: [...] } })
// Let's replace the whole config: { ... tools: [ ... ] } part

const searchStr = `        tools: [
          {
            functionDeclarations: [
              {
                name: "endConversation",
                description:
                  "Call this when the conversation naturally concludes or when the user explicitly requests to end it, say goodbye, or finish the task.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {},
                },
              },
              {
                name: "showCueCard",
                description:
                  "Call this function to show the Part 2 cue card to the student. ONLY call this when you have just introduced Part 2 and are ready to give the student their topic. Provide a short, generic topic string like 'A memorable holiday'. Do not put the whole instructions here.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    topic: {
                      type: Type.STRING,
                      description: "A short phrase describing the topic, e.g., 'A book you enjoyed reading recently'",
                    },
                  },
                  required: ["topic"],
                },
              },
            ],
          },
        ],`;

const replaceStr = `        tools: [
          {
            functionDeclarations: [
              {
                name: "endConversation",
                description:
                  "Call this when the conversation naturally concludes or when the user explicitly requests to end it, say goodbye, or finish the task.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {},
                },
              },
              ...(context.mode === "IELTS" ? [{
                name: "showCueCard",
                description:
                  "Call this function to show the Part 2 cue card to the student. ONLY call this when you have just introduced Part 2 and are ready to give the student their topic. Provide a short, generic topic string like 'A memorable holiday'. Do not put the whole instructions here.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    topic: {
                      type: Type.STRING,
                      description: "A short phrase describing the topic, e.g., 'A book you enjoyed reading recently'",
                    },
                  },
                  required: ["topic"],
                },
              }] : []),
            ],
          },
        ],`;

if (code.includes('name: "showCueCard",')) {
    code = code.replace(searchStr, replaceStr);
    fs.writeFileSync('src/lib/eltBot.ts', code);
    console.log("Patched tools!");
} else {
    console.log("Could not find tools string!");
}
