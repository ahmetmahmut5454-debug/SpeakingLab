const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Use req.originalUrl to get the full path!
code = code.replace(
    '      const pathWithoutQuery = path.split(\'?\')[0];\n      return `${pathWithoutQuery}?key=${apiKey}`;',
    '      const pathWithoutQuery = req.originalUrl.split(\'?\')[0];\n      return `${pathWithoutQuery}?key=${apiKey}`;'
);

fs.writeFileSync('server.ts', code);
console.log("Fixed server proxy path rewriting!");
