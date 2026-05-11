const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// remove WalkingBadge component definition
const wbStart = code.indexOf('const WalkingBadge =');
const wbEnd = code.indexOf('export default function App()');
code = code.substring(0, wbStart) + code.substring(wbEnd);

// remove the usage of WalkingBadge
const mapStart = code.indexOf('{userStats?.unlockedItems?.map((id) => {');
const mapEndReg = /return null;\n\s*\}\)\}/g;
const match = [...code.matchAll(mapEndReg)];
if (match.length > 0) {
  const mapEnd = match[0].index + match[0][0].length;
  code = code.substring(0, mapStart) + code.substring(mapEnd);
}

// Next Add BoredMascot below <main> inside the App component return
const mainCloseIdx = code.lastIndexOf('</main>');
if (mainCloseIdx !== -1) {
  const insertContent = `
        <BoredMascot isRunning={isRunning} outfit={userStats?.equippedOutfit} onStartPractice={() => {
           if (context.mode === "Task") setShowPreTask(true);
           else toggleBot();
        }} />
`;
  code = code.substring(0, mainCloseIdx) + insertContent + code.substring(mainCloseIdx);
}

// Remove "import { Mascot } from" if it exists multiple times
fs.writeFileSync('src/App.tsx', code);
