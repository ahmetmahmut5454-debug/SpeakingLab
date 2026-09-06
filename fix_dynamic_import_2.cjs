const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// The require approach might fail in Vite if require is not available in browser.
// So let's import it statically at the top.
if (!code.includes('saveErrorBank')) {
    code = code.replace(
        /import \{ getUnmasteredErrorsForPrompt, addErrorItemsFromReport \} from "\.\/errorBank";/,
        `import { getUnmasteredErrorsForPrompt, addErrorItemsFromReport, getErrorBank, saveErrorBank } from "./errorBank";`
    );
    
    code = code.replace(
        /\{ \/\/ We already statically import it, so we don't need dynamic import\n\s*const \{ getErrorBank, saveErrorBank \} = require\("\.\/errorBank"\);/,
        `{ // We already statically import it`
    );
    fs.writeFileSync('src/lib/eltBot.ts', code);
    console.log("Fixed dynamic import the Vite way.");
}
