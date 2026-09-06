const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// The file has a million copies of this block.
const signature = "const currentBank = getErrorBank();";
const firstOccurrence = code.indexOf(signature);

if (firstOccurrence !== -1) {
    // We want to keep everything UP TO the first occurrence of `if (jsonMatch && Array.isArray(jsonMatch[0].corrections)) {`
    // Then we append the clean code.
    const cleanStart = code.lastIndexOf('if (jsonMatch && Array.isArray(jsonMatch[0].corrections)) {', firstOccurrence);
    
    if (cleanStart !== -1) {
        let cleanCode = code.substring(0, cleanStart);
        
        const cleanClosing = `
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
        cleanCode += cleanClosing;
        fs.writeFileSync('src/lib/eltBot.ts', cleanCode);
        console.log("Wiped successfully with absolute substring strategy.");
    }
}
