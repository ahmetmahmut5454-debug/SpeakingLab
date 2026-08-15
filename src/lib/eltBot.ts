import { GoogleGenAI, LiveServerMessage, Type } from "@google/genai";
import { AudioProcessor, AudioPlayer } from "./audioManager";
import { predefinedScenarios } from "./scenarios";
import { calculateIELTSBandScore, processIELTSReportScores } from "./mastery";
import { getUnmasteredErrorsForPrompt, addErrorItemsFromReport } from "./errorBank";

export const getApiKey = () => {
  try {
    const local = localStorage.getItem("gemini_custom_key");
    if (local) return local;

    if (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }

    // @ts-ignore
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

export const cleanTranscript = (text: string) => {
  if (!text) return text;
  let cleaned = text.replace(/\s+/g, " ").trim();
  
  let prev;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/\b([\w\u00C0-\u017F]+)\s+\1\b/gi, "$1");
  } while (cleaned !== prev);

  const fillers = ["ıı", "eee", "ee", "hmm", "öhm", "aa", "hı hı", "heh", "um", "uh", "uhh", "umm"];
  const regex = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(regex, "");

  cleaned = cleaned.replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/^[.,?!]\s*/, "");
  cleaned = cleaned.replace(/\s+([.,?!])/g, "$1");

  return cleaned || text;
};

export type ProficiencyLevel = "A1" | "A2" | "B1" | "B2" | "C1";

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
  mode: "Practice" | "Task" | "IELTS";
  taskDurationMinutes: number;
  customRules?: string;
  scenarioId?: string;
  pronunciationPracticeWord?: string;
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
  vocabulary?: string[];
  studentBriefing?: string;
}

export const isIELTSSession = (context: BotContext): boolean => {
  if (!context) return false;
  if (context.mode === "IELTS" || (context.level as string) === "IELTS") return true;

  const scenario = context.scenarioId ? predefinedScenarios.find(s => s.id === context.scenarioId) : null;
  if (scenario?.category === "IELTS Preparation" || (scenario?.level as string) === "IELTS") return true;

  const textToSearch = [
    context.topic,
    context.objective,
    context.scenarioId,
    scenario?.title,
    scenario?.topic,
    scenario?.studentBriefing,
  ].filter(Boolean).join(" ").toLowerCase();

  return (
    textToSearch.includes("ielts") ||
    textToSearch.includes("cue card") ||
    textToSearch.includes("speaking test") ||
    textToSearch.includes("speaking part 1") ||
    textToSearch.includes("speaking part 2") ||
    textToSearch.includes("speaking part 3") ||
    textToSearch.includes("examiner") ||
    textToSearch.includes("band score")
  );
};

const getPromptTarget = (context: BotContext) => {
  const lang = context.targetLanguage || "English";
  if (context.level === "A1") {
    return `You are a ${lang} teacher speaking to an absolute beginner (A1 level) student. Speak extremely slowly and clearly in ${lang}. Use only basic ${lang} vocabulary: greetings, numbers, colors, names, countries, and jobs. Ask very simple, direct questions in ${lang} one at a time. When you ask a question, ALWAYS provide a simple example in ${lang} of how the student can answer. Be extremely patient and encouraging.`;
  } else if (context.level === "A2") {
    return `You are a ${lang} teacher speaking to an A2 level student. Speak clearly and slightly slowly in ${lang}. Use simple ${lang} vocabulary. Focus on daily life topics, habits, and past events in ${lang}. Be very encouraging. Provide gentle corrections in ${lang}.`;
  } else if (context.level === "B1" || context.level === "B2") {
    return `You are a ${lang} conversation partner for a B1-B2 level student. Speak at a natural pace in ${lang}. Use common ${lang} idioms. Ask follow-up questions in ${lang} to encourage the student. Provide occasional corrections in ${lang}.`;
  } else {
    return `You are a sophisticated debate partner for a C1 level student in ${lang}. Speak at a fully natural pace in ${lang}. Use advanced ${lang} vocabulary. Challenge the student's opinions and ask for justifications in ${lang}.`;
  }
};

export class EltBot {
  private session: any = null;
  private audioProcessor = new AudioProcessor();
  private audioPlayer = new AudioPlayer();
  public isConnected = false;
  private transcriptHistory: string[] = [];
  private recognition: any = null;

  private currentBotSubtitle: string = "";
  private isUserActiveSession = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private savedContext: BotContext | null = null;
  private currentStream: MediaStream | null = null;

