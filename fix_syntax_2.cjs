const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// There is still a syntax error around the promise block. I'll just restore the promise-based import which is safer,
// or I'll just use the static imports properly.

const regex = /\{ \n                 const \{ getErrorBank, saveErrorBank \} = require\("\.\/errorBank"\);\n                 const currentBank = getErrorBank\(\);\n                 let addedCount = 0;\n                 jsonMatch\[0\]\.corrections\.forEach\(\(c: any\) => \{\n                     if \(!c\.original || !c\.correction\) return;\n                     const original = String\(c\.original\)\.toLowerCase\(\)\.trim\(\);\n                     const correction = String\(c\.correction\)\.trim\(\);\n                     if \(original\.length > 0 && correction\.length > 0\) \{\n                         const exists = currentBank\.some\(item => item\.original === original\);\n                         if \(!exists\) \{\n                             currentBank\.unshift\(\{\n                                 id: \`err_\$\{Date\.now\(\)\}_\$\{Math\.random\(\)\.toString\(36\)\.substr\(2, 5\)\}\`,\n                                 original,\n                                 correction,\n                                 category: 'Grammar',\n                                 timestamp: Date\.now\(\),\n                                 reviewCount: 0,\n                                 mastered: false,\n                             \}\);\n                             addedCount\+\+;\n                         \}\n                     \}\n                 \}\);\n                 if \(addedCount > 0\) \{\n                     saveErrorBank\(currentBank\.slice\(0, 50\)\);\n                 \}\n             \}/g;
                 
const replacement = `{
                 const currentBank = getErrorBank();
                 let addedCount = 0;
                 jsonMatch[0].corrections.forEach((c: any) => {
                     if (!c.original || !c.correction) return;
                     const original = String(c.original).toLowerCase().trim();
                     const correction = String(c.correction).trim();
                     if (original.length > 0 && correction.length > 0) {
                         const exists = currentBank.some(item => item.original === original);
                         if (!exists) {
                             currentBank.unshift({
                                 id: \`err_\${Date.now()}_\${Math.random().toString(36).substr(2, 5)}\`,
                                 original,
                                 correction,
                                 category: 'Grammar',
                                 timestamp: Date.now(),
                                 reviewCount: 0,
                                 mastered: false,
                             });
                             addedCount++;
                         }
                     }
                 });
                 if (addedCount > 0) {
                     saveErrorBank(currentBank.slice(0, 50));
                 }
             }`;
             
code = code.replace(regex, replacement);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed syntax 2.");
