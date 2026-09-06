const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// I accidentally chopped off the fields!
const brokenBlock = `                                 id: \`err_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`,
                                 original,
                                 correction,
                             addedCount++;`;

const fixedBlock = `                                 id: \`err_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`,
                                 original,
                                 correction,
                                 category: 'Grammar',
                                 timestamp: Date.now(),
                                 reviewCount: 0,
                                 mastered: false,
                             });
                             addedCount++;`;

if (code.includes(brokenBlock)) {
    code = code.replace(brokenBlock, fixedBlock);
    fs.writeFileSync('src/lib/eltBot.ts', code);
    console.log("Fixed the missing fields!");
} else {
    console.log("Broken block not found. Let's try flexible replace.");
    code = code.replace(/original,\s*correction,\s*addedCount\+\+;/g, fixedBlock.replace('                                 id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,', ''));
    fs.writeFileSync('src/lib/eltBot.ts', code);
}
