const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /    \} catch \(e\) \{\n      console\.error\("Failed to start ELT Bot session:", e\);\n      if \(this\.callbacks\.onBotFinished\) this\.callbacks\.onBotFinished\(\);\n    \}/,
    `    } catch (e: any) {
      console.error("Failed to start ELT Bot session:", e);
      alert("Hata detayı: " + (e.message || e.toString()));
      if (this.callbacks.onBotFinished) this.callbacks.onBotFinished();
    }`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched catch block");
