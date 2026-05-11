const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// replace Import
code = code.replace(/import \{ BoredMascot \} from "\.\/components\/BoredMascot";/g, 'import { Guide } from "./components/Guide";');

// replace usage
const oldTag = /<BoredMascot\s+isRunning=\{isRunning\}\s+outfit=\{userStats\?\.equippedOutfit\}\s+onStartPractice=\{\(\) => \{[\s\S]*?\}\}\s+\/>/m;

const newTag = `<Guide isRunning={isRunning} onStartPractice={() => {
           if (context.mode === "Task") setShowPreTask(true);
           else toggleBot();
        }} />`;

code = code.replace(oldTag, newTag);

// Also let's delete BoredMascot.tsx
fs.unlinkSync('src/components/BoredMascot.tsx');

fs.writeFileSync('src/App.tsx', code);
