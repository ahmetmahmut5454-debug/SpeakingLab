const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// The file is corrupted with infinite duplicates of the errorBank parser (due to my bad regex earlier).
// Let's wipe everything after the parser starts and close the block manually.
const matchStart = code.indexOf('if (jsonMatch && Array.isArray(jsonMatch[0].corrections)) {');
if (matchStart !== -1) {
    code = code.substring(0, matchStart);
    
    const closingBlocks = `
             if (jsonMatch && Array.isArray(jsonMatch[0].corrections)) {
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
          } catch(e) {
             console.error("Failed to parse JSON report from Gemini", e);
             return fallbackMsg;
          }
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(\`Failed to generate report with \${modelName}\`, err);
      }
      attempt++;
    }
    
    console.error("All models failed to generate report. Last error:", lastErr);
    return "Error generating report. The AI models might be overloaded.";
  }

  onReportReady(callback: (reportText: string) => void) {
    this.callbacks.onReportReady = callback;
  }
}
`;
    code += closingBlocks;
    fs.writeFileSync('src/lib/eltBot.ts', code);
    console.log("Wiped and restored perfectly.");
}
