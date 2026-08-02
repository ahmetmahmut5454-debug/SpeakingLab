import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({});
  
  try {
    const session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "ASDFASDF"
            }
          }
        }
      }
    });
    console.log("Connected ASDFASDF!");
    session.close();
  } catch(e) {
    console.error("Failed:", e.message);
  }
}
run();
