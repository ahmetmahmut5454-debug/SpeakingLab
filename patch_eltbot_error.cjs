const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /onerror: \(error\) => \{/,
    `onerror: (error) => {
          console.error("Live session error:", error);
          if (error && error.message) {
            alert("Connection error: " + error.message);
          } else {
            alert("Connection error occurred. AI might not be available right now.");
          }`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched eltBot.ts error alert");
