require("dotenv").config();
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
console.log("Length:", (process.env.GEMINI_API_KEY || "").length);
