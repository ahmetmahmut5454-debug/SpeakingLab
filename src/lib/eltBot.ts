import { GoogleGenAI, Type } from "@google/genai";
import { AudioProcessor, AudioPlayer } from "./audioManager";
import { getErrorBank, saveErrorBank } from "./errorBank";

export const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || "proxy_key";
const getAiClient = () => {
    const key = getApiKey();
    if (key !== "proxy_key") {
        return new GoogleGenAI({ apiKey: key });
    }
    return new GoogleGenAI({ 
        apiKey: key, 
        httpOptions: { baseUrl: window.location.protocol === "https:" ? `https://${window.location.host}` : `http://${window.location.host}` } 
    });
};

export type ProficiencyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type VoiceType = "Aoede" | "Charon" | "Fenrir" | "Kore" | "Puck";

export interface BotContext {
  level: ProficiencyLevel;
  mode: string;
  topic?: string;
  objective?: string;
  scenarioId?: string;
  voice?: VoiceType;
  pronunciationPracticeWord?: string;
  targetLanguage?: string;
  targetLanguageCode?: string;
  role?: string;
  icebreaker?: string;
  vocabulary?: string[];
  studentBriefing?: string;
  taskDurationMinutes?: number;
}

export const isIELTSSession = (context: BotContext) => {
  return context.mode === "IELTS" || !!(context.topic && context.topic.includes("IELTS"));
};








export const cleanTranscript = (text: string) => {
  if (!text) return text;
  let cleaned = text.replace(/\s+/g, " ").trim();
  let prev;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(/\b([\w\u00C0-\u017F]+)\s+\1\b/gi, "$1");
  } while (cleaned !== prev);
  const fillers = ["yani", "şey", "işte", "ıı", "eee", "ee", "hmm", "öhm", "aa", "hı hı", "he", "heh", "I mean", "um", "uh", "like", "you know", "aslında", "ne bileyim", "nasıl desem"];
  const regex = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
  cleaned = cleaned.replace(regex, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/^[.,?!]\s*/, "");
  cleaned = cleaned.replace(/\s+([.,?!])/g, "$1");
  return cleaned || text;
};

export interface EltBotCallbacks {
  onUserLevel?: (level: number) => void;
  onBotLevel?: (level: number) => void;
  onTranscription?: (text: string, isBot: boolean) => void;
  onBotFinished?: () => void;
  onShowCueCard?: (topic: string) => void;
  onReportReady?: (report: string) => void;
  onError?: (err: any) => void;
}

export class EltBot {
  private callbacks: EltBotCallbacks;
  private session: any = null;
  public isConnected: boolean = false;
  private currentStream: MediaStream | null = null;
  private audioProcessor: any = null;
  private audioPlayer: any = null;
  private transcriptHistory: string[] = [];
  private currentBotSubtitle: string = "";
  private recognition: any = null;
  private currentUserSubtitle: string = "";
  private reconnectAttempts: number = 0;

  constructor(callbacks: EltBotCallbacks) {
    this.callbacks = callbacks;
    
    // Minimal mock for audioPlayer to prevent crashes if we lost the real one.
    // In the real file this imported audioManager or used an Audio class.
    // Actually, I can just use a generic audio context player or null for now.
    // The previous code had `this.audioPlayer.isPlaying`. Let's mock it.
    this.audioPlayer = new AudioPlayer();
  }

  get transcript() {
    return this.transcriptHistory;
  }

