import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { AudioProcessor, AudioPlayer } from "./audioManager";

const getApiKey = () => {
  try {
    const local = localStorage.getItem('gemini_custom_key');
    if (local) return local;

    // Check Vite environment variable natively (Vercel will inject this if named VITE_GEMINI_API_KEY)
    if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }

    // @ts-ignore - Check process.env fallback for AI Studio's Node environment
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      // @ts-ignore
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {}
  return "";
};

const getAiClient = () => new GoogleGenAI({ apiKey: getApiKey() });

export type ProficiencyLevel = 'A2' | 'B1-B2' | 'C1';

export type VoiceType = 'Zephyr' | 'Puck' | 'Aoede' | 'Charon' | 'Kore' | 'Fenrir';

export interface BotContext {
  level: ProficiencyLevel;
  objective: string;
  topic: string;
  mode: 'Practice' | 'Task';
  taskDurationMinutes: number; // For Practice mode closing
  customRules?: string;
  role?: 'station' | 'restaurant' | 'support' | 'roommate' | 'mayor' | 'investor' | 'default';
  voice?: VoiceType;
  icebreaker?: string;
}

const DEFAULT_PROMPTS: Record<ProficiencyLevel, string> = {
  'A2': "You are an English teacher speaking to an A2 level student. Speak clearly and slightly slowly. Use simple vocabulary. Focus on daily life topics. Be very encouraging. Provide gentle corrections.",
  'B1-B2': "You are an English conversation partner for a B1-B2 level student. Speak at a natural pace. Use common idioms. Ask follow-up questions to encourage the student. Provide occasional corrections.",
  'C1': "You are a sophisticated debate partner for a C1 level student. Speak at a fully natural pace. Use advanced vocabulary. Challenge the student's opinions and ask for justifications."
};

export class EltBot {
  private session: any = null;
  private audioProcessor = new AudioProcessor();
  private audioPlayer = new AudioPlayer();
  public isConnected = false;
  private transcriptHistory: string[] = [];
  private recognition: any = null;

  constructor(
    private callbacks: {
      onTranscription?: (text: string, isModel: boolean) => void;
      onUserLevel?: (level: number) => void;
      onBotLevel?: (level: number) => void;
      onError?: (err: any) => void;
      onBotFinished?: () => void;
    }
  ) {}

