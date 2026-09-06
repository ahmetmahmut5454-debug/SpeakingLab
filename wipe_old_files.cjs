const fs = require('fs');

try { fs.unlinkSync('fix_eltBot.cjs'); } catch(e){}
try { fs.unlinkSync('fix_eltBot_init.cjs'); } catch(e){}
try { fs.unlinkSync('fix_eltBot_logs.cjs'); } catch(e){}
try { fs.unlinkSync('patch_eltBot_clean.cjs'); } catch(e){}

console.log("Cleaned up old files");
