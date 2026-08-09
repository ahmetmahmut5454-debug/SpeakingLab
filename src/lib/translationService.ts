import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./eltBot";
import { Scenario } from "./scenarios";

const cache = new Map<string, { studentBriefing: string; vocabulary: string[]; icebreaker?: string }>();

export const translateScenario = async (
  scenario: Scenario,
  targetLang: string
): Promise<{ studentBriefing: string; vocabulary: string[]; icebreaker?: string } | null> => {
  if (targetLang.toLowerCase().includes("english") || targetLang === "en-US") {
    return {
      studentBriefing: scenario.studentBriefing || scenario.topic,
      vocabulary: scenario.vocabulary || [],
      icebreaker: scenario.icebreaker,
    };
  }

  const cacheKey = `${scenario.id}_${targetLang}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are a professional translator. Translate the following scenario details into ${targetLang}.
      Return ONLY a valid JSON object with the following structure:
      {
        "studentBriefing": "the translated briefing",
        "vocabulary": ["translated_word_1", "translated_word_2", ...],
        "icebreaker": "the translated icebreaker if provided"
      }

      Here is the text to translate:
      Briefing: ${scenario.studentBriefing || scenario.topic}
      Vocabulary: ${(scenario.vocabulary || []).join(", ")}
      Icebreaker: ${scenario.icebreaker || ""}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      cache.set(cacheKey, data);
      return data;
    }
  } catch (error) {
    console.error("Translation error:", error);
  }
  return null;
};
