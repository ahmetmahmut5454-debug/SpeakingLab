const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// First, remove the audioProcessor start and initial prompt from onopen.
// We'll replace the inside of onopen to just log and set connected.
const oldOnOpen = `          onopen: () => {
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
              }, 500);
            }
          },`;

const newOnOpen = `          onopen: () => {
            console.log("Gemini Live session opened. Waiting for setupComplete...");
            this.isConnected = true;
            this.reconnectAttempts = 0;
            // We now wait for message.setupComplete before sending audio/prompts
          },`;

code = code.replace(oldOnOpen, newOnOpen);


// Now inject the setupComplete handling into onmessage
const oldOnMessage = `          onmessage: async (message: any) => {
            console.log("Raw message from server:", JSON.stringify(message).substring(0, 500));`;

const newOnMessage = `          onmessage: async (message: any) => {
            console.log("Raw message from server:", JSON.stringify(message).substring(0, 500));

            if (message.setupComplete) {
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
            }
`;

code = code.replace(oldOnMessage, newOnMessage);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed setupComplete issue");