  constructor(
    private callbacks: {
      onTranscription?: (text: string, isModel: boolean) => void;
      onUserLevel?: (level: number) => void;
      onBotLevel?: (level: number) => void;
      onError?: (err: any) => void;
      onBotFinished?: () => void;
      onShowCueCard?: (topic: string) => void;
      onReconnecting?: (attempt: number) => void;
    },
  ) {}

  async start(context: BotContext) {
    if (this.isConnected) return;
    this.savedContext = context;
    this.isUserActiveSession = true;
    this.reconnectAttempts = 0;
    this.transcriptHistory = [];
    console.log("Starting ELT Bot session...", context);

    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      this.setupSpeechRecognition(context);
      await this.connectLiveSession(context, this.currentStream);
    } catch (err) {
      console.error("Failed to start ELT Bot:", err);
      this.callbacks.onError?.(err);
      this.stop();
      throw err;
    }
  }

  private setupSpeechRecognition(context: BotContext) {
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
              this.callbacks.onTranscription?.(cleanTranscript(text), false);
            }
          }
        }
      };
      let hasError = false;
      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          hasError = true;
        }
      };
      this.recognition.onend = () => {
        if (this.isConnected && this.isUserActiveSession && !hasError) {
          try {
            this.recognition.start();
          } catch (e) {}
        }
      };
      try {
        this.recognition.start();
      } catch (e) {}
    }
  }

  private async connectLiveSession(context: BotContext, stream: MediaStream) {
    const targetLang = context.targetLanguage || "English";
    const isEnglish = targetLang.toLowerCase() === "english";

    // Load unmastered error bank items for Spaced Repetition testing
    const unmasteredErrors = getUnmasteredErrorsForPrompt();
    const errorBankPromptSection = unmasteredErrors.length > 0
      ? `\n\nSPACED REPETITION / ERROR BANK INSTRUCTION:
The student has previously made these specific errors:
${unmasteredErrors.map((err) => `- ${err}`).join("\n")}
Naturally test or gently guide the student to practice these structures in today's conversation.`
      : "";

    let systemInstruction = `
      CRITICAL TARGET LANGUAGE MANDATE:
      - THE TARGET LANGUAGE FOR THIS PRACTICE SESSION IS: **${targetLang.toUpperCase()}**.
      - YOU MUST SPEAK 100% EXCLUSIVELY IN **${targetLang.toUpperCase()}**.
      - ALL YOUR RESPONSES, GREETINGS, QUESTIONS, ICEBREAKERS, AND FEEDBACK MUST BE IN **${targetLang.toUpperCase()}**.
      ${!isEnglish ? `- UNDER NO CIRCUMSTANCES SHOULD YOU SPEAK ENGLISH. DO NOT USE ENGLISH AT ALL unless the user explicitly asks for a translation.` : ""}

      You are SpeakingBuddy, an intelligent speaking partner designed by Ahmet M. Oturak. All rights reserved.
      You provide task-based speaking practices, IELTS scenarios, and free practice modes to help users improve their ${targetLang} speaking skills.
      
      ${getPromptTarget(context)}
      Topic: ${context.topic}
      Goals: ${context.objective}
      Mode: ${context.mode}
      ${context.vocabulary ? `Target Vocabulary (Expected to be used by student in ${targetLang}): ${context.vocabulary.join(", ")}` : ""}
      ${errorBankPromptSection}
      
      Rules:
      1. VOICE ONLY. Speak naturally in ${targetLang}. No text formatting.
      2. BE PATIENT. Learners pause. Wait extra 3-5s before replying.
      3. 70/30 Ratio: Student speaks 70%, you 30%.
      4. Culture: Handle cultural references and names correctly.
      5. Terminate: Call endConversation tool when session ends.
      6. KEEP GOING: If the student stops speaking or is quiet, you MUST encourage them in ${targetLang} to continue or ask a follow-up question in ${targetLang}. Do NOT remain silent.
      7. IGNORE NOISE & FILLERS: Ignore thinking noises, fillers, backchanneling, and minor pauses. If interrupted by short sounds, IMMEDIATELY RESUME and finish your previous sentence in ${targetLang}.
      8. IELTS PART 2 CUE CARD PREPARATION: When presenting Part 2, FIRST invoke showCueCard tool. Say: "Now I will give you a topic. You have 1 minute to prepare your notes, starting now. Please do not speak during preparation time." Then STAY SILENT during their 1-minute prep. Do NOT speak or prompt the student until they finish their 1 to 2 minute presentation or indicate they are finished.

      ${
        context.mode === "IELTS" || (context.mode === "Task" && context.topic?.includes("IELTS Speaking Examiner"))
          ? `Examiner: Speak first with an icebreaker in ${targetLang}: "${context.icebreaker || "Hello. Let's start the speaking test."}". Stay in character as a strict examiner.`
          : context.mode === "Task" && context.icebreaker
          ? `Character: Speak first with an icebreaker in ${targetLang}: "${context.icebreaker}". Stay in character.`
          : `Practice: Speak first. Greet the student and introduce yourself in ${targetLang}, then ask their name or how they are doing in ${targetLang}. Build rapport.`
      }
    `;

    if (context.pronunciationPracticeWord) {
      systemInstruction = `
        You are a supportive pronunciation coach. The user wants to practice the word "${context.pronunciationPracticeWord}".
        
        CRITICAL INSTRUCTIONS FOR THIS SESSION:
        1. Your very first response must be to simply say the word "${context.pronunciationPracticeWord}" clearly and slowly, and then ask the user to "Repeat after me". Do not say anything else in the first turn.
        2. Listen carefully to their pronunciation.
        3. Give immediate, specific feedback on how to improve, or praise them if they get it right.
        4. Keep your responses very brief, supportive, and focused only on this word.
        5. Call the endConversation tool when the user successfully pronounces the word or after 3 attempts.
      `;
    }

    const ai = getAiClient();
    this.session = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      callbacks: {
        onopen: () => {
          console.log("Gemini Live session opened.");
          this.isConnected = true;
          this.reconnectAttempts = 0;

          this.audioProcessor.start(
            stream,
            (data) => {
              if (this.session && this.isConnected) {
                try {
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
            () => this.audioPlayer.isPlaying
          );

          if (this.transcriptHistory.length === 0) {
            setTimeout(() => {
              if (this.session && this.isConnected) {
                try {
                  const targetLangForTrigger = context.targetLanguage || "English";
                  const triggerMessage = context.mode === "IELTS" || (context.mode === "Task" && context.topic?.includes("IELTS Speaking Examiner"))
                    ? `SYSTEM MESSAGE: The student has connected. Please start the IELTS speaking test now by asking the first question in ${targetLangForTrigger}.`
                    : `SYSTEM MESSAGE: The student has connected. Please introduce yourself and start the conversation naturally in ${targetLangForTrigger}.`;
                  this.session.sendClientContent({
                    turns: [{ role: "user", parts: [{ text: triggerMessage }] }],
                    turnComplete: true,
                  });
                } catch (e) {}
              }
            }, 500);
          } else {
             // We are reconnecting and have previous conversation history. Inject it!
             setTimeout(() => {
              if (this.session && this.isConnected) {
                try {
                  const historyContext = `SYSTEM NOTE: Our network connection dropped, and we just reconnected. Here is the transcript of our conversation so far:\n\n${this.transcriptHistory.join("\n")}\n\nPlease smoothly continue the conversation from where we left off without explicitly mentioning the disconnect unless necessary.`;
                  this.session.sendClientContent({
                    turns: [{ role: "user", parts: [{ text: historyContext }] }],
                    turnComplete: true,
                  });
                } catch (e) {}
              }
            }, 500);
          }
        },
        onmessage: async (message: LiveServerMessage) => {
          const functionCalls = message.toolCall?.functionCalls || [];
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
                    this.session.sendToolResponse([
                      {
                        functionResponse: {
                          name: "endConversation",
                          id: fc.id,
                          response: { success: true },
                        },
                      },
                    ]);
                  } catch (e) {}
                }
                const checkFinish = () => {
                  if (this.audioPlayer.isPlaying) {
                    setTimeout(checkFinish, 500);
                  } else {
                    setTimeout(() => {
                      if (this.callbacks.onBotFinished) {
                        this.callbacks.onBotFinished();
                      }
                    }, 3000);
                  }
                };
                setTimeout(checkFinish, 1000);
              } else if (fc.name === "showCueCard") {
                if (this.callbacks.onShowCueCard && fc.args && fc.args.topic) {
                  this.callbacks.onShowCueCard(fc.args.topic as string);
                }
                if (this.session && this.isConnected) {
                  try {
                    this.session.sendToolResponse([
                      {
                        functionResponse: {
                          name: "showCueCard",
                          id: fc.id,
                          response: { success: true, instruction: "Tool successful. The cue card is now visible to the student. YOU MUST IMMEDIATELY SPEAK." },
                        },
                      },
                    ]);
                  } catch (e) {}
                }
              }
            }
          }

          if (message.serverContent?.interrupted) {
            this.audioPlayer.clear();
          }

          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                this.audioPlayer.playChunk(part.inlineData.data, (level) => {
                  this.callbacks.onBotLevel?.(level / 1.5);
                });
              }

              const text = part.text || part.thought;
              if (text && typeof text === "string") {
                this.currentBotSubtitle += text;
                if (this.callbacks.onTranscription) {
                  this.callbacks.onTranscription(this.currentBotSubtitle, true);
                }
              }
            }
          }
          
          const outTrans = (message.serverContent as any)?.outputTranscription || (message.serverContent as any)?.outputAudioTranscription;
          if (outTrans?.text) {
            const text = outTrans.text;
            this.currentBotSubtitle += text;
            if (this.callbacks.onTranscription) {
              this.callbacks.onTranscription(this.currentBotSubtitle, true);
            }
            if (outTrans.finished) {
              this.transcriptHistory.push(`[Tutor]: ${this.currentBotSubtitle}`);
              this.currentBotSubtitle = "";
            }
          }

          if (message.serverContent?.turnComplete) {
            if (this.currentBotSubtitle.trim().length > 0) {
              this.transcriptHistory.push(`[Tutor]: ${this.currentBotSubtitle}`);
              this.currentBotSubtitle = "";
            }
          }
        },
        onerror: (err) => {
          console.error("Gemini Live error callback:", err);
          this.handleUnexpectedDisconnect();
        },
        onclose: () => {
          console.log("Gemini Live session closed.");
          this.isConnected = false;
          this.handleUnexpectedDisconnect();
        },
      },
      config: {
        responseModalities: ["AUDIO"] as any,
        outputAudioTranscription: {},
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
              {
                name: "showCueCard",
                description: "Call this EXACTLY when you are transitioning to IELTS Part 2 and about to present the cue card to the student. Pass the complete text of the cue card as the topic argument.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    topic: {
                      type: Type.STRING,
                      description: "The complete text of the cue card task (e.g. 'Describe a job that you consider highly important. You should say: ...')",
                    }
                  },
                  required: ["topic"],
                }
              },
            ],
          },
        ],
      },
    });
  }

  private async handleUnexpectedDisconnect() {
    if (!this.isUserActiveSession) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting exponential backoff auto-reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.callbacks.onReconnecting?.(this.reconnectAttempts);

      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (this.isUserActiveSession && this.savedContext && this.currentStream) {
        try {
          await this.connectLiveSession(this.savedContext, this.currentStream);
          return;
        } catch (e) {
          console.error("Reconnection attempt failed:", e);
        }
      }
    }

    // If max retries exceeded
    this.stop();
  }

  sendHintRequest() {
    if (this.session && this.isConnected) {
      try {
        console.log("Sending hint request to bot...");
        this.session.sendClientContent({
          turns: [{ role: "user", parts: [{ text: "System Note: The student has been silent for a long time and might be struggling to find the right words. Without breaking character, give a very short, friendly hint, encourage them, or ask a simpler variation of your last question to keep the conversation going." }] }],
          turnComplete: true,
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
    
    let studentTurnsCount = 0;
    for (const line of transcriptToUse) {
      if (line.startsWith("[Student]:")) {
         studentTurnsCount++;
      }
    }

    const buildSavedReport = () => {
      // We will no longer fallback to hardcoded reports unless completely necessary.
      // But we will keep this function around just in case the AI generation completely fails.
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

      const isIELTS = isIELTSSession(context);

      if (studentTurns === 0 && botTurns === 0) {
        return "Sistem bağlantısı sağlandı ancak cihazınızda mikrofon/ses iletimi yapılamadı. Başka bir cihazdan veya Chrome tarayıcıdan denemelisiniz.";
      }

      if (isIELTS) {
        const avgWords = studentTurns > 0 ? (studentWordCount / studentTurns) : 0;
        let fluencyScore = 6.0;
        let lexicalScore = 6.0;
        let grammarScore = 6.0;
        let pronScore = 6.5;

        if (studentTurns >= 4 && avgWords > 10) {
          fluencyScore = 7.0;
          lexicalScore = 6.5;
          grammarScore = 6.5;
          pronScore = 7.0;
        } else if (studentTurns >= 2 && avgWords > 5) {
          fluencyScore = 6.5;
          lexicalScore = 6.0;
          grammarScore = 6.0;
          pronScore = 6.5;
        } else if (studentTurns > 0) {
          fluencyScore = 6.0;
          lexicalScore = 6.0;
          grammarScore = 5.5;
          pronScore = 6.0;
        }

        const calculatedBand = calculateIELTSBandScore(fluencyScore, lexicalScore, grammarScore, pronScore);

        let rep = `### 🎯 IELTS Mock Assessment
