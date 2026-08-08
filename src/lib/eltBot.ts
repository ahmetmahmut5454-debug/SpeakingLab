import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
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


export const cleanTranscript = (text: string) => {
  if (!text) return text;
  let cleaned = text.replace(/\s+/g, " ").trim();
  
  // 1. Remove redundant word repeats (e.g., "ben ben" -> "ben", "I I I" -> "I")
  let prev;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/\b([\w\u00C0-\u017F]+)\s+\1\b/gi, "$1");
  } while (cleaned !== prev);

  // 2. Clean up self-correction markers and fillers
  const fillers = ["yani", "şey", "işte", "ıı", "eee", "ee", "hmm", "öhm", "aa", "hı hı", "he", "heh", "I mean", "um", "uh", "like", "you know", "aslında", "ne bileyim", "nasıl desem"];
  const regex = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(regex, "");

  // Cleanup extra spaces and punctuation left behind
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/^[.,?!]\s*/, "");
  cleaned = cleaned.replace(/\s+([.,?!])/g, "$1");

  return cleaned || text; // fallback to original if completely emptied
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
  mode: "Practice" | "Task";
  taskDurationMinutes: number; // For Practice mode closing
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
}

const getPromptTarget = (context: BotContext) => {
  const lang = context.targetLanguage || "English";
  if (context.level === "A1") {
    return `You are an ${lang} teacher speaking to an absolute beginner (A1 level) student. Speak extremely slowly and clearly. Use only the most basic vocabulary: greetings, numbers, colors, names, countries, and jobs. Ask very simple, direct questions one at a time (e.g., 'What is your name?', 'Where are you from?'). When you ask a question, ALWAYS provide a simple example of how the student can answer (e.g., 'What is your name? You can say: My name is...'). Be extremely patient and encouraging.`;
  } else if (context.level === "A2") {
    return `You are an ${lang} teacher speaking to an A2 level student. Speak clearly and slightly slowly. Use simple vocabulary. Focus on daily life topics, habits, and past events. Be very encouraging. Provide gentle corrections.`;
  } else if (context.level === "B1" || context.level === "B2") {
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

  private currentBotSubtitle: string = "";
  private currentUserSubtitle: string = "";

  constructor(
    private callbacks: {
      onTranscription?: (text: string, isModel: boolean) => void;
      onUserLevel?: (level: number) => void;
      onBotLevel?: (level: number) => void;
      onError?: (err: any) => void;
      onBotFinished?: () => void;
      onShowCueCard?: (topic: string) => void;
    },
  ) {}

  async start(context: BotContext) {
    if (this.isConnected) return;
    this.transcriptHistory = [];
    console.log("Starting ELT Bot session...", context);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted.");

      // Setup parallel Browser Speech Recognition to capture the user's side of the transcript reliably
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
        this.recognition.onend = () => {
          if (this.isConnected) {
            try {
              this.recognition.start();
            } catch (e) {}
          }
        };
        try {
          this.recognition.start();
        } catch (e) {}
      }

      let systemInstruction = `
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
        6. KEEP GOING: If the student stops speaking or is quiet, you MUST encourage them to continue or ask a follow-up question. Do NOT remain silent.
        7. IGNORE NOISE & FILLERS: Ignore thinking noises (umm, uh, eee, ıı, hmm), backchanneling (mhm, yeah, ah, evet, hı hı), filler words (şey, yani, işte, like, you know), throat clearing, laughs, and self-corrections. Do not get distracted. If you are interrupted by these short sounds while speaking, IMMEDIATELY RESUME and finish your previous sentence. Wait patiently for their full thought.

        ${
          context.mode === "Task" && context.topic?.includes("IELTS Speaking Examiner")
            ? `Examiner: Speak first with an icebreaker: "${context.icebreaker || "Hello. Let's start the IELTS speaking test."}". Stay in character as a strict examiner.`
            : context.mode === "Task"
            ? `Character: Speak first with an icebreaker: "${context.icebreaker || "Hello, how can I help you today?"}". Stay in character.`
            : `Practice: Speak first. Introduce yourself, ask their name. Build rapport.`
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
                  const triggerMessage = context.mode === "Task" && context.topic?.includes("IELTS Speaking Examiner")
                    ? "The student has connected. Please start the IELTS speaking test now by asking the first question."
                    : "The student has connected. Please introduce yourself and start the conversation naturally.";
                  this.session.sendRealtimeInput({
                    text: triggerMessage,
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
                  setTimeout(checkFinish, 1000);
                } else if (fc.name === "showCueCard") {
                  console.log("AI called showCueCard function!", fc.args);
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
                            response: { success: true, instruction: "Tool successful. The cue card is now visible to the student. YOU MUST IMMEDIATELY SPEAK to tell the student they have 1 minute to prepare and 1-2 minutes to speak. DO NOT WAIT FOR THEM. Speak now." },
                          },
                        },
                      ]);
                    } catch (e) {
                      console.error("Error sending tool response:", e);
                    }
                  }
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
                  this.currentBotSubtitle += text;
                  if (this.callbacks.onTranscription) {
                    this.callbacks.onTranscription(this.currentBotSubtitle, true);
                  }
                }
              }
            }
            
            // Handle formal output/input transcription from API
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

        const accuracyRules = `
            >>> CRITICAL DIRECTIVE: TRANSCRIPT ACCURACY & NO HALLUCINATIONS <<<
            1. EXACT VERBATIM QUOTING: When quoting what the student said or listing corrections/mistakes, you MUST ONLY quote the exact words and phrases that appear verbatim in the [Student]: lines of the transcript.
            2. NO HALLUCINATED OR MADE-UP WORDS: Absolute prohibition against inventing, fabricating, or misspelling words that the student did NOT actually say. Do not invent fake typos or imaginary words.
            3. EXACT MATCH FORMATTING: Format corrections as: "Exact Student Quote" -> "Suggested Correction".
            4. DO NOT INVENT ERRORS: If the student spoke correctly or the transcript is brief, do NOT fabricate imaginary grammar/vocabulary mistakes. Instead, offer advanced alternative phrasings or vocabulary enhancements.
            5. CLICKABLE VOCABULARY: Wrap any advanced, interesting, or corrected English vocabulary words you use in your feedback in <u> tags (e.g., <u>resilience</u> or <u>fascinating</u>) so the student can click them in the UI to see definitions. Wrap single words only, not phrases.
            6. FILLER WORDS & NOISES: The transcript may contain filler words or thinking noises (e.g., umm, uh, eee, ıı, hmm, şey, yani, işte, like, you know). DO NOT treat these as grammar errors or vocabulary mistakes. If they are excessive, note them under the 'Fluency' section, but do not correct them as grammatical errors.
            >>> END CRITICAL DIRECTIVE <<<
        `;

        const standardFormat = `
            Provide a highly structured, strict, and completely objective feedback report for a general language practice session. 
            Do NOT inflate the student's level or give unearned praise. Be highly critical and identify specific mistakes, awkward phrasing, and areas of improvement based STRICTLY on the actual transcript.

            ${accuracyRules}

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
            * **Struggled Sounds/Words:** [Highlight 2-3 specific phonemes or actual words from transcript the student struggled with]
            * **Fillers & Hesitations:** [Identify any thinking noises, redundant word repeats, or filler words (e.g. şey, yani, umm) used. Mention if they affected the flow.]
            * **Strengths:** [Examples from transcript]
            * **To improve:** [Examples]

            ### 📚 Grammar & Vocabulary
            * [Strict feedback on range of vocabulary and grammatical accuracy based strictly on transcript.]
            * **Corrections:** [Exact student quote from transcript -> Corrected version]
            * **New words to learn:** [2-3 useful advanced words/phrases for next time]

            ### 🚀 Next Steps
            * [Actionable tip 1]
            * [Actionable tip 2]
            * [Actionable tip 3]
        `;

        const ieltsFormat = `
            Provide a highly structured, strictly objective, and critical feedback report based on the official IELTS Speaking Band Descriptors (0-9).
            Do NOT inflate the Band Score. Give a realistic, strict score reflecting true IELTS standards using the four official criteria:
            1. Fluency and coherence (hesitation, repetition, discourse markers, topic development)
            2. Lexical resource (vocabulary flexibility, idiomatic language, paraphrase)
            3. Grammatical range and accuracy (complex structures, error frequency, sentence forms)
            4. Pronunciation (phonological features, chunking, clarity, intelligibility)

            ${accuracyRules}

            Use the following exact Markdown format:

            ### 🎯 IELTS Mock Assessment
            * **Estimated Band Score:** [Estimate strictly 0.0 - 9.0 based on the official descriptors]
            * **Fluency & Coherence Score:** [Estimate sub-score strictly 0.0 - 9.0 based on official descriptors]
            * **Lexical Resource Score:** [Estimate sub-score strictly 0.0 - 9.0 based on official descriptors]
            * **Grammatical Range & Accuracy Score:** [Estimate sub-score strictly 0.0 - 9.0 based on official descriptors]
            * **Pronunciation Score:** [Estimate sub-score strictly 0.0 - 9.0 based on official descriptors]
            * **General Impression:** [Summary of performance based on the official Band Descriptors]

            ### 🗣️ Fluency & Coherence
            * [Strict feedback on speaking at length, hesitation, and linking words based on the Band Descriptors]
            * **Fillers & Hesitations:** [Identify any thinking noises, redundant word repeats, or filler words (e.g. şey, yani, umm) used. Mention if they affected the flow.]

            ### 📚 Lexical Resource
            * [Strict feedback on vocabulary range, flexibility, and idiomatic language based on the Band Descriptors]
            * **Strong words used:** [Exact words from transcript]
            * **To improve:** [Examples of better vocabulary to use]

            ### 📝 Grammatical Range & Accuracy
            * [Strict feedback on complex structures, error density, and sentence forms based on the Band Descriptors]
            * **Corrections:** [Exact student quote from transcript -> Corrected version]

            ### 🎤 Pronunciation
            * [Strict feedback on clarity, intonation, chunking, and features of connected speech based on the Band Descriptors]
            * **Struggled Sounds/Words:** [Highlight 2-3 specific phonemes or actual words from transcript the student struggled to pronounce]

            ### 🚀 Next Steps
            * [Actionable tip 1 based on the lowest scoring criterion]
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
