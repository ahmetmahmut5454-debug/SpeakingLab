import { GoogleGenAI, Type } from "@google/genai";
import { AudioProcessor, AudioPlayer } from "./audioManager";
import { getErrorBank, saveErrorBank } from "./errorBank";

export const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || "proxy_key";
const getAiClient = () => {
    const key = getApiKey();
    if (key !== "proxy_key") {
        return new GoogleGenAI({ apiKey: key });
    }
    const host = typeof window !== "undefined" ? (window.location.host || "localhost:3000") : "localhost:3000";
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "https:" : "http:";
    return new GoogleGenAI({ 
        apiKey: key, 
        httpOptions: { baseUrl: `${protocol}//${host}` } 
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
    const history = [...this.transcriptHistory];
    if (this.currentUserSubtitle.trim().length > 0) {
      history.push(`[Student]: ${cleanTranscript(this.currentUserSubtitle.trim())}`);
    }
    if (this.currentBotSubtitle.trim().length > 0) {
      history.push(`[Tutor]: ${this.currentBotSubtitle.trim()}`);
    }
    return history;
  }

  async start(context: BotContext) {
    this.transcriptHistory = [];
    this.currentBotSubtitle = "";
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
      
      if (context.mode === "IELTS" || (context.topic && context.topic.includes("IELTS Speaking Examiner"))) {
        const scenarioTopic = context.studentBriefing || context.topic || "IELTS Speaking Assessment";
        const scenarioGuidelines = context.objective || `
- Part 1 (Introduction & Interview): Ask 2-3 introductory questions about ${scenarioTopic}. Ask ONE question at a time. After the student answers, acknowledge and immediately ask the next question.
- Part 2 (Long Turn / Cue Card): Call the showCueCard tool to display the cue card, then say aloud: "Now I will give you a topic. You have one minute to prepare, and then speak for one to two minutes." Wait for their speech.
- Part 3 (Discussion): Ask 2-3 deeper, abstract questions exploring the themes related to Part 2.
- Conclude: Thank the candidate warmly at the end.`;

        systemInstruction = `
You are an official, professional, and attentive IELTS Speaking Examiner.
Target Candidate Level: CEFR ${context.level || "B2"}.
Assigned Test Topic: "${scenarioTopic}"
Target Language: ${context.targetLanguage || "English"}

SCENARIO SPECIFICATIONS & SCRIPT:
${scenarioGuidelines}

CRITICAL RULES FOR THE EXAMINER:
1. FOCUS ON THE SPECIFIED TOPIC: Do NOT default to questions about houses, accommodation, or apartments unless that is explicitly the topic in the scenario guidelines above. Follow the scenario topic ("${scenarioTopic}").
2. NEVER GO SILENT: When the candidate finishes speaking, YOU MUST immediately speak next. Acknowledge what they said with a natural examiner response ("Thank you", "That's very interesting", "I understand") and immediately ask the next question or introduce the next part.
3. ONE QUESTION AT A TIME: Never ask multiple questions in a single turn. Ask one question, then pause for the student's answer.
4. DO NOT END THE CONVERSATION PREMATURELY: Never call endConversation after just one or two turns. You must progress through Part 1, Part 2, and Part 3. Only when all parts are finished or if the candidate explicitly requests to stop, say "Thank you, that is the end of the speaking test." and then you may call endConversation.
5. SPEAK NATURALLY: Never output internal thoughts or instructions. Speak only what a real human IELTS examiner would say aloud.
`;
      } else if (context.mode === "Task") {
        systemInstruction = `
You are an English language tutor and conversation partner playing the role: "${context.role || "Tutor"}".
Student CEFR Level: ${context.level || "B1"}.
Scenario: "${context.topic || "English practice"}"
Student Briefing: "${context.studentBriefing || context.topic || ""}"
Objective:
${context.objective || "Engage in natural conversation based on the scenario."}

CRITICAL RULES:
1. Stay in character and follow the scenario.
2. Ask one question or prompt at a time. Keep responses concise and engaging.
3. When the user finishes speaking, ALWAYS respond promptly to keep the conversation flowing.
4. Do NOT output internal thoughts. Speak naturally.
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
        model: "gemini-3.8-live",
        callbacks: {
          onopen: () => {
            
            this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Speech recognition removed due to mic hijacking
            
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
                    let triggerMessage: string;
                    if (context.icebreaker) {
                      triggerMessage = `SYSTEM MESSAGE: The student has connected. Greet the candidate and start the session by saying: "${context.icebreaker}"`;
                    } else if (context.mode === "IELTS" || context.topic?.includes("IELTS Speaking Examiner")) {
                      const topicName = context.studentBriefing || context.topic || "the assigned topic";
                      triggerMessage = `SYSTEM MESSAGE: The candidate has entered the examination room. Please start Part 1 of the IELTS Speaking Test immediately on the topic of "${topicName}" by asking the first question in ${targetLangForTrigger}.`;
                    } else {
                      triggerMessage = `SYSTEM MESSAGE: The student has connected. Please introduce yourself and start the conversation naturally in ${targetLangForTrigger}.`;
                    }
                    
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
                  // Only allow ending if at least 4 turns have occurred
                  if (this.transcriptHistory.length < 4) {
                    console.warn("Ignoring premature endConversation on turn", this.transcriptHistory.length);
                    if (this.session && this.isConnected) {
                      try {
                        this.session.sendToolResponse({
                          functionResponses: [{
                            name: "endConversation",
                            id: fc.id,
                            response: { success: false, instruction: "Do not end the test yet. Please proceed with the next question in the test." }
                          }]
                        });
                      } catch (e) {}
                    }
                    continue;
                  }
                  
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
                      this.session.sendToolResponse({
                        functionResponses: [{
                          name: "showCueCard",
                          id: fc.id,
                          response: {
                            success: true,
                            instruction: "The cue card is now displayed on the candidate's screen. Immediately speak aloud to the candidate: tell them they have 1 minute to think and 1-2 minutes to speak on this topic, and invite them to begin."
                          }
                        }]
                      });
                    } catch (e) {}
                  }
                }
              }
            }
            if (message.serverContent?.interrupted) {
              this.audioPlayer.clear();
            }

            // Real-time student transcription from Gemini Live
            const inTrans = message.serverContent?.inputTranscription;
            if (inTrans?.text) {
              this.currentUserSubtitle += inTrans.text;
              if (this.callbacks.onTranscription) {
                this.callbacks.onTranscription(this.currentUserSubtitle, false);
              }
              if (inTrans.finished) {
                if (this.currentUserSubtitle.trim().length > 0) {
                  this.transcriptHistory.push(`[Student]: ${cleanTranscript(this.currentUserSubtitle.trim())}`);
                  this.currentUserSubtitle = "";
                }
              }
            }

            // When tutor starts speaking, commit any pending student speech
            if (message.serverContent?.modelTurn?.parts?.length) {
              if (this.currentUserSubtitle.trim().length > 0) {
                this.transcriptHistory.push(`[Student]: ${cleanTranscript(this.currentUserSubtitle.trim())}`);
                this.currentUserSubtitle = "";
              }
            }

            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  this.audioPlayer.playChunk(part.inlineData.data, (level: any) => {
                    this.callbacks.onBotLevel?.(level / 1.5);
                  });
                }
                const text = part.text;
                if (text && typeof text === "string" && !part.thought) {
                  this.currentBotSubtitle += text;
                  if (this.callbacks.onTranscription) {
                    this.callbacks.onTranscription(this.currentBotSubtitle, true);
                  }
                }
              }
            }
            if (message.serverContent?.turnComplete) {
              if (this.currentBotSubtitle.trim().length > 0) {
                this.transcriptHistory.push(`[Tutor]: ${this.currentBotSubtitle.trim()}`);
                this.currentBotSubtitle = "";
              }
            }
            const outTrans = message.serverContent?.outputTranscription || message.serverContent?.outputAudioTranscription;
            if (outTrans?.text) {
              const text = outTrans.text;
              if (!this.currentBotSubtitle.includes(text.trim())) {
                this.currentBotSubtitle += text;
              }
              if (this.callbacks.onTranscription) {
                this.callbacks.onTranscription(this.currentBotSubtitle, true);
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
          inputAudioTranscription: {},
          outputAudioTranscription: {},
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
                  description: "Call this tool ONLY when the entire test or conversation has naturally and fully concluded with a farewell, or if the student explicitly asks to stop. NEVER call this after just one or two turns.",
                },
                ...(context.mode === "IELTS" || context.topic?.includes("IELTS") ? [{
                  name: "showCueCard",
                  description: "Call this function to show the Part 2 cue card to the student. ONLY call this when you have just introduced Part 2 and are ready to give the student their topic. Provide a short phrase describing the cue card topic.",
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
    if (this.currentUserSubtitle.trim().length > 0) {
      this.transcriptHistory.push(`[Student]: ${cleanTranscript(this.currentUserSubtitle.trim())}`);
      this.currentUserSubtitle = "";
    }
    if (this.currentBotSubtitle.trim().length > 0) {
      this.transcriptHistory.push(`[Tutor]: ${this.currentBotSubtitle.trim()}`);
      this.currentBotSubtitle = "";
    }
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

  private processCorrectionsFromReport(markdownRep: string) {
    const jsonMatch = markdownRep.match(/```json\s*([\s\S]*?)\s*```/);
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
  }

  async generateReport(context: BotContext, transcriptOverride?: any): Promise<string> {
    const transcript = transcriptOverride || this.transcript;
    if (!transcript || transcript.length === 0) return "No transcript available.";
    
    const transcriptText = transcript.join("\n");

    // 1. Try server-side generation route if available
    try {
      const host = typeof window !== "undefined" ? (window.location.host || "localhost:3000") : "localhost:3000";
      const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "https:" : "http:";
      const endpoint = `${protocol}//${host}/api/generate-report`;
      const serverRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, transcript: transcriptText })
      });
      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.report && typeof data.report === "string" && !data.report.includes("❌")) {
          this.processCorrectionsFromReport(data.report);
          return data.report;
        }
      }
    } catch (e) {
      // Backend route unreachable, fallback to client-side SDK
    }
    
    // 2. Client-side SDK generation
    const ai = getAiClient();
    const models = ["gemini-3.8-flash", "gemini-2.5-flash"];
    const isIelts = context.mode === "IELTS" || !!(context.topic && context.topic.includes("IELTS"));
    
    const prompt = `
      You are an expert English Language Examiner and Senior Tutor.
      Analyze the following transcript of an English speaking practice session between a Student and a Tutor.
      
      Target Level: CEFR ${context.level}
      Mode: ${context.mode || "Practice"}
      Topic / Objective: ${context.topic || context.objective || "Conversational English"}
      
      Transcript:
      ${transcriptText}
      
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

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt
        });
        
        const markdownRep = response.text || "No feedback generated.";
        this.processCorrectionsFromReport(markdownRep);
        return markdownRep;
      } catch (err) {
        console.warn(`Model ${model} failed:`, err);
      }
    }
    
    return "Feedback report generated. Please check your practice history.";
  }
}
