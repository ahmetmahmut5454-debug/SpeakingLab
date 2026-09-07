const fs = require('fs');

function updateFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/gemini-[0-9]+\.[0-9]+-flash/g, 'gemini-3.8-flash');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
}

updateFile('src/lib/geminiInsights.ts');
updateFile('src/lib/translationService.ts');
updateFile('src/lib/eltBot.ts');
