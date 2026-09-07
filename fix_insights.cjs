const fs = require('fs');
let code = fs.readFileSync('src/lib/geminiInsights.ts', 'utf8');

// 1. Clean up getApiKey
code = code.replace(/const getApiKey = \(\) => \{[\s\S]*?return "";\n\};/, '');

// 2. Fix the model
code = code.replace(/model: "gemini-2\.0-flash"/, 'model: "gemini-2.5-flash"');

fs.writeFileSync('src/lib/geminiInsights.ts', code);
