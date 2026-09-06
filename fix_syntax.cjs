const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// The line we broke:
// { // We already statically import it
//                 const { getErrorBank, saveErrorBank } = require("./errorBank");
// It was replacing a Promise .then()

code = code.replace(
    /\{ \/\/ We already statically import it/,
    `{`
);

code = code.replace(
    /if \(addedCount > 0\) \{\n\s*saveErrorBank\(currentBank\.slice\(0, 50\)\);\n\s*\}\n\s*\}\);\n\s*\}/,
    `if (addedCount > 0) {
                         saveErrorBank(currentBank.slice(0, 50));
                     }
                 }`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed syntax.");
