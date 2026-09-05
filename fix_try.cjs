const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /        \],\n      \},\n    \}\);\n  \}\n\n  sendHintRequest\(\) \{/,
    `        ],
      },
    });
    } catch (e) {
      console.error("Failed to start ELT Bot session:", e);
      if (this.callbacks.onBotFinished) this.callbacks.onBotFinished();
    }
  }

  sendHintRequest() {`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed try block");