  async start(context: BotContext) {
    if (this.isConnected) return;
    this.transcriptHistory = [];
    console.log("Starting ELT Bot session...", context);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted.");

      // Setup parallel Browser Speech Recognition to capture the user's side of the transcript reliably
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              if (text.trim()) {
                this.transcriptHistory.push(`[Student]: ${text}`);
                this.callbacks.onTranscription?.(text, false);
              }
            }
          }
        };
        this.recognition.onend = () => {
          if (this.isConnected) {
            try { this.recognition.start(); } catch(e) {}
          }
        };
        try { this.recognition.start(); } catch(e) {}
      }

      const systemInstruction = `
        ${DEFAULT_PROMPTS[context.level]}
        Topic: ${context.topic}
        Goals: ${context.objective}
        Mode: ${context.mode}
        
        Strict Pedagogical & Turn-Taking Rules:
        1. VOICE ONLY: Speak naturally like a human tutor during a phone call. No text formatting.
        2. EXTREME PATIENCE (CRITICAL): The user is a language learner. They will frequently pause for 3-5 seconds, say "um", "uh", or stay silent to think. YOU MUST NEVER INTERRUPT THEM. Always wait an extra few seconds before you reply to guarantee they are finished speaking. If they pause mid-sentence, remain completely silent and let them continue.
        3. ENCOURAGEMENT: If they struggle in absolute silence for a long time, gently offer a hint or ask a guiding question, but do it softly.
        4. DEEP CONVERSATION: Do not just ask superficial questions. Ask follow-up questions. If they mention a hobby, ask specific details about it. Give them space to elaborate.
        5. CONVERSATION RATIO: Keep your replies relatively short but engaging. The goal is for the student to speak 70% of the time, and you 30%.
        6. ENDING THE CALL: WHEN the user wants to end the call, you MUST audibly say "Thanks for the conversation, let's look at your report now. Goodbye!" BEFORE you trigger the endConversation tool. Do not just stop abruptly.
        
        CRITICAL CLOSING RULE: If the user says goodbye, "let's end this", "thank you that's all", or clearly wishes to terminate the conversation, you must FIRST politely say goodbye (e.g. "Okay, it was great talking to you. See you next time!"). THEN, in the EXACT SAME TURN alongside your goodbye message, you MUST call the \`endConversation\` function to officially end the call.

        ${context.mode === 'Task' 
          ? `TASK-BASED MODE INSTRUCTIONS: 
             You must strictly follow the scenario rules below. Do NOT break character.
             
             When switching to your character, make sure to verbally open with a natural icebreaker (e.g., "${context.icebreaker || 'Hello, how can I help you today?'}") to ease the student into the scenario before discussing the main core problem.

             SCENARIO RULES:
             ${context.objective}
             
             Once you successfully deliver the closing line, call the \`endConversation\` function to end the session.`
          : `PRACTICE MODE INSTRUCTIONS:
             CRITICAL STARTING RULE: As soon as you connect, you MUST speak first. Introduce yourself and ask for the student's name. Use icebreakers (e.g., How are you today? Where are you calling from?) BEFORE jumping into deeper topics like hobbies or work. Get to know them first!
             
             This is an open-ended conversational practice. Build rapport, ask follow-up questions continuously.
             [IMPORTANT CRITERIA]: Around the ${context.taskDurationMinutes}-minute mark of the conversation, naturally start wrapping up. Do not end abruptly. Use transitioning phrases like 'It has been wonderful chatting with you...' and invite them to conclude. When they say goodbye, call the \`endConversation\` function.`
        }
      `;

      const localKey = localStorage.getItem('gemini_custom_key');
      if (!localKey && !getApiKey()) {
        throw new Error("GEMINI_API_KEY is missing! Lutfen ayarlardan kendi API anahtarinizi girin veya .env dosyasina ekleyin.");
      }

      const ai = getAiClient();
      this.session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            console.log("Gemini Live session opened.");
            this.isConnected = true;

            this.audioProcessor.start(stream, (data) => {
              if (this.session && this.isConnected) {
                this.session.sendRealtimeInput({
                  audio: { data, mimeType: 'audio/pcm;rate=16000' }
                });
              }
            }, (level) => {
              this.callbacks.onUserLevel?.(level);
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle function calls (GenAI SDK structure usually uses message.toolCall)
            const functionCalls = message.toolCall?.functionCalls || [];
            
            // Also check legacy/alternative structure just in case
            const altParts = message.serverContent?.modelTurn?.parts || [];
            for (const p of altParts) {
              if (p.functionCall) functionCalls.push(p.functionCall);
            }

            if (functionCalls.length > 0) {
              for (const fc of functionCalls) {
                if (fc.name === 'endConversation') {
                  console.log("AI called endConversation function!");
                  if (this.session && this.isConnected) {
                    try {
                      this.session.sendRealtimeInput([{
                        functionResponse: {
                          name: 'endConversation',
                          id: fc.id,
                          response: { success: true }
                        }
                      }]);
                    } catch(e) {}
                  }
                  const checkFinish = () => {
                    if (this.audioPlayer.isPlaying) {
                      setTimeout(checkFinish, 500);
                    } else {
                      // Add a small buffer after audio finishes (or if it never started)
                      setTimeout(() => {
                        if (this.callbacks.onBotFinished) {
                          this.callbacks.onBotFinished();
                        }
                      }, 3000);
                    }
                  };
                  // Wait before checking so audio has time to start playing if part of the same turn
                  setTimeout(checkFinish, 2000);
                }
              }
            }

            // Handle Barge-in / Interruption
            if (message.serverContent?.interrupted) {
              this.audioPlayer.clear();
            }

            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              const part = parts[0];
              
              // Audio
              if (part.inlineData?.data) {
                this.audioPlayer.playChunk(part.inlineData.data, (level) => {
                  this.callbacks.onBotLevel?.(level / 1.5);
                });
              }

              // Text (transcription)
              const text = part.text || part.thought;
              if (text && typeof text === 'string') {
                this.transcriptHistory.push(`[Tutor]: ${text}`);
                if (this.callbacks.onTranscription) {
                  this.callbacks.onTranscription(text, true);
                }
              }
            }
          },
          onerror: (err) => {
            console.error("Gemini Live error callback:", err);
            this.callbacks.onError?.(err);
            this.stop();
          },
          onclose: () => {
            console.log("Gemini Live session closed.");
            this.isConnected = false;
            this.stop();
          }
        },
        config: {
          generationConfig: {
            responseModalities: ["AUDIO"] as any,
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: context.voice || (context.level === 'C1' ? "Charon" : "Zephyr") } },
            }
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
          tools: [{ functionDeclarations: [{ name: "endConversation", description: "Call this when the conversation naturally concludes or when the user explicitly requests to end it, say goodbye, or finish the task." }] }]
        }
      });

    } catch (err) {
      console.error("Failed to start ELT Bot:", err);
      this.callbacks.onError?.(err);
      this.stop();
      throw err;
    }
  }

  sendHintRequest() {
    if (this.session && this.isConnected) {
      try {
        console.log("Sending hint request to bot...");
        this.session.sendRealtimeInput([{
          text: "System Note: The student has been silent for a long time and might be struggling to find the right words. Without breaking character, give a very short, friendly hint, encourage them, or ask a simpler variation of your last question to keep the conversation going."
        }]);
      } catch (e) {
        console.error("Failed to send hint request:", e);
      }
    }
  }

  async generateReport(context: BotContext): Promise<string> {
    if (this.transcriptHistory.length === 0) {
      return "Sistem bağlantısı sağlandığını ancak görüşme sırasında metne dönüştürme özelliğinin (Speech Recognition) bu cihazda/tarayıcıda desteklenmemesi nedeniyle rapor oluşturulamadığını tespit ettik. Uygulamayı PWA (Ana Ekrana Ekle) olarak yüklerseniz veya Chrome tarayıcı kullanırsanız mikrofondan metne dönüştürme özelliği daha stabil çalışacaktır.";
    }

    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
          The following transcript is a practice session between an English language student and an AI tutor.
          Note: If the student's side of the transcript ([Student]: ...) is missing or empty, it means the client-side text transcriber failed, BUT the student did interact via audio. You must infer the student's performance purely based on how the [Tutor] responded to them (e.g. if Tutor corrects a grammar mistake, infer the mistake. If Tutor says 'Great point!', infer good fluency).
          
          Target CEFR Level: ${context.level}
          Topic: ${context.topic}
          Student's Goal: ${context.objective}

          --- CONVERSATION TRANSCRIPT ---
          ${this.transcriptHistory.join("\n")}
          -------------------------------

          Analyze the student's performance based ONLY on the transcript above (and inferences from the Tutor's responses). 
          Provide a highly structured, constructive feedback report strictly categorized as follows:

          ### 1. Overall & CEFR Assessment
          (Did they seem to meet the goal based on the tutor's reactions?)

          ### 2. Pronunciation & Fluency
          (Assess pacing and clarity based on how well the tutor understood them)

          ### 3. Grammar & Vocabulary
          (Point out inferred strong vocabulary or grammatical mistakes based on the tutor's corrections)

          ### 4. Constructive Next Steps
          (Exact exercises or topics focus)

          Write the entire report in English. Use a professional, encouraging tone.
        `
      });

      return response.text || "Failed to generate report.";
    } catch (err: any) {
      console.error("Report generation failed:", err);
      if (err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE") || err?.status === 503) {
         return `❌ Rapor Oluşturulamadı: Şu anda yapay zeka sunucularında yoğunluk yaşanıyor (503 Service Unavailable). Lütfen rapor yeteneğini daha sonra tekrar deneyin veya konuşmaya bir süre ara verin.\n\nEğer isterseniz sayfayı yenileyip tekrar bağlanabilirsiniz.`;
      }
      return `❌ Rapor Oluşturma Hatası: ${err.message}\n\nDetayları Console'dan veya yukarıdaki mesajdan inceleyebilirsiniz. Sunucu veya API bağlantı hatası oluşmuş olabilir.`;
    }
  }

  stop() {
    this.audioProcessor.stop();
    this.audioPlayer.stop();
    this.session?.close();
    this.isConnected = false;
    
    if (this.recognition) {
      this.recognition.onend = null;
      try { this.recognition.stop(); } catch(e) {}
    }
  }
}
