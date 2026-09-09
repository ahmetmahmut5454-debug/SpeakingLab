const fs = require('fs');

function fixFile(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');

    if (filePath.includes('eltBot.ts')) {
        code = code.replace(
            /export const getApiKey = \(\) => import\.meta\.env\.VITE_GEMINI_API_KEY \|\| "proxy_key";/,
            `export const getApiKey = () => {
    try {
        const local = localStorage.getItem("gemini_custom_key");
        if (local) return local;
    } catch(e) {}
    return import.meta.env.VITE_GEMINI_API_KEY || "proxy_key";
};`
        );
        
        // Also fix the error event reporting
        code = code.replace(
            /onerror:\s*\(error:\s*any\)\s*=>\s*\{[\s\S]*?this\.handleUnexpectedDisconnect\(\);\s*\},/,
            `onerror: (error: any) => { 
                console.error("Live session error:", error); 
                this.isConnected = false; 
                let msg = "Connection Error.";
                if (error instanceof Event) {
                    msg = "WebSocket Error. Check your API Key or Network.";
                } else if (error && error.message) {
                    msg = error.message;
                }
                const key = getApiKey();
                msg += " (Key starts with: " + (key ? key.substring(0, 5) : "none") + ")";
                
                if (this.callbacks.onError) this.callbacks.onError(msg); 
                this.handleUnexpectedDisconnect(); 
            },`
        );
    }
    fs.writeFileSync(filePath, code);
}

fixFile('src/lib/eltBot.ts');