* **Estimated Band Score:** ${calculatedBand.toFixed(1)}
* **Fluency & Coherence Score:** ${fluencyScore.toFixed(1)}
* **Lexical Resource Score:** ${lexicalScore.toFixed(1)}
* **Grammatical Range & Accuracy Score:** ${grammarScore.toFixed(1)}
* **Pronunciation Score:** ${pronScore.toFixed(1)}
* **General Impression:** ${studentTurns > 3 ? 'Good overall attempt addressing the IELTS speaking prompt with sustained turns.' : 'Short attempt addressing the IELTS speaking prompt. Try to elaborate on your answers.'}`;

        if (lastErr) {
            rep += `\n\n*(Error Details: ${lastErr?.message || lastErr})*`;
        }

        rep += `

### 🗣️ Fluency & Coherence
* Spoke with ${fluencyScore >= 6.5 ? 'good fluency and minimal hesitations.' : 'acceptable flow and coherence.'}
* **Fillers & Hesitations:** ${studentTurns > 0 ? 'Occasional minor pauses while organizing thoughts.' : 'Limited speech data recorded.'}

### 📚 Lexical Resource
* Used appropriate vocabulary for the scenario.

### 📝 Grammatical Range & Accuracy
* Sentence structure was ${grammarScore >= 6.0 ? 'generally complex with good control.' : 'mostly simple and generally clear.'}

