import { GoogleGenAI, Type } from "@google/genai";
import { AudioProcessor, AudioPlayer } from "./audioManager";
import { getErrorBank, saveErrorBank } from "./errorBank";
import { processIELTSReportScores } from "./mastery";

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
  return (
    context.mode === "IELTS" ||
    !!(context.topic && context.topic.toLowerCase().includes("ielts")) ||
    !!(context.scenarioId && context.scenarioId.toLowerCase().includes("ielts")) ||
    !!(context.studentBriefing && context.studentBriefing.toLowerCase().includes("ielts"))
  );
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
      
      if (isIELTSSession(context)) {
        const scenarioTopic = context.studentBriefing || context.topic || "IELTS Speaking Assessment";
        const scenarioGuidelines = context.objective || `
- Part 1 (Introduction & Interview): Ask 2-3 introductory questions about ${scenarioTopic}. Ask ONE question at a time. After the student answers, acknowledge and immediately ask the next question.
- Part 2 (Long Turn / Cue Card): Call the showCueCard tool to display the cue card, then say aloud: "Now I will give you a topic. You have one minute to prepare, and then speak for one to two minutes." Wait for their speech.
- Part 3 (Discussion): Ask 2-3 deeper, abstract questions exploring the themes related to Part 2.
- Conclude: Thank the candidate warmly at the end.`;

        systemInstruction = `
You are an official, professional, and attentive IELTS Speaking Examiner conducting an authentic IELTS Speaking Test.
Target Candidate Level: CEFR ${context.level || "B2"}.
Assigned Test Topic: "${scenarioTopic}"
Target Language: ${context.targetLanguage || "English"}

OFFICIAL IELTS SPEAKING TEST PHASES & PROTOCOL:

PHASE 0: GREETING & CANDIDATE IDENTITY CHECK (MANDATORY AT TEST START)
- In a real IELTS speaking test, the examiner NEVER begins with Part 1 or questions about the topic immediately.
- Turn 1: Welcome the candidate professionally, state your examiner name, and ask for their full name:
  "Good morning [or Good afternoon]. My name is Alex Turner. Could you tell me your full name, please?"
- Turn 2: When the candidate states their name, acknowledge it and ask a brief identity confirmation question:
  "Thank you. And what can I call you?" (or "Thank you. And where are you from?")
- Turn 3: When the candidate answers, smoothly transition to the interview:
  "Thank you, that's fine. Now, in this first part of the test, I'd like to ask you some questions about yourself. Let's talk about..."

PHASE 1: PART 1 — INTRODUCTION & INTERVIEW (TOPIC QUESTIONS)
- Introduce the topic: "Let's talk about [Topic]..."
- Ask 2-3 questions about the assigned topic ("${scenarioTopic}"), strictly ONE question at a time.
- After each candidate answer, acknowledge naturally ("Thank you", "I see", "Right", "That's interesting") and ask the next question.
- Do NOT jump across unrelated topics abruptly; ask natural follow-ups or standard Part 1 questions.

PHASE 2: PART 2 — INDIVIDUAL LONG TURN (CUE CARD)
- Introduce Part 2 clearly:
  "Now I am going to give you a topic, and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you are going to say."
- Call the showCueCard tool to display the cue card on the candidate's screen.
- Say aloud: "Here is your topic. You have one minute to prepare, and then please speak for one to two minutes. Please begin when you are ready."
- Let the candidate speak without interrupting. If they stop too soon, prompt gently: "Can you tell me any more about that?"

PHASE 3: PART 3 — TWO-WAY DISCUSSION
- Introduce Part 3:
  "We've been talking about [Topic], and I'd now like to discuss with you one or two more general questions related to this."
- Ask 2-3 deeper, abstract, and analytical questions exploring broader themes related to Part 2.
- ONE question at a time. Encourage the candidate to expand on their points.

PHASE 4: CONCLUSION
- Officially conclude:
  "Thank you very much. That is the end of the speaking test."
- Only after speaking this final conclusion aloud, call the endConversation tool.

SCENARIO TOPIC SPECIFICATIONS:
${scenarioGuidelines}

CRITICAL RULES FOR THE EXAMINER:
1. NEVER JUMP DIRECTLY INTO THE TOPIC AT THE START: Always start with Phase 0 (formal greeting, examiner name, asking the candidate for their full name, and what to call them). Only after this brief exchange should you transition to Part 1.
2. FOCUS ON THE SPECIFIED TOPIC FOR PART 1: Follow the scenario topic ("${scenarioTopic}").
3. ONE QUESTION AT A TIME: Never ask multiple questions in a single turn. Wait for the candidate to finish speaking.
4. NEVER GO SILENT: When the candidate finishes speaking, speak next immediately with a natural examiner acknowledgement and the next question or transition.
5. DO NOT GIVE MARKS OR FEEDBACK DURING THE TEST: Real examiners never give scores or corrections while testing.
6. SPEAK NATURALLY: Never output internal thoughts or instructions. Speak only what a real human IELTS examiner would say aloud.
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
                    const isIelts = isIELTSSession(context);
                    let triggerMessage: string;
                    if (isIelts) {
                      triggerMessage = `SYSTEM MESSAGE: The candidate has entered the examination room. You are an official IELTS Speaking Examiner. Do NOT jump directly into the topic. Start with Phase 0 (Examiner Introduction & Candidate Identity Check): Greet the candidate professionally, state your examiner name (e.g. "Good morning. My name is Alex Turner"), and ask: "Could you tell me your full name, please?". Do NOT mention or ask about the topic yet; wait for the candidate's name first.`;
                    } else if (context.icebreaker) {
                      triggerMessage = `SYSTEM MESSAGE: The student has connected. Greet the candidate and start the session by saying: "${context.icebreaker}"`;
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
                ...(isIELTSSession(context) ? [{
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
    const isIelts = isIELTSSession(context);

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
          const finalReport = isIelts ? processIELTSReportScores(data.report) : data.report;
          this.processCorrectionsFromReport(finalReport);
          return finalReport;
        }
      }
    } catch (e) {
      // Backend route unreachable, fallback to client-side SDK
    }
    
    // 2. Client-side SDK generation
    const ai = getAiClient();
    const models = ["gemini-3.8-flash", "gemini-2.5-flash"];
    
    const prompt = isIelts ? `
      You are an expert, certified IELTS Speaking Examiner.
      Conduct a comprehensive, accurate, and objective IELTS Speaking assessment of the candidate based on the official IELTS Speaking Band Descriptors (scale 0.0 - 9.0 in 0.5 increments).
      
      Candidate Target Level: ${context.level || "IELTS"}
      Test Topic / Cue Card: ${context.topic || context.studentBriefing || context.objective || "IELTS Mock Speaking Test"}
      
      Transcript of Speaking Test:
      ${transcriptText}
      
      Evaluation Guidelines:
      - Assess strictly across the 4 official IELTS criteria: Fluency and Coherence (FC), Lexical Resource (LR), Grammatical Range and Accuracy (GRA), and Pronunciation (P).
      - Award band scores on a 0.0 - 9.0 scale in 0.5 increments (e.g. 5.5, 6.0, 6.5, 7.0, 7.5, 8.0).
      - The Estimated Band Score MUST be the arithmetic average of the 4 sub-scores, rounded according to official IELTS rules (ending in .25 rounds up to .5; ending in .75 rounds up to next whole band).
      - Be objective and realistic: if candidate responses are brief or limited, evaluate based strictly on the evidence shown in the transcript while acknowledging the brief sample.
      - Disregard minor speech recognition (ASR) transcription slips or missing punctuation; focus on candidate's true spoken vocabulary, grammar, and communicative ability.
      
      You MUST structure the report with these EXACT Markdown section titles and bullet labels for automated score extraction:
      
      ### 1. Overall Performance & Level Assessment
      - **Estimated CEFR Level**: [A1 / A2 / B1 / B2 / C1 / C2]
      - **Estimated Band Score**: [X.X]
      - High-level analytical summary of the candidate's fluency, coherence, exam presence, and overall communicative effectiveness.
      
      ### 2. Official IELTS Criteria Breakdown
      - **Fluency & Coherence Score**: [X.X]
        - Detailed assessment of speech tempo, hesitation vs lexical search, discourse markers, connectors, and thematic development.
      - **Lexical Resource Score**: [X.X]
        - Detailed assessment of vocabulary range, precision, idiomatic expressions, collocations, and paraphrase flexibility.
      - **Grammatical Range & Accuracy Score**: [X.X]
        - Detailed assessment of sentence complexity, subordinate clauses, tense accuracy, and frequency of systematic grammatical errors.
      - **Pronunciation Score**: [X.X]
        - Detailed assessment of articulation clarity, rhythm, intonation, word stress, and phoneme comprehensibility.
      
      ### 3. Key Strengths
      - Highlight 2-3 genuine strengths with direct quotes or examples from the transcript.
      
      ### 4. High-Priority Actionable Advice
      - 2-3 concrete, high-impact IELTS preparation strategies to elevate the candidate to the next band level.
      
      AT THE VERY END OF YOUR REPORT, include a strict JSON block wrapped in \`\`\`json containing all specific grammar and vocabulary corrections for errors found in the student's speech:
      \`\`\`json
      {
        "corrections": [
          {"original": "incorrect student phrase", "correction": "natural correct alternative"}
        ]
      }
      \`\`\`
      If there are no major corrections, return an empty array for corrections: {"corrections": []}.
    ` : `
      You are an expert English Language Examiner and Senior Tutor.
      Analyze the following transcript of an English speaking practice session between a Student and a Tutor.
      
      Target Level: CEFR ${context.level}
      Mode: ${context.mode || "Practice"}
      Topic / Objective: ${context.topic || context.objective || "Conversational English"}
      
      Transcript:
      ${transcriptText}
      
      Generate a comprehensive, accurate, and constructive feedback report in Markdown format.
      Structure the report clearly with these EXACT Markdown section titles and bullet labels:
      
      ### 1. Overall Performance & Level Assessment
      - **Estimated CEFR Level**: [A1 / A2 / B1 / B2 / C1 / C2]
      - **Estimated Band Score**: [X.X]
      - High-level summary of the student's communicative ability, confidence, and coherence.
      
      ### 2. Core Criteria Breakdown
      - **Fluency & Coherence Score**: [X.X]
        - Speech rhythm, hesitation, ability to develop ideas, linking phrases.
      - **Lexical Resource Score**: [X.X]
        - Range, precision, idiom and collocation use.
      - **Grammatical Range & Accuracy Score**: [X.X]
        - Sentence structure variety, verb tenses, common errors.
      - **Pronunciation Score**: [X.X]
        - Clarity of speech, natural rhythm, articulation.
      
      ### 3. Key Strengths
      - Highlight 2-3 genuine strengths demonstrated by the student.
      
      ### 4. High-Priority Actionable Advice
      - 2-3 concrete, actionable recommendations for the student's next practice session.
      
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
        const finalReport = isIelts ? processIELTSReportScores(markdownRep) : markdownRep;
        this.processCorrectionsFromReport(finalReport);
        return finalReport;
      } catch (err) {
        console.warn(`Model ${model} failed:`, err);
      }
    }
    
    return "Feedback report generated. Please check your practice history.";
  }
}
