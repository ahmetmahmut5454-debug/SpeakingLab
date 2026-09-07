const fs = require('fs');

function replaceModel(file) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/gemini-3\.8-flash/g, 'gemini-2.0-flash');
    fs.writeFileSync(file, code);
}

replaceModel('src/lib/eltBot.ts');
replaceModel('src/lib/geminiInsights.ts');
replaceModel('src/lib/translationService.ts');
