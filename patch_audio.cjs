const fs = require('fs');
let code = fs.readFileSync('src/lib/audioManager.ts', 'utf8');

code = code.replace(
    /let avgLevel = 0;\s*if \(this\.analyser && this\.dataArray\) {[\s\S]*?if \(onLevel\) onLevel\(avgLevel\);\s*}\s*\/\/ Echo \/ Self-Interruption Guard removed: We rely on echoCancellation: true from getUserMedia\./,
    `let avgLevel = 0;
      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray as any);
        const sum = this.dataArray.reduce((a, b) => a + b, 0);
        avgLevel = sum / this.dataArray.length;
        if (onLevel) onLevel(avgLevel);
      }

      // Echo / Self-Interruption Guard:
      // If the bot is speaking, we drop low-volume packets to prevent the microphone from picking up the speakers and causing self-interruption.
      if (isAudioPlaying && isAudioPlaying()) {
        if (avgLevel < 15) {
          return;
        }
      }`
);

fs.writeFileSync('src/lib/audioManager.ts', code);
console.log("Patched audioManager.ts");
