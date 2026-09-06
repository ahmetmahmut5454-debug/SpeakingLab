const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Replace dynamic import with static one, since we already statically import it at the top
code = code.replace(
    /import\("\.\/errorBank"\)\.then\(\(\{ getErrorBank, saveErrorBank \}\) => \{/,
    `{ // We already statically import it, so we don't need dynamic import
                 const { getErrorBank, saveErrorBank } = require("./errorBank");`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed dynamic import.");
