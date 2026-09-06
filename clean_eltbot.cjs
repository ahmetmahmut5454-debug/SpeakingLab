const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// I corrupted the file multiple times. Let's just strip everything from line 730 onwards 
// and replace it with a clean version of the report parsing block.

const startIdx = code.indexOf('if (jsonMatch && Array.isArray(jsonMatch[0].corrections)) {');
if (startIdx > -1) {
    const endIdx = code.indexOf('} catch(e) {', startIdx);
    
    const newBlock = `if (jsonMatch && Array.isArray(jsonMatch[0].corrections)) {
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
             }
             
             return markdownRep;
          `;
          
    code = code.substring(0, startIdx) + newBlock + code.substring(endIdx);
    fs.writeFileSync('src/lib/eltBot.ts', code);
    console.log("Cleaned eltbot completely.");
}

