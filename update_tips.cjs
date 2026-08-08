const fs = require('fs');

let content = fs.readFileSync('src/components/SpeakingTips.tsx', 'utf8');

// For mobile, top-6 is overlapping with header. Let's move it below header, or maybe bottom?
// In the button: className="fixed top-6 left-6 ...
// In the popup: className="fixed top-20 left-6 z-50 w-[320px] ...

content = content.replace(
  'fixed top-6 left-6 z-40',
  'fixed top-24 left-4 sm:top-24 sm:left-6 z-40' // move it below the 20 (80px) header
);

content = content.replace(
  'fixed top-20 left-6 z-50 w-[320px]',
  'fixed top-36 left-4 sm:top-36 sm:left-6 z-50 w-[calc(100vw-32px)] sm:w-[320px]'
);

fs.writeFileSync('src/components/SpeakingTips.tsx', content);
