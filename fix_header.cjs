const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

if (!code.includes('<Settings className="w-4 h-4" />')) {
    code = code.replace(
        '<button\n            onClick={() => setShowSubtitles(!showSubtitles)}',
        `<button
            onClick={() => {
              const currentKey = localStorage.getItem("gemini_custom_key") || "";
              const key = prompt("Enter your Gemini API Key (or leave blank to use environment default):", currentKey);
              if (key !== null) {
                 if (key.trim() === "") {
                    localStorage.removeItem("gemini_custom_key");
                 } else {
                    localStorage.setItem("gemini_custom_key", key.trim());
                 }
                 window.location.reload();
              }
            }}
            className="px-4 py-2 rounded-xl flex items-center gap-2 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
          >
            <Settings className="w-4 h-4" /> API
          </button>
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}`
    );
    
    if (!code.includes('import { Settings')) {
        code = code.replace(/import \{([\s\S]*?)X,([\s\S]*?)\} from "lucide-react";/, 'import {$1X, Settings,$2} from "lucide-react";');
    }
    
    fs.writeFileSync('src/components/Header.tsx', code);
}
