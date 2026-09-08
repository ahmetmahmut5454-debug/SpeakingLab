import { GoogleGenAI } from "@google/genai";
import { SavedReport } from "./firebase";



export const generateProgressSummary = async (reports: SavedReport[]): Promise<{
  improvements: string[];
  persistentIssues: string[];
  summary: string;
} | null> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "proxy_key";
  let ai;
  if (apiKey !== "proxy_key") {
    ai = new GoogleGenAI({ apiKey });
  } else {
    ai = new GoogleGenAI({ 
        apiKey, 
        httpOptions: { baseUrl: window.location.protocol === "https:" ? `https://${window.location.host}` : `http://${window.location.host}` } 
    });
  }

  // Take the last 10 reports to avoid token limits
  const sortedReports = [...reports].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  
  const promptText = `
    Analyze the following recent speaking practice session reports for a language learner.
    Provide a structured summary of their progress.
    Identify:
    1. improvements: 2-3 specific areas they have improved in recently.
    2. persistentIssues: 2-3 specific areas they still struggle with.
    3. summary: A short, encouraging paragraph summarizing their overall trend and focus areas.
    
    Return ONLY a valid JSON object matching this schema, without markdown formatting:
    {
      "improvements": ["improvement 1", "improvement 2"],
      "persistentIssues": ["issue 1", "issue 2"],
      "summary": "Overall summary paragraph..."
    }

    Reports:
    ${sortedReports.map((r, i) => `\n--- Session ${i + 1} (${new Date(r.createdAt).toLocaleDateString()}) ---\n${r.reportText}`).join("\n")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      },
    });

    const jsonStr = response.text;
    if (jsonStr) {
      return JSON.parse(jsonStr);
    }
  } catch (error) {
    console.error("Failed to generate AI insights:", error);
    throw error;
  }
  return null;
};
