const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Completely remove the prompt logic
const promptRegex = /const localKey = localStorage\.getItem\("gemini_custom_key"\);[\s\S]*?typeof process === "undefined"\s*\)\s*\{[\s\S]*?return;\s*\}/g;
code = code.replace(promptRegex, '');

fs.writeFileSync('src/App.tsx', code);
console.log("Removed prompt popup.");
