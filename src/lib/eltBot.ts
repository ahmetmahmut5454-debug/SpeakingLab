import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { AudioProcessor, AudioPlayer } from "./audioManager";
import { predefinedScenarios } from "./scenarios";

const getApiKey = () => {
  try {
    const local = localStorage.getItem("gemini_custom_key");
    if (local) return local;

    // Check Vite environment variable natively (Vercel will inject this if named VITE_GEMINI_API_KEY)
    if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }

    // @ts-ignore - Check process.env fallback for AI Studio's Node environment
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.GEMINI_API_KEY
    ) {
      // @ts-ignore
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {}
  return "";
};

const getAiClient = () => new GoogleGenAI({ apiKey: getApiKey() });

export type ProficiencyLevel = "A1" | "A2" | "B1-B2" | "C1";

export type VoiceType =
  | "Aoede"
  | "Puck"
  | "Zephyr"
  | "Charon"
  | "Kore"
  | "Fenrir";

export interface BotContext {
  level: ProficiencyLevel;
  objective: string;
  topic: string;
  mode: "Practice" | "Task";
  taskDurationMinutes: number; // For Practice mode closing
  customRules?: string;
  scenarioId?: string;
  role?:
    | "station"
    | "restaurant"
    | "support"
    | "roommate"
    | "mayor"
    | "investor"
    | "default";
  voice?: VoiceType;
  icebreaker?: string;
  targetLanguage?: string;
  targetLanguageCode?: string;
}

