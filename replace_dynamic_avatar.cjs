const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace DynamicAvatar component with import
const re = /const DynamicAvatar = \(\{[\s\S]*?\}\) => \{[\s\S]*?\};/m;
code = code.replace(re, 'import { Mascot } from "./components/Mascot";\nimport { BoredMascot } from "./components/BoredMascot";');

// Replace usages
code = code.replace(/<DynamicAvatar\n/g, '<Mascot\n');
code = code.replace(/<DynamicAvatar/g, '<Mascot');

// Ensure Mascot has an ID or proper prop for expression
// Currently Mascot takes outfit... the places where we called DynamicAvatar took outfit={userStats?.equippedOutfit}

fs.writeFileSync('src/App.tsx', code);
