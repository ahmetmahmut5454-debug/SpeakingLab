const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace dark background with light background
code = code.replace(/bg-\[#050505\]/g, 'bg-[#e5f6fd]');
code = code.replace(/text-zinc-100/g, 'text-slate-800');
code = code.replace(/text-white\/([0-9]+)/g, 'text-slate-600/$1');
code = code.replace(/bg-white\/([0-9]+)/g, 'bg-slate-900/$1');
code = code.replace(/border-white\/([0-9]+)/g, 'border-slate-900/$1');
// fix text-white
code = code.replace(/text-white/g, 'text-slate-900');
code = code.replace(/bg-\[#151619\]/g, 'bg-white');
code = code.replace(/bg-\[#111113\]/g, 'bg-white');
code = code.replace(/bg-\[#0a0a0b\]/g, 'bg-[#f7fdfc]');
code = code.replace(/bg-\[#0f1013\]/g, 'bg-white');
code = code.replace(/bg-\[#0f0f12\]/g, 'bg-white');
code = code.replace(/bg-\[#15161A\]/g, 'bg-slate-50');

// fix the walking badge jump (y: -20 to y: -5 to make it less floating)
code = code.replace(/y: isClicked \? -20 : 0/g, 'y: isClicked ? -10 : 0');

fs.writeFileSync('src/App.tsx', code);
