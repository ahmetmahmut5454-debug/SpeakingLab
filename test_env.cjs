require('dotenv').config();
console.log("Key from env:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
