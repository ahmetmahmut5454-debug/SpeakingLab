const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// I am just going to delete the entire file and reconstruct the class from git so I don't have to deal with this corrupt file.
