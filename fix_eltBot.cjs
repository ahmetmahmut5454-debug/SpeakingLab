const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

const startIdx = code.indexOf('this.currentStream = await navigator.mediaDevices.getUserMedia({');
const endIdx = code.indexOf('          if (this.transcriptHistory.length === 0) {');

const replacement = `this.currentStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      const stream = this.currentStream;

      if (!this.audioProcessor) {
        this.audioProcessor = new AudioProcessor(
          stream,
          () => this.audioPlayer.isPlaying
        );
      }

      await this.audioProcessor.initialize();

      let systemInstruction = \`
        You are an IELTS Speaking Examiner and English Tutor.
        You are talking with a student at CEFR \${context.level}.
        Keep your responses conversational and natural.
      \`;
      
      if (context.mode === "IELTS") {
        systemInstruction = \`
          You are an official IELTS Speaking Examiner. Conduct a strict but fair IELTS speaking test.
          The user's target level is roughly \${context.level}.
          DO NOT type out your instructions or internal thoughts. Speak naturally.
        \`;
      } else if (context.mode === "Pronunciation" && context.pronunciationPracticeWord) {
        systemInstruction = \`
          You are an English pronunciation tutor. The student wants to practice pronouncing the word "\${context.pronunciationPracticeWord}".
          CRITICAL INSTRUCTIONS FOR THIS SESSION:
          1. Your very first response must be to simply say the word "\${context.pronunciationPracticeWord}" clearly and slowly, and then ask the user to "Repeat after me". Do not say anything else in the first turn.
          2. Listen carefully to their pronunciation.
          3. Give immediate, specific feedback on how to improve, or praise them if they get it right.
          4. Keep your responses very brief, supportive, and focused only on this word.
          5. Call the endConversation tool when the user successfully pronounces the word or after 3 attempts.
        \`;
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
                      mediaChunks: [{
                        data,
                        mimeType: "audio/pcm;rate=16000",
                      }],
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
`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed eltBot.ts");
