const fs = require('fs');
let code = fs.readFileSync('src/lib/audioManager.ts', 'utf8');

code = code.replace(
    /if \(isAudioPlaying && isAudioPlaying\(\)\) {\s*if \(avgLevel < 15\) {\s*return;\s*}\s*}/,
    `// Echo Guard removed for stability.`
);

fs.writeFileSync('src/lib/audioManager.ts', code);
console.log("Removed echo guard from audioManager.ts");
