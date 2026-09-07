require("dotenv").config();
console.log("Key:", process.env.VITE_GEMINI_API_KEY ? "EXISTS" : "MISSING");
console.log("Length:", (process.env.VITE_GEMINI_API_KEY || "").length);
