const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<SpeakingTips />',
  '<SpeakingTips mode={context.mode} level={context.level} />'
);

fs.writeFileSync('src/App.tsx', content);
