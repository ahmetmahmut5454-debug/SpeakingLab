const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// The report generation fallback models are completely wrong (using 3.5-flash and other non-existents)
const modelsBlock = `    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-3.1-pro-preview"
    ];`;

const newModelsBlock = `    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];`;

if (code.includes('gemini-3.5-flash')) {
    code = code.replace(modelsBlock, newModelsBlock);
    // Also fix the fallback string in the while loop
    code = code.replace(/const modelName = modelsToTry\[attempt\] \|\| "gemini-3\.5-flash";/g, 'const modelName = modelsToTry[attempt] || "gemini-2.5-flash";');
    fs.writeFileSync('src/lib/eltBot.ts', code);
    console.log("Fixed report generation fallback models.");
} else {
    console.log("Could not find models block.");
}