const getPromptTarget = (context: BotContext) => {
  const lang = context.targetLanguage || "English";
  if (context.level === "A1") {
    return `You are an ${lang} teacher speaking to an absolute beginner (A1 level) student. Speak extremely slowly and clearly. Use only the most basic vocabulary: greetings, numbers, colors, names, countries, and jobs. Ask very simple, direct questions one at a time (e.g., 'What is your name?', 'Where are you from?'). When you ask a question, ALWAYS provide a simple example of how the student can answer (e.g., 'What is your name? You can say: My name is...'). Be extremely patient and encouraging.`;
  } else if (context.level === "A2") {
    return `You are an ${lang} teacher speaking to an A2 level student. Speak clearly and slightly slowly. Use simple vocabulary. Focus on daily life topics, habits, and past events. Be very encouraging. Provide gentle corrections.`;
  } else if (context.level === "B1-B2") {
    return `You are an ${lang} conversation partner for a B1-B2 level student. Speak at a natural pace. Use common idioms. Ask follow-up questions to encourage the student. Provide occasional corrections.`;
  } else {
    return `You are a sophisticated debate partner for a C1 level student in ${lang}. Speak at a fully natural pace. Use advanced vocabulary. Challenge the student's opinions and ask for justifications.`;
  }
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
    },
  ) {}

  async start(context: BotContext) {
    if (this.isConnected) return;
    this.transcriptHistory = [];
    console.log("Starting ELT Bot session...", context);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted.");

      // SpeechRecognition is disabled in favor of inputAudioTranscription from Gemini Live API
      /*
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = context.targetLanguageCode || "en-US";
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
            try {
              this.recognition.start();
            } catch (e) {}
          }
        };
      }
      */

      const systemInstruction = `
        You are SpeakingBuddy, an intelligent speaking partner designed by Ahmet M. Oturak. All rights reserved.
        You provide task-based speaking practices, IELTS scenarios, and free practice modes to help users improve their English speaking skills.
        
        ${getPromptTarget(context)}
        Topic: ${context.topic}
        Goals: ${context.objective}
        Mode: ${context.mode}
        
        Rules:
        1. VOICE ONLY. Speak naturally. No text formatting.
        2. BE PATIENT. Learners pause. Wait extra 3-5s before replying.
        3. 70/30 Ratio: Student speaks 70%, you 30%.
        4. Culture: Handle Turkish names (Sakarya, Istanbul) correctly.
        5. Terminate: Call endConversation tool when session ends.

        ${
          context.mode === "Task"
            ? `Character: Speak first with an icebreaker: "${context.icebreaker || "Hello, how can I help you today?"}". Stay in character.`
            : `Practice: Speak first. Introduce yourself, ask their name. Build rapport.`
        }
      `;

      const localKey = localStorage.getItem("gemini_custom_key");
      if (!localKey && !getApiKey()) {
        throw new Error(
          "GEMINI_API_KEY is missing! Lutfen ayarlardan kendi API anahtarinizi girin veya .env dosyasina ekleyin.",
        );
      }

      const ai = getAiClient();
      this.session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            console.log("Gemini Live session opened.");
            this.isConnected = true;

            // Start audio capture
            this.audioProcessor.start(
              stream,
              (data) => {
                if (this.session && this.isConnected) {
                  try {
                    // Correct audio frame format per skill
                    this.session.sendRealtimeInput({
                      audio: {
                        data,
                        mimeType: "audio/pcm;rate=16000",
                      },
                    });
                  } catch (e) {
                    console.error("Error sending audio frame:", e);
                  }
                }
              },
              (level) => {
                this.callbacks.onUserLevel?.(level);
              },
            );

            // Trigger the bot to start after a small delay
            setTimeout(() => {
              if (this.session && this.isConnected) {
                try {
                  this.session.sendRealtimeInput({
                    text: "The student has connected. Please introduce yourself and start the conversation naturally.",
                  });
                } catch (e) {}
              }
            }, 500);
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
                if (fc.name === "endConversation") {
                  console.log("AI called endConversation function!");
                  if (this.session && this.isConnected) {
                    try {
                      // Use sendToolResponse per skill guidelines
                      this.session.sendToolResponse([
                        {
                          functionResponse: {
                            name: "endConversation",
                            id: fc.id,
                            response: { success: true },
                          },
                        },
                      ]);
                    } catch (e) {
                      console.error("Error sending tool response:", e);
                    }
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
              for (const part of parts) {
                // Audio
                if (part.inlineData?.data) {
                  this.audioPlayer.playChunk(part.inlineData.data, (level) => {
                    this.callbacks.onBotLevel?.(level / 1.5);
                  });
                }

                // Text (transcription in parts fallback)
                const text = part.text || part.thought;
                if (text && typeof text === "string") {
                  this.transcriptHistory.push(`[Tutor]: ${text}`);
                  if (this.callbacks.onTranscription) {
                    this.callbacks.onTranscription(text, true);
                  }
                }
              }
            }
            
            // Handle formal output/input transcription from API
            const outTrans = (message.serverContent as any)?.outputTranscription || (message.serverContent as any)?.outputAudioTranscription;
            if (outTrans?.text) {
              const text = outTrans.text;
              this.transcriptHistory.push(`[Tutor]: ${text}`);
              if (this.callbacks.onTranscription) {
                this.callbacks.onTranscription(text, true);
              }
            }

            const inTrans = (message.serverContent as any)?.inputTranscription || (message.serverContent as any)?.inputAudioTranscription;
            if (inTrans?.text) {
              const text = inTrans.text;
              this.transcriptHistory.push(`[Student]: ${text}`);
              if (this.callbacks.onTranscription) {
                this.callbacks.onTranscription(text, false);
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
          },
        },
        config: {
          responseModalities: ["AUDIO"] as any,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName:
                  context.voice ||
                  (context.level === "C1" ? "Charon" : "Zephyr"),
              },
            },
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "endConversation",
                  description:
                    "Call this when the conversation naturally concludes or when the user explicitly requests to end it, say goodbye, or finish the task.",
                },
              ],
            },
          ],
        },
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
        this.session.sendRealtimeInput({
          text: "System Note: The student has been silent for a long time and might be struggling to find the right words. Without breaking character, give a very short, friendly hint, encourage them, or ask a simpler variation of your last question to keep the conversation going.",
        });
      } catch (e) {
        console.error("Failed to send hint request:", e);
      }
    }
  }

  get transcript() {
    return [...this.transcriptHistory];
  }

  async generateReport(
    context: BotContext,
    externalTranscript?: string[],
  ): Promise<string> {
    const transcriptToUse = externalTranscript || this.transcriptHistory;
    
    // Heuristic Local Report Generator (The strictly robust fallback)
    const buildLocalReport = () => {
      let studentTurns = 0;
      let botTurns = 0;
      let studentWordCount = 0;
      for (const line of transcriptToUse) {
        if (line.startsWith("[Student]:")) {
           studentTurns++;
           studentWordCount += line.split(" ").length - 1;
        } else if (line.startsWith("[Tutor]:")) {
           botTurns++;
        }
      }
      
      const targetLevel = context.level;
      let overall = "";
      let fluency = "";
      let grammar = "";
      let nextsteps = "";

      const scenario = context.scenarioId ? predefinedScenarios.find(s => s.id === context.scenarioId) : null;
      const isIELTS = scenario?.category === 'IELTS Preparation';

      if (studentTurns === 0 && botTurns === 0) {
        return "Sistem bağlantısı sağlandı ancak cihazınızda mikrofon/ses iletimi yapılamadı. Başka bir cihazdan veya Chrome tarayıcıdan denemelisiniz.";
      }

      if (isIELTS) {
        return `### 🎯 IELTS Mock Band Score & Feedback\n* **Estimated Band Score:** 5.0\n* **Fluency & Coherence:** Need more practice speaking at length.\n* **Lexical Resource:** Try to use more varied vocabulary.\n* **Grammatical Range & Accuracy:** Focus on complex sentence structures.\n* **Pronunciation:** Clear enough to be understood.\n\n### 🚀 Next Steps\n- Practice answering Part 1 questions.\n- Learn more idioms.`;
      }


      if (studentTurns === 0 && botTurns > 0) {
        overall = `Görüşmeniz tamamlandı. Hedef seviyeniz **${targetLevel}**. Cihazınızda (örn. iPhone Safari) sesten metne dönüştürme API'si bulunmadığı için doğrudan AI değerlendirmesi yapılamadı ancak yapay zeka ile başarıyla pratik yaptınız (${botTurns} tur).`;
        fluency = `Dinleme ve anlama konusunda gayet iyiydiniz. Yanıtlarınızı verirken özgüvenli olmaya devam edin.`;
        grammar = `Daha uzun cümleler kurmaya ve gramer yapılarını pratik etmeye devam edin.`;
        nextsteps = `- Daha detaylı analiz için Chrome (Android/PC) tercih edin.\n- Kelime dağarcığınızı geliştirmeye devam edin.\n- "${context.topic}" konusunda yeni pratikler yapın.`;
      } else {
        const avgWords = studentTurns > 0 ? (studentWordCount / studentTurns) : 0;
        overall = `Görüşme başarıyla tamamlandı. Hedef seviye: **${targetLevel}**. Toplam ${studentTurns} karşılıklı dialog kurdunuz.`;
        if (avgWords > 12) {
            fluency = "Akıcılığınız gayet iyi! Uzun cümleler kurarak kendinizi net bir şekilde ifade ediyorsunuz.";
            grammar = "Gramer yapılarını doğal bir şekilde kullanabiliyorsunuz.";
        } else if (avgWords > 5) {
             fluency = "İyi iş çıkardınız. Sorulara makul uzunlukta yanıtlar verdiniz, konuşurken ritminiz güzeldi.";
             grammar = "Temel kurallara hakimsiniz, ancak daha kompleks bağlaçlar kullanmayı deneyebilirsiniz.";
        } else {
             fluency = "Kendinizi ifade etmeye çabalıyorsunuz ancak cevaplarınız biraz kısa kalıyor. Hata yapmaktan çekinmeyin!";
             grammar = "Kelime düzeyinde anlaşılabiliyorsunuz, cümle kurma pratiğinizi artırmalısınız.";
        }
        nextsteps = `- Sesli pratiklerinizi sıklaştırın.\n- Kısa cevaplar yerine sebep-sonuç belirten (because, so) cümleler kurun.\n- "${context.topic}" konusunu tekrar çalışın.`;
      }

      return `### 1. Overall & CEFR Assessment\n${overall}\n\n### 2. Pronunciation & Fluency\n${fluency}\n\n### 3. Grammar & Vocabulary\n${grammar}\n\n### 4. Next Steps\n${nextsteps}`;
    };

    if (transcriptToUse.length === 0) {
      // Empty transcript: Instead of an error, directly provide a functional local report
      return buildLocalReport();
    }

    let attempt = 0;
    const maxRetries = 2;
    const modelsToTry = [
      "gemini-3.5-flash"
    ];
    let lastErr: any;

    while (attempt < maxRetries) {
      try {
        const ai = getAiClient();
        const modelName = modelsToTry[attempt] || "gemini-3.5-flash";
        console.log(`Generating report with model: ${modelName}`);
        
        const scenario = context.scenarioId ? predefinedScenarios.find(s => s.id === context.scenarioId) : null;
        const isIELTS = scenario?.category === 'IELTS Preparation';

        let explicitScoreSnippet = "";
        if (isIELTS) {
           const fullTranscript = transcriptToUse.join("\n");
           const scoreRegex = /(?:band|score)(?:\s+is|\s+of|\s*:)?\s*([1-9](?:\.[05])?)/gi;
           let match;
           let lastScore = null;
           while ((match = scoreRegex.exec(fullTranscript)) !== null) {
              lastScore = match[1];
           }
           if (lastScore) {
              explicitScoreSnippet = `\n\n>>> CRITICAL REQUIREMENT: The Tutor assigned an Estimated Band Score of ${lastScore} in the conversation. You MUST set the Estimated Band Score in your report to EXACTLY ${lastScore}. Do NOT change it or recalculate it. <<<\n\n`;
           }
        }

        const standardFormat = `
            Provide a highly structured, strict, and completely objective feedback report for a general language practice session. 
            Do NOT inflate the student's level or give unearned praise. Be highly critical and identify specific mistakes, awkward phrasing, and areas of improvement.

            Use the following exact Markdown format:

            ### 🎯 Session Assessment
            * **Goal Achievement:** [Did they meet their goal for this session? Be objective.]
            * **Estimated Level:** [CEFR Level - Evaluate strictly based on actual grammar, vocabulary, and flow shown.]
            * **Fluency Score:** [Estimate score from 0 to 100]
            * **Grammar Score:** [Estimate score from 0 to 100]
            * **Vocabulary Score:** [Estimate score from 0 to 100]
            * **General Impression:** [Summary of performance, highlighting main weaknesses]

            ### 🗣️ Fluency & Pronunciation
            * [Strict feedback on clarity, pacing, hesitations, and overall fluency]
            * **Struggled Sounds/Words:** [Highlight 2-3 specific phonemes (e.g., /th/, /r/) or words the student struggled to pronounce]
            * **Strengths:** [Examples]
            * **To improve:** [Examples]

            ### 📚 Grammar & Vocabulary
            * [Strict feedback on range of vocabulary and grammatical accuracy. Point out basic errors if present.]
            * **Corrections:** [Examples of mistakes and how to fix them]
            * **New words to learn:** [2-3 useful advanced words/phrases for next time]

            ### 🚀 Next Steps
            * [Actionable tip 1]
            * [Actionable tip 2]
            * [Actionable tip 3]
        `;

        const ieltsFormat = `
            Provide a highly structured, strictly objective, and critical feedback report based on the official IELTS Speaking test grading criteria.
            Do NOT inflate the Band Score. Give a realistic, strict score reflecting true IELTS standards. Do not give "free" points. If the student makes basic grammar errors or hesitates frequently, the score must be penalized accordingly (e.g. 5.0 or 5.5).
            ${explicitScoreSnippet}

            >>> CRITICAL INSTRUCTION FOR BAND SCORE <<<
            Read the last few messages of the transcript. The [Tutor] has likely given the student a specific Estimated Band Score (e.g., 4.5, 5.5, 6.0).
            You MUST extract this exact number and use it as your Estimated Band Score. Do NOT recalculate or invent a different score. If the Tutor said 5.5, your score MUST be 5.5.
            >>> END CRITICAL INSTRUCTION <<<

            Use the following exact Markdown format:

            ### 🎯 IELTS Mock Assessment
            * **Estimated Band Score:** [Extract the exact score mentioned by the Tutor in the transcript. If not mentioned, estimate strictly 0.0 - 9.0]
            * **Fluency Score:** [Estimate sub-score strictly 0.0 - 9.0]
            * **Grammar Score:** [Estimate sub-score strictly 0.0 - 9.0]
            * **Vocabulary Score:** [Estimate sub-score strictly 0.0 - 9.0]
            * **General Impression:** [Summary of performance, focusing on areas costing them points]

            ### 🗣️ Fluency & Coherence
            * [Strict feedback on speaking at length, hesitation, and linking words]

            ### 📚 Lexical Resource
            * [Strict feedback on vocabulary range, flexibility, and idiomatic language]
            * **Strong words used:** [Examples]
            * **To improve:** [Examples of better vocabulary to use]

            ### 📝 Grammatical Range & Accuracy
            * [Strict feedback on complex structures and error density]
            * **Corrections:** [Examples of mistakes and corrections]

            ### 🎤 Pronunciation
            * [Strict feedback on clarity, intonation, and features of connected speech]
            * **Struggled Sounds/Words:** [Highlight 2-3 specific phonemes (e.g., /th/, /r/) or words the student struggled to pronounce]

            ### 🚀 Next Steps
            * [Actionable tip 1]
            * [Actionable tip 2]
            * [Actionable tip 3]
        `;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: `
            The following transcript is a practice session between a ${context.targetLanguage || 'English'} language student and an AI tutor.
            Note: If the student's side of the transcript ([Student]: ...) is missing or empty, it means the client-side text transcriber failed, BUT the student did interact via audio. You must infer the student's performance purely based on how the [Tutor] responded to them.
            
            Target CEFR Level: ${context.level}
            Target Language: ${context.targetLanguage || 'English'}
            Topic: ${context.topic}
            Student's Goal: ${context.objective}

            --- CONVERSATION TRANSCRIPT ---
            ${transcriptToUse.join("\n")}
            -------------------------------

            ${isIELTS ? ieltsFormat : standardFormat}
          `
        });

        if (response.text && response.text.trim().length > 0) {
          return response.text;
        }
      } catch (err: any) {
        lastErr = err;
        console.error(`Report generation failed on attempt ${attempt + 1}:`, err);
        attempt++;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // If AI completely fails or times out, seamlessly return the structured local report!
    console.log("AI Report Generation completely failed. Falling back to local offline heuristic report.");
    return buildLocalReport();
  }

  stop() {
    this.audioProcessor.stop();
    this.audioPlayer.stop();
    this.session?.close();
    this.isConnected = false;

    if (this.recognition) {
      this.recognition.onend = null;
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
}
