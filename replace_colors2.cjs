const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The main layout styling
code = code.replace(/bg-\[#0d0d0f\]/g, 'bg-[#f0fdf4]'); // Light green-ish or blue-ish background (Duolingo style)
code = code.replace(/text-\[#c9c9c9\]/g, 'text-slate-800');
code = code.replace(/font-mono/g, 'font-sans'); // Duolingo style is sans-serif, not mono
code = code.replace(/selection:bg-green-500\/20/g, 'selection:bg-green-500/30');

// Replace standard dark boxes with white boxes and shadows
code = code.replace(/bg-black\/40/g, 'bg-white/80 border border-slate-200'); // Subtitles
code = code.replace(/text-blue-100/g, 'text-blue-600');
code = code.replace(/text-emerald-100/g, 'text-emerald-600');

// Fix walking badge y jump
code = code.replace(/y: isClicked \? -20 : 0/g, 'y: isClicked ? -10 : 0');

fs.writeFileSync('src/App.tsx', code);