### 🎤 Pronunciation
* Pronunciation was clear and intelligible.

### 🚀 Next Steps
- Practice answering Part 1 and Part 2 questions with longer responses.
- Use more varied connective words and advanced vocabulary.`;
        addErrorItemsFromReport(rep);
        return rep;
      }

      if (studentTurns === 0 && botTurns > 0) {
        overall = `Görüşmeniz tamamlandı. Hedef seviyeniz **${targetLevel}**. Sizinle harika bir pratik yaptık (${botTurns} tur). Ancak arka planda cihazınızın "Sesten Metne" aktarım sistemi anlık olarak durakladığı için cümlelerinizi metin olarak kaydedemedim.`;
        if (lastErr) overall += `\n\n(Hata Detayı: ${lastErr?.message || lastErr})`;
        fluency = `Dinleme ve anlama konusunda gayet iyiydiniz. Yanıtlarınızı verirken özgüvenli olmaya devam edin.`;
        grammar = `Sohbetin gidişatından anladığım kadarıyla konuları yakalayabiliyorsunuz. Daha uzun cümleler kurmaya ve gramer yapılarını pratik etmeye devam edin.`;
        nextsteps = `- Daha detaylı analiz için sesinizin tamamen yazıya dökülebildiğinden emin olun.\n- Kelime dağarcığınızı geliştirmeye devam edin.\n- "${context.topic}" konusunda yeni pratikler yapın.`;
      } else {
        const avgWords = studentTurns > 0 ? (studentWordCount / studentTurns) : 0;
        overall = `Görüşme başarıyla tamamlandı. Hedef seviye: **${targetLevel}**. Toplam ${studentTurns} karşılıklı dialog kurdunuz.`;
        if (lastErr) overall += `\n\n(Hata Detayı: ${lastErr?.message || lastErr})`;
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

      const rep = `### 1. Overall & CEFR Assessment\n${overall}\n\n### 2. Pronunciation & Fluency\n${fluency}\n\n### 3. Grammar & Vocabulary\n${grammar}\n\n### 4. Next Steps\n${nextsteps}`;
      addErrorItemsFromReport(rep);
      return rep;
    };

    if (transcriptToUse.length === 0) {
      return buildSavedReport();
    }
    
    // We will no longer force the hardcoded report if we have at least 1 turn. We want dynamic feedback always.
    
    let attempt = 0;
    const modelsToTry = [
      "gemini-3.1-pro-preview",
      "gemini-3.5-flash",
      "gemini-2.5-flash"
    ];
    const maxRetries = modelsToTry.length;
    let lastErr: any;

    while (attempt < maxRetries) {
      try {
        const ai = getAiClient();
        const modelName = modelsToTry[attempt] || "gemini-3.1-pro-preview";
        console.log(`Generating report with model: ${modelName}`);
        
        const isIELTS = isIELTSSession(context);

        const accuracyRules = `
            >>> CRITICAL DIRECTIVE: TRANSCRIPT ACCURACY & STT PHONETIC/ACCENT TOLERANCE <<<
            1. SPEECH-TO-TEXT (STT) ACCENT & PHONETIC ERROR TOLERANCE: Web Speech API and STT engines frequently introduce transcript misrecognitions due to non-native accents, speech rhythm, acoustic distortion, or background noise.
               - DO NOT penalize the student or cite STT transcript typos/phonetic misrecognitions as student grammar or vocabulary errors.
               - Evaluate the student's TRUE linguistic intent and underlying competence.
            2. EXACT VERBATIM QUOTING: When quoting what the student said, ONLY quote words appearing verbatim in [Student]: lines.
            3. NO HALLUCINATED OR MADE-UP WORDS: Do not invent words that the student did NOT actually say.
            4. EXACT MATCH FORMATTING: Format corrections as: "Exact Student Quote" -> "Suggested Correction".
            5. CLICKABLE VOCABULARY: Wrap advanced words in <u> tags (e.g. <u>resilience</u>).
            >>> END CRITICAL DIRECTIVE <<<
        `;

        const standardFormat = `
            Provide a highly structured, strict, and completely objective feedback report for a general language practice session based strictly on Cambridge ESOL CEFR Speaking Criteria (CEFR Levels A1 to C2). 
            Do NOT mix or use IELTS Band Scores (0-9) for this general practice session. Evaluate strictly using CEFR levels (A1, A2, B1, B2, C1, C2) and Cambridge ESOL's 5 Oral Assessment Criteria: Range, Accuracy, Fluency, Interaction, and Coherence.

            ${accuracyRules}

            Use the following exact Markdown format:

            ### 🎯 CEFR Oral Assessment (Cambridge Criteria)
            * **Goal Achievement:** [Did they meet their goal for this session? Be objective.]
            * **Estimated Level:** [CEFR Level: A1, A2, B1, B2, C1, or C2]
            * **Range Rating:** [CEFR Level: A1, A2, B1, B2, C1, or C2]
            * **Accuracy Rating:** [CEFR Level: A1, A2, B1, B2, C1, or C2]
            * **Fluency Rating:** [CEFR Level: A1, A2, B1, B2, C1, or C2]
            * **Interaction Rating:** [CEFR Level: A1, A2, B1, B2, C1, or C2]
            * **Coherence Rating:** [CEFR Level: A1, A2, B1, B2, C1, or C2]
            * **General Impression:** [Summary of overall performance based on Cambridge ESOL descriptors]

            ### ✅ Task Response & Topic Relevance
            * **Semantic Sub-prompt Analysis:** [Compare the student's answer against the specific requirements of the topic/prompt. Did they address EVERY sub-prompt or question asked by the tutor?]
            * **Task Response Deficiency:** [If they missed any part of the scenario's objective or ignored the tutor's questions, explicitly flag it here. If they answered everything, write "None - all prompt requirements addressed."]

            ### 🗣️ Fluency & Coherence
            * [Strict feedback on clarity, pacing, hesitations, and cohesive linking devices]
            * **Struggled Sounds/Words:** [Highlight 2-3 specific phonemes or actual words from transcript]
            * **Fillers & Hesitations:** [Identify thinking noises or filler words]
            * **Cohesive Connectors Used:** [Linking words used or missed]

            ### 📚 Range & Accuracy
            * [Strict feedback on range of vocabulary and grammatical accuracy]
            * **Corrections:** [Exact student quote -> Corrected version]
            * **New words to learn:** [2-3 useful advanced words/phrases for next time]

            ### 🤝 Interactive Communication
            * [Feedback on turn-taking, asking questions, initiating topics, and responding]

            ### 🚀 Next Steps
            * [Actionable tip 1]
            * [Actionable tip 2]
            * [Actionable tip 3]

            ### 🏋️ 1-Minute Actionable Drills
            * **Drill 1 (Sentence Correction):** Practice repeating: "Exact student mistake" -> "Corrected version"
            * **Drill 2 (Pronunciation/Vocab):** Practice saying <u>word</u> out loud 3 times.
            * **Drill 3 (Fluency Builder):** Express your opinion in 2 complete sentences without filler words.
        `;

        const ieltsFormat = `
            Provide a realistic, professional, and well-calibrated feedback report strictly aligned with official IELTS Speaking Band Descriptors (0-9).

            >>> CRITICAL FOR ADVANCED STUDENTS (AIMING FOR BAND 8.0 - 9.0) <<<
            If the student is performing at a high level (Band 7.0+), your feedback MUST heavily focus on pushing them to the absolute maximum scores (Band 8.0 and 9.0).
            To achieve Band 8.0 - 9.0, a student must demonstrate:
            - Lexical Resource: Skillful use of uncommon lexical items, idiomatic language, phrasal verbs, and precise collocations with native-like flair.
            - Grammatical Range: A wide range of complex structures used flexibly and naturally (e.g., cleft sentences, inversions, mixed conditionals) with almost no errors.
            - Fluency: Seamless, effortless use of cohesive devices (avoiding mechanical linking words like "firstly", "moreover").
            You MUST provide AT LEAST TWO highly specific "Advanced Structure/Idiom Upgrades" showing exactly how they could have rephrased their sentences to a Band 9.0 native level.
            >>> END CRITICAL FOR ADVANCED STUDENTS <<<

            ${accuracyRules}

            Use the following exact Markdown format:

            ### 🎯 IELTS Mock Assessment
            * **Estimated Band Score:** [Score 0.0 - 9.0 calculated accurately from sub-scores]
            * **Task Response Score:** [Sub-score 0.0 - 9.0]
            * **Fluency & Coherence Score:** [Sub-score 0.0 - 9.0]
            * **Lexical Resource Score:** [Sub-score 0.0 - 9.0]
            * **Grammatical Range & Accuracy Score:** [Sub-score 0.0 - 9.0]
            * **Pronunciation Score:** [Sub-score 0.0 - 9.0]
            * **General Impression:** [Balanced summary aligned with official Band Descriptors]

            ### ✅ Task Response & Topic Relevance
            * **Semantic Sub-prompt Analysis:** [Compare the student's answer against the specific requirements of the topic/prompt. Did they address EVERY sub-prompt?]
            * **Task Response Deficiency:** [If they missed any part of a multi-part question or cue card, explicitly flag it here (e.g., "You forgot to explain why it was important"). If they answered all parts, write "None - all prompt requirements addressed."]

            ### 🗣️ Fluency & Coherence
            * [Feedback on speaking at length, hesitation, and linking words]
            * **Fillers & Hesitations:** [Identify thinking noises or filler words]
            * **Native-Like Cohesion:** [Suggest natural discourse markers instead of mechanical ones]

            ### 📚 Lexical Resource
            * [Feedback on vocabulary range and word choice]
            * **Idioms & Collocations:** [Provide 1-2 highly specific idiomatic expressions or phrasal verbs they could have used for their exact topic to push towards Band 9]

            ### 📝 Grammatical Range & Accuracy
            * [Feedback on sentence structures and accuracy]
            * **Corrections:** [Exact student quote -> Corrected version]
            * **Complexity Upgrade (Band 8-9):** [Take a simple sentence the student said and rewrite it using an advanced structure like inversion, a relative clause, or a conditional]

            ### 🎤 Pronunciation
            * [Feedback on clarity, intonation, chunking]
            * **Struggled Sounds/Words:** [Specific words from transcript]

            ### 🚀 Next Steps to Mastery
            * [Actionable tip 1 - Focus on idiomatic/natural flow]
            * [Actionable tip 2 - Focus on complex grammar flexibility]
            * [Actionable tip 3 - Focus on pronunciation chunking/rhythm]

            ### 🏋️ 1-Minute Actionable Drills
            * **Drill 1 (Grammar Upgrade):** Say this aloud: "Original sentence" -> "Band 9 Advanced Rewrite"
            * **Drill 2 (Idiom Integration):** Practice using <u>[Advanced Idiom/Collocation]</u> in a response about [Topic].
            * **Drill 3 (Fluency Sprint):** Speak continuously for 30 seconds on a follow-up topic without using "um" or repetitive linking words.
        `;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: `
            The following transcript is a practice session between a ${context.targetLanguage || 'English'} language student and an AI tutor.
            
            Target CEFR Level: ${context.level}
            Target Language: ${context.targetLanguage || 'English'}
            Topic: ${context.topic}
            Student's Goal: ${context.objective}

            CRITICAL DIRECTIVES:
            1. DYNAMIC & SPECIFIC FEEDBACK: The feedback MUST be unique, highly specific to this exact transcript, and avoid repetitive generic advice. Do not use boilerplate praise. Cite exact, interesting things the student said.
            2. STT HALLUCINATION AWARENESS: The student's part of this transcript was generated by browser speech recognition, which is prone to homophone errors (e.g. "I bought a sheep" instead of "I bought a ship"). 
               DO NOT penalize the student for obvious speech recognition hallucinations if the context makes it clear what they actually meant. Evaluate their language skills based on the likely intended meaning.
            3. STRICTLY NO INVENTED WORDS: When highlighting errors or quoting the student, you MUST ONLY use words that actually appear in the [Student] lines of the transcript. Do not invent or hallucinate mistakes.
            4. INFERRING TASK ACHIEVEMENT ON GARBLED/MISSING STT: If the transcript is missing [Student] lines or heavily garbled due to STT failure, you MUST deduce whether they answered the prompt (Task Achievement) based entirely on how the [Tutor] responded to them (e.g., if the tutor says "You mentioned the color red", infer they talked about red).
            5. SEMANTIC COMPARISON FOR TASK RESPONSE: Carefully compare the student's transcript to the "Topic" prompts (e.g. bullet points in an IELTS Cue Card). You MUST verify that the student actually addressed every single sub-prompt. Explicitly flag omissions under "Task Response Deficiency".
            ${studentTurnsCount === 0 ? `6. MISSING STUDENT TRANSCRIPT: The transcript contains NO [Student] lines because the user's device did not support text transcription, even though they spoke. You MUST infer the conversation context from the Tutor's responses. Provide a helpful report based on what the Tutor said, and explicitly mention in the overall assessment that their exact words couldn't be transcribed.` : ""}

            --- CONVERSATION TRANSCRIPT ---
            ${transcriptToUse.join("\n")}
            -------------------------------

            ${isIELTS ? ieltsFormat : standardFormat}

            CRITICAL: Return the response as a JSON object with two fields:
            1. "markdownReport": A string containing the EXACT Markdown report requested above.
            2. "detectedErrors": An array of objects, each containing "original" (the student's mistake) and "correction" (the corrected version). Include ONLY the most critical 3-5 mistakes.
          `,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    markdownReport: { type: Type.STRING },
                    detectedErrors: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                original: { type: Type.STRING },
                                correction: { type: Type.STRING }
                            },
                            required: ["original", "correction"]
                        }
                    }
                },
                required: ["markdownReport", "detectedErrors"]
            }
          }
        });

        if (response.text && response.text.trim().length > 0) {
          try {
             const parsed = JSON.parse(response.text);
             const markdownRep = isIELTS ? processIELTSReportScores(parsed.markdownReport) : parsed.markdownReport;
             
             // Extract structured errors instead of relying on regex
             if (parsed.detectedErrors && Array.isArray(parsed.detectedErrors)) {
                 import("./errorBank").then(({ getErrorBank, saveErrorBank }) => {
                     const currentBank = getErrorBank();
                     let addedCount = 0;
                     parsed.detectedErrors.forEach((err: any) => {
                         const original = err.original?.trim();
                         const correction = err.correction?.trim();
                         if (original && correction && original.toLowerCase() !== correction.toLowerCase()) {
                             const exists = currentBank.some((item) => item.original.toLowerCase() === original.toLowerCase());
                             if (!exists) {
                                 currentBank.unshift({
                                     id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                     original,
                                     correction,
                                     category: 'Grammar',
                                     timestamp: Date.now(),
                                     reviewCount: 0,
                                     mastered: false,
                                 });
                                 addedCount++;
                             }
                         }
                     });
                     if (addedCount > 0) {
                         saveErrorBank(currentBank.slice(0, 50));
                     }
                 });
             }
             
             return markdownRep;
          } catch(e) {
             console.error("Failed to parse JSON report from Gemini", e);
             // Fallback to text if parsing fails (though responseSchema makes this unlikely)
             return response.text;
          }
        }
      } catch (err: any) {
        lastErr = err;
        attempt++;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    return buildSavedReport();
  }

  stop() {
    this.isUserActiveSession = false;
    this.isConnected = false;

    this.audioProcessor.stop();
    this.audioPlayer.stop();

    if (this.session) {
      try {
        this.session.close();
      } catch (e) {}
      this.session = null;
    }

    if (this.recognition) {
      this.recognition.onend = null;
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }

    if (this.currentStream) {
      try {
        this.currentStream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      this.currentStream = null;
    }
  }
}
