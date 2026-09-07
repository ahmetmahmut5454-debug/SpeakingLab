const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "      topic: context.topic,",
  "      topic: context.topic || \"\","
);
code = code.replace(
  "      scenarioId: context.scenarioId,",
  "      scenarioId: context.scenarioId || \"\","
);

fs.writeFileSync('src/App.tsx', code);
