const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

const oldConfig = `        config: {
          generationConfig: {
            responseModalities: ["AUDIO"] as any,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: context.voice || (context.level === "C1" ? "Charon" : "Puck"),
                }
              }
            }
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },`;

const newConfig = `        config: {
          responseModalities: ["AUDIO"] as any,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            speechConfig: context.voice || (context.level === "C1" ? "Charon" : "Puck")
          },`;

code = code.replace(oldConfig, newConfig);

const oldOnOpen = `          onopen: () => {
            console.log("Gemini Live session opened. Waiting for setupComplete...");
            this.isConnected = true;
            this.reconnectAttempts = 0;
            // We now wait for message.setupComplete before sending audio/prompts
          },`;

const newOnOpen = `          onopen: () => {
            console.log("Gemini Live session opened.");
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            this.audioProcessor.start(
              stream,
              (data: any) => {
                if (this.session && this.isConnected) {
                  try {
                    this.session.sendRealtimeInput({
                      audio: {
                        data,
                        mimeType: "audio/pcm;rate=16000",
                      }
                    });
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
                      ? \`SYSTEM MESSAGE: The student has connected. Please start the IELTS speaking test now by asking the first question in \${targetLangForTrigger}.\`
                      : \`SYSTEM MESSAGE: The student has connected. Please introduce yourself and start the conversation naturally in \${targetLangForTrigger}.\`;
                    
                    this.session.sendClientContent({
                      turns: [{ role: "user", parts: [{ text: triggerMessage }] }],
                      turnComplete: true,
                    });
                  } catch (e) {}
                }
              }, 500);
            }
          },`;

code = code.replace(oldOnOpen, newOnOpen);

const oldOnMessage = `            if (message.setupComplete) {
              console.log("Setup complete received! Starting audio & initial prompt.");
              
              this.audioProcessor.start(
                stream,
                (data: any) => {
                  if (this.session && this.isConnected) {
                    try {
                      this.session.sendRealtimeInput({
                        audio: {
                          data,
                          mimeType: "audio/pcm;rate=16000",
                        }
                      });
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
                        ? \`SYSTEM MESSAGE: The student has connected. Please start the IELTS speaking test now by asking the first question in \${targetLangForTrigger}.\`
                        : \`SYSTEM MESSAGE: The student has connected. Please introduce yourself and start the conversation naturally in \${targetLangForTrigger}.\`;
                      
                      this.session.sendClientContent({
                        turns: [{ role: "user", parts: [{ text: triggerMessage }] }],
                        turnComplete: true,
                      });
                    } catch (e) {}
                  }
                }, 100);
              } else {
                 setTimeout(() => {
                  if (this.session && this.isConnected) {
                    try {
                      const historyContext = \`SYSTEM NOTE: Our network connection dropped, and we just reconnected. Here is the transcript of our conversation so far:\\n\\n\${this.transcriptHistory.join("\\n")}\\n\\nPlease smoothly continue the conversation from where we left off without explicitly mentioning the disconnect unless necessary.\`;
                      this.session.sendClientContent({
                        turns: [{ role: "user", parts: [{ text: historyContext }] }],
                        turnComplete: true,
                      });
                    } catch (e) {}
                  }
                }, 100);
              }
            }`;

code = code.replace(oldOnMessage, "");

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Reverted logic and fixed config perfectly.");
