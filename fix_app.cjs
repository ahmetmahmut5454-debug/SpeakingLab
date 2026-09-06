const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove Target Language selector from main screen
const targetLangBlock = `              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-xs uppercase tracking-wider font-bold text-slate-700 mb-1 text-center">
                  Target Language
                </label>
                <select
                  value={context.targetLanguageCode || "en-US"}
                  onChange={(e) => {
                    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                    if (lang) {
                      setContext({
                        ...context,
                        targetLanguage: lang.name,
                        targetLanguageCode: lang.code,
                      });
                    }
                  }}
                  className="bg-blue-900 border border-blue-700 text-white font-bold rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg cursor-pointer hover:bg-blue-800 transition-colors h-[42px] mt-[2px]"
                  disabled={isRunning}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-white text-slate-900 font-medium">
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>`;

if (code.includes('Target Language')) {
    code = code.replace(targetLangBlock, '');
    fs.writeFileSync('src/App.tsx', code);
    console.log("Removed Target Language dropdown.");
} else {
    console.log("Could not find Target Language block.");
}
