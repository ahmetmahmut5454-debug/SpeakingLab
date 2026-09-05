const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /      if \(!this\.audioProcessor\) \{\n        this\.audioProcessor = new AudioProcessor\(\n          stream,\n          \(\) => this\.audioPlayer\.isPlaying\n        \);\n      \}\n\n      await this\.audioProcessor\.initialize\(\);/,
    `      if (!this.audioProcessor) {
        this.audioProcessor = new AudioProcessor();
      }`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed audio processor init");
