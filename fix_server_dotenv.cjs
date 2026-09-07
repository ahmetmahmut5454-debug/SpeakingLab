const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("dotenv.config();", "// dotenv.config();");

fs.writeFileSync('server.ts', code);