  async start(context: BotContext) {
    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const stream = this.currentStream;
      if (!this.audioProcessor) {
        this.audioProcessor = new AudioProcessor();
      }
      let systemInstruction = `
        You are an IELTS Speaking Examiner and English Tutor.
        You are talking with a student at CEFR ${context.level}.
        Keep your responses conversational and natural.
      `;
      
      if (context.mode === "IELTS") {
        systemInstruction = `
          You are an official IELTS Speaking Examiner. Conduct a strict but fair IELTS speaking test.
          The user's target level is roughly ${context.level}.
          DO NOT type out your instructions or internal thoughts. Speak naturally.
        `;
      } else if (context.mode === "Pronunciation" && context.pronunciationPracticeWord) {
        systemInstruction = `
          You are an English pronunciation tutor. The student wants to practice pronouncing the word "${context.pronunciationPracticeWord}".
          CRITICAL INSTRUCTIONS FOR THIS SESSION:
          1. Your very first response must be to simply say the word "${context.pronunciationPracticeWord}" clearly and slowly, and then ask the user to "Repeat after me". Do not say anything else in the first turn.
          2. Listen carefully to their pronunciation.
          3. Give immediate, specific feedback on how to improve, or praise them if they get it right.
          4. Keep your responses very brief, supportive, and focused only on this word.
          5. Call the endConversation tool when the user successfully pronounces the word or after 3 attempts.
        `;
      } else {
         // Free practice conversational improvements
         systemInstruction = `
          You are a highly engaging, curious, and natural conversation partner. 
          The user's target level is roughly ${context.level}.
          Always keep the conversation flowing proactively. Ask interesting follow-up questions.
          Do NOT be passive. Drive the conversation forward enthusiastically.
          DO NOT type out your instructions or internal thoughts. Speak naturally.
         `;
      }

      const ai = getAiClient();
      this.session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            
            this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Initialize Speech Recognition for User Transcript
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = context.targetLanguageCode || 'en-US';
          
          this.recognition.onresult = (event: any) => {
            let interimTranscript = "";
            let finalTranscript = "";
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
                this.transcriptHistory.push(`[Student]: ${event.results[i][0].transcript.trim()}`);
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            
            if (this.callbacks.onTranscription) {
              if (finalTranscript) {
                this.callbacks.onTranscription(finalTranscript, false);
              } else if (interimTranscript) {
                this.callbacks.onTranscription(interimTranscript, false);
              }
            }
          };
          
          this.recognition.onend = () => {
             if (this.isConnected) {
                try { this.recognition.start(); } catch(e) {}
             }
          };
          
          this.recognition.start();
        }
      } catch(e) {
        console.error("Speech recognition error:", e);
      }
            
            this.audioProcessor.start(
              stream,
              (data: any) => {
                if (this.session && this.isConnected) {
                  try {
                    this.session.sendRealtimeInput({ audio: { data, mimeType: "audio/pcm;rate=16000" } });
                  } catch (e) {
                    console.error("Error sending audio frame:", e);
                  }
                }
              },
              (level: any) => {
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
                    
                    this.session.sendClientContent({ turns: [{ role: "user", parts: [{ text: triggerMessage }] }], turnComplete: true });
                  } catch (e) {}
                }
              }, 500);
            }
          },
          onmessage: async (message: any) => {
            



            const functionCalls = message.toolCall?.functionCalls || [];
            const altParts = message.serverContent?.modelTurn?.parts || [];
            for (const p of altParts) {
              if (p.functionCall) functionCalls.push(p.functionCall);
            }
            if (functionCalls.length > 0) {
              for (const fc of functionCalls) {
                if (fc.name === "endConversation") {
                  
                  if (this.session && this.isConnected) {
                    try {
                      this.session.sendToolResponse({ functionResponses: [{ name: "endConversation", id: fc.id, response: { success: true } }] });
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
                    this.callbacks.onShowCueCard(fc.args.topic);
                  }
                  if (this.session && this.isConnected) {
                    try {
                      this.session.sendToolResponse({ functionResponses: [{ name: "showCueCard", id: fc.id, response: { success: true, instruction: "Tool successful." } }] });
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
                  this.audioPlayer.playChunk(part.inlineData.data, (level: any) => {
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
            const outTrans = message.serverContent?.outputTranscription || message.serverContent?.outputAudioTranscription;
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
          },
          onerror: (error: any) => { 
                console.error("Live session error:", error); 
                this.isConnected = false; 
                let msg = "Connection Error.";
                if (error instanceof Event) {
                    msg = "WebSocket Error. Check your API Key or Network.";
                } else if (error && error.message) {
                    msg = error.message;
                }
                const key = getApiKey();
                msg += " (Key starts with: " + (key ? key.substring(0, 5) : "none") + ")";
                
                if (this.callbacks.onError) this.callbacks.onError(msg); 
                this.handleUnexpectedDisconnect(); 
            },
          onclose: (e: any) => { console.log("Gemini Live session closed."); this.isConnected = false; this.handleUnexpectedDisconnect(); },
        },
        config: {
          
          responseModalities: ["AUDIO"] as any,
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: context.voice || (context.level === "C1" ? "Charon" : "Puck"),
              }
            }
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "endConversation",
                  description: "Call this when the conversation naturally concludes.",
                  // no parameters needed for endConversation,
                },
                ...(context.mode === "IELTS" || context.topic?.includes("IELTS") ? [{
                  name: "showCueCard",
                  description: "Call this function to show the Part 2 cue card to the student. ONLY call this when you have just introduced Part 2 and are ready to give the student their topic. Provide a short, generic topic string like 'A memorable holiday'.",
                  parameters: { type: Type.OBJECT, properties: { topic: { type: Type.STRING, description: "A short phrase describing the topic" } }, required: ["topic"] },
                }] : [])
              ],
            },
          ],
        },
      });
    } catch (err) { console.error("Error starting EltBot", err); if (this.callbacks.onError) this.callbacks.onError(err); throw err; }
  }

  handleUnexpectedDisconnect() {
    
    if (this.callbacks.onBotFinished) {
      this.callbacks.onBotFinished();
    }
  }

  stop() {
    this.isConnected = false;
    if (this.session) {
      try { this.session.close(); } catch(e) {}
      this.session = null;
    }
    if (this.audioProcessor) {
      try { this.audioProcessor.stop(); } catch(e) {}
    }
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(t => t.stop());
      this.currentStream = null;
    }
    this.audioPlayer.clear();
  }

  sendHintRequest() {
    if (this.session && this.isConnected) {
      try {
        
        this.session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "System Note: The student has been silent. Provide EXACTLY ONE short example sentence of what they could say to help them." }] }], turnComplete: true });
      } catch (e) {
        console.error("Failed to send hint request:", e);
      }
    }
  }

  async generateReport(context: BotContext, transcriptOverride?: any): Promise<string> {
    const transcript = transcriptOverride || this.transcriptHistory;
    if (!transcript || transcript.length === 0) return "No transcript available.";
    
    const transcriptText = transcript.join("\n");
    
    // We will use standard Gemini generateContent to evaluate the student
    const ai = getAiClient();
    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
    
    const prompt = `
      You are an expert English evaluator. Review the following transcript of a spoken English session.
      The student's target level is CEFR ${context.level}.
      Mode: ${context.mode}.
      
      Generate a comprehensive evaluation report in Markdown format.
      Include sections for:
      - Overall Impression
      - Grammar & Vocabulary
      - Fluency & Pronunciation
      
      AT THE VERY END OF YOUR REPORT, include a strict JSON block wrapped in \`\`\`json containing any grammar corrections you found in the student's speech.
      Example:
      \`\`\`json
      {
        "corrections": [
          {"original": "I goes to school", "correction": "I go to school"}
        ]
      }
      \`\`\`
      If there are no major corrections, return an empty array for corrections.
      
      Transcript:
      ${transcriptText}
    `;

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt
        });
        
        const markdownRep = response.text || "No feedback generated.";
        
        // Extract JSON
        const jsonMatch = markdownRep.match(/\`\`\`json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const data = JSON.parse(jsonMatch[1]);
            if (data.corrections && Array.isArray(data.corrections)) {
               const currentBank = getErrorBank();
               let addedCount = 0;
               data.corrections.forEach((c: any) => {
                   if (!c.original || !c.correction) return;
                   const original = String(c.original).toLowerCase().trim();
                   const correction = String(c.correction).trim();
                   if (original.length > 0 && correction.length > 0) {
                       const exists = currentBank.some((item: any) => item.original === original);
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
            }
          } catch(e) {
            console.error("Failed to parse JSON corrections", e);
          }
        }
        
        return markdownRep;
      } catch (err) {
        console.warn(`Model ${model} failed:`, err);
      }
    }
    
    return "Error generating report. AI models might be overloaded.";
  }
}
