const fs = require('fs');
let content = fs.readFileSync('src/lib/scenarios.ts', 'utf8');

content = content.replace(/Then tell the user they have 1 minute to prepare and 1-2 minutes to speak\. Wait for the user's full response\./g, 
  "IMPORTANT: Immediately after calling the tool, YOU MUST verbally tell the user they have 1 minute to prepare and 1-2 minutes to speak. Do NOT stay silent after the tool call. Then wait for their full response. If they stop too early, prompt them to continue.");

fs.writeFileSync('src/lib/scenarios.ts', content);
