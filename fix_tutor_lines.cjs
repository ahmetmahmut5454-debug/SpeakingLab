const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /if \(outTrans\.finished\) \{\s*this\.transcriptHistory\.push\(`\[Tutor\]: \$\{this\.currentBotSubtitle\}`\);\s*this\.currentBotSubtitle = "";\s*\}/,
    `if (outTrans.finished) {
        // We will handle turnComplete separately instead of relying on outTrans.finished
      }`
);

code = code.replace(
    /const outTrans = message\.serverContent\?\.outputTranscription/,
    `if (message.serverContent?.turnComplete) {
              if (this.currentBotSubtitle.trim().length > 0) {
                this.transcriptHistory.push(\`[Tutor]: \${this.currentBotSubtitle.trim()}\`);
                this.currentBotSubtitle = "";
              }
            }
            const outTrans = message.serverContent?.outputTranscription`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed tutor lines appending.");
