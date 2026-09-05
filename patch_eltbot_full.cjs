const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

const startIdx = code.indexOf('          if (this.transcriptHistory.length === 0) {');
const endIdx = code.indexOf('  get transcript() {');

const replacement = `          if (this.transcriptHistory.length === 0) {
            setTimeout(() => {
              if (this.session && this.isConnected) {
                try {
                  const targetLangForTrigger = context.targetLanguage || "English";
                  const triggerMessage = context.mode === "IELTS" || (context.mode === "Task" && context.topic?.includes("IELTS Speaking Examiner"))
                    ? \`SYSTEM MESSAGE: The student has connected. Please start the IELTS speaking test now by asking the first question in \${targetLangForTrigger}.\`
                    : \`SYSTEM MESSAGE: The student has connected. Please introduce yourself and start the conversation naturally in \${targetLangForTrigger}.\`;
                  
                  this.session.sendClientContent({
                    turns: triggerMessage,
                    turnComplete: true,
                  });
                } catch (e) {}
              }
            }, 500);
          } else {
             setTimeout(() => {
              if (this.session && this.isConnected) {
                try {
                  const historyContext = \`SYSTEM NOTE: Our network connection dropped, and we just reconnected. Here is the transcript of our conversation so far:\\n\\n\${this.transcriptHistory.join("\\n")}\\n\\nPlease smoothly continue the conversation from where we left off without explicitly mentioning the disconnect unless necessary.\`;
                  this.session.sendClientContent({
                    turns: historyContext,
                    turnComplete: true,
                  });
                } catch (e) {}
              }
            }, 500);
          }
        },
        onmessage: async (message) => {
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
                  this.callbacks.onShowCueCard(fc.args.topic);
                }
                if (this.session && this.isConnected) {
                  try {
                    this.session.sendToolResponse([
                      {
                        functionResponse: {
                          name: "showCueCard",
                          id: fc.id,
                          response: { success: true, instruction: "Tool successful. The cue card is now visible on the screen. Now briefly tell the student to take 1 minute to prepare, and to say 'I am ready' when they want to begin their 1-2 minute presentation." },
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
          
          const outTrans = message.serverContent?.outputTranscription || message.serverContent?.outputAudioTranscription;
          if (outTrans?.text) {
            const text = outTrans.text;
            this.currentBotSubtitle += text;
            if (this.callbacks.onTranscription) {
              this.callbacks.onTranscription(this.currentBotSubtitle, true);
            }
            if (outTrans.finished) {
              this.transcriptHistory.push(\`[Tutor]: \${this.currentBotSubtitle}\`);
              this.currentBotSubtitle = "";
            }
          }
        },
        onerror: (error) => {
          console.error("Live session error:", error);
          this.isConnected = false;
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
                parameters: {
                  type: 6,
                  properties: {},
                },
              },
              {
                name: "showCueCard",
                description:
                  "Call this function to show the Part 2 cue card to the student. ONLY call this when you have just introduced Part 2 and are ready to give the student their topic. Provide a short, generic topic string like 'A memorable holiday'. Do not put the whole instructions here.",
                parameters: {
                  type: 6,
                  properties: {
                    topic: {
                      type: 1,
                      description: "A short phrase describing the topic, e.g., 'A book you enjoyed reading recently'",
                    },
                  },
                  required: ["topic"],
                },
              },
            ],
          },
        ],
      },
    });
  }

  sendHintRequest() {
    if (this.session && this.isConnected) {
      try {
        console.log("Sending hint request to bot...");
        this.session.sendClientContent({
          turns: "System Note: The student has been silent. Without breaking character, provide EXACTLY ONE short example sentence of what they could say to help them, and then stop. Do NOT give long explanations. Do NOT ask multiple questions. Keep it extremely brief so you do not interrupt their thinking process.",
          turnComplete: true,
        });
      } catch (e) {
        console.error("Failed to send hint request:", e);
      }
    }
  }

`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Done");
