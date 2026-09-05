const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /if \(parts && parts\.length > 0\) \{/,
    `console.log("Received parts from server: ", parts?.length);
          if (parts && parts.length > 0) {`
);

code = code.replace(
    /if \(part\.inlineData\?\.data\) \{/,
    `console.log("Playing audio chunk...");
              if (part.inlineData?.data) {`
);

code = code.replace(
    /console\.log\("Gemini Live session opened\."\);/,
    `console.log("Gemini Live session opened.");
            alert("Gemini Live session opened successfully!");`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Added debug logs");
