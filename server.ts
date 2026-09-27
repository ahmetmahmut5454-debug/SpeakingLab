import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { GoogleGenAI } from "@google/genai";

// Load .env first, then .env.local to override
dotenv.config();
if (fs.existsSync(".env.local")) {
    const envConfig = dotenv.parse(fs.readFileSync(".env.local"));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  // Server-side report generation endpoint
  app.post("/api/generate-report", express.json(), async (req, res) => {
    try {
      const { context, transcript } = req.body;
      if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
        return res.status(400).json({ error: "Transcript is required" });
      }

      if (!apiKey || apiKey === "proxy_key") {
        return res.status(500).json({ error: "No API key configured on server" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const isIelts = context?.mode === "IELTS" || !!(context?.topic && context?.topic.includes("IELTS"));
      const prompt = `
        You are an expert English Language Examiner and Senior Tutor.
        Analyze the following transcript of an English speaking practice session between a Student and a Tutor.
        
        Target Level: CEFR ${context?.level || "B2"}
        Mode: ${context?.mode || "Practice"}
        Topic / Objective: ${context?.topic || context?.objective || "Conversational English"}
        
        Transcript:
        ${transcript}
        
        Generate a comprehensive, accurate, and constructive feedback report in Markdown format.
        Structure the report clearly with:
        
        ### 1. Overall Performance & Level Assessment
        - Estimated CEFR Level & ${isIelts ? "IELTS Band Score (e.g. Band 6.5)" : "Overall Band Score"}
        - High-level summary of the student's communicative ability, confidence, and coherence
        
        ### 2. Core Criteria Breakdown
        - **Fluency & Coherence**: Speech rhythm, hesitation, ability to develop ideas, linking phrases
        - **Lexical Resource (Vocabulary)**: Range, precision, idiom and collocation use
        - **Grammatical Range & Accuracy**: Sentence structure variety, verb tenses, common errors
        - **Pronunciation & Clarity**: Clarity of speech, natural rhythm, articulation
        
        ### 3. Key Strengths
        - Highlight 2-3 genuine strengths demonstrated by the student
        
        ### 4. High-Priority Actionable Advice
        - 2-3 concrete, actionable recommendations for the student's next practice session
        
        AT THE VERY END OF YOUR REPORT, include a strict JSON block wrapped in \`\`\`json containing all specific grammar and vocabulary corrections for errors found in the student's speech:
        \`\`\`json
        {
          "corrections": [
            {"original": "incorrect student phrase", "correction": "natural correct alternative"}
          ]
        }
        \`\`\`
        If there are no major corrections, return an empty array for corrections: {"corrections": []}.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt
      });

      return res.json({ report: response.text || "No feedback generated." });
    } catch (err: any) {
      console.error("Error generating report in /api/generate-report:", err);
      return res.status(500).json({ error: err.message || "Failed to generate report" });
    }
  });

  // Set up the websocket and REST proxy
  const apiProxy = createProxyMiddleware({
      target: "https://generativelanguage.googleapis.com",
      changeOrigin: true,
      ws: true,
      pathRewrite: (path, req) => {
          const original = (req as any)?.originalUrl || path;
          let newPath = original.replace(/^\/+/, "/");
          newPath = newPath.replace(/([?&])key=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
          if (apiKey && apiKey !== "proxy_key") {
            return newPath + (newPath.includes('?') ? '&' : '?') + 'key=' + apiKey;
          }
          return newPath;
      },
      on: {
        proxyReq: (proxyReq: any) => {
           proxyReq.setHeader('Host', 'generativelanguage.googleapis.com');
           if (apiKey && apiKey !== "proxy_key") {
             proxyReq.setHeader('x-goog-api-key', apiKey);
           } else {
             proxyReq.removeHeader('x-goog-api-key');
           }
        },
        proxyReqWs: (proxyReq: any) => {
           proxyReq.setHeader('Host', 'generativelanguage.googleapis.com');
           if (apiKey && apiKey !== "proxy_key") {
             proxyReq.setHeader('x-goog-api-key', apiKey);
           } else {
             proxyReq.removeHeader('x-goog-api-key');
           }
        }
      }
  });

  // Proxy WebSocket Live API
  app.use('/ws', apiProxy);
  // Proxy REST API (generateContent)
  app.use('/v1beta', apiProxy);
  app.use('/v1', apiProxy);
  app.use('/v1alpha', apiProxy);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const server = http.createServer(app);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
