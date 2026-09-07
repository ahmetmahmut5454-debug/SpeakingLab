const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace('import express from "express";', 'import express from "express";\nimport "dotenv/config";');
fs.writeFileSync('server.ts', code);
