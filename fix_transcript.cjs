const fs = require('fs');

let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// 1. Add recognition to properties
code = code.replace(
    'private currentBotSubtitle: string = "";',
    'private currentBotSubtitle: string = "";\n  private recognition: any = null;\n  private currentUserSubtitle: string = "";'
);

// 2. Initialize and start recognition in connect
code = code.replace(
    /this\.isConnected = true;\s*this\.reconnectAttempts = 0;/,
    `this.isConnected = true;
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
                this.transcriptHistory.push(\`[Student]: \${event.results[i][0].transcript.trim()}\`);
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
      }`
);

// 3. Stop recognition in disconnect
code = code.replace(
    /if \(this\.audioPlayer\) \{/,
    `if (this.recognition) {
        try {
            this.recognition.onend = null;
            this.recognition.stop();
        } catch(e) {}
    }
    if (this.audioPlayer) {`
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Patched eltBot.ts to include user speech recognition!");
