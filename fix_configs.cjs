const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Remove first config
code = code.replace(
    /        config: \{\n          systemInstruction: \{ parts: \[\{ text: systemInstruction \}\] \},\n          responseModalities: \["AUDIO"\],\n          speechConfig: \{\n            voiceConfig: \{\n              prebuiltVoiceConfig: \{\n                voiceName: context\.voice \|\| "Puck" \/\/ Using 'Puck' for a very natural, conversational tone\n              \}\n            \}\n          \}\n        \},\n        callbacks: \{/,
    `        callbacks: {`
);

// Update voice in the remaining config
code = code.replace(
    /              voiceName:\n                context\.voice \|\|\n                \(context\.level === "C1" \? "Charon" : "Zephyr"\),/,
    `              voiceName: context.voice || "Puck",`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed configs");
