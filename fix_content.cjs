const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

// Fix client content
const oldClientContent1 = `                    this.session.sendClientContent({
                      turns: triggerMessage,
                      turnComplete: true,
                    });`;
const newClientContent1 = `                    this.session.send({
                      clientContent: {
                        turns: [{ role: "user", parts: [{ text: triggerMessage }] }],
                        turnComplete: true
                      }
                    });`;
code = code.replace(oldClientContent1, newClientContent1);

// Fix client content 2
const oldClientContent2 = `                    this.session.sendClientContent({
                      turns: historyContext,
                      turnComplete: true,
                    });`;
const newClientContent2 = `                    this.session.send({
                      clientContent: {
                        turns: [{ role: "user", parts: [{ text: historyContext }] }],
                        turnComplete: true
                      }
                    });`;
code = code.replace(oldClientContent2, newClientContent2);

// Fix audio sending
const oldInput = `                    this.session.sendRealtimeInput({
                      media: [{
                        data,
                        mimeType: "audio/pcm;rate=16000",
                      }]
                    });`;
const newInput = `                    this.session.send({
                      realtimeInput: {
                        mediaChunks: [{
                          data,
                          mimeType: "audio/pcm;rate=16000",
                        }]
                      }
                    });`;
code = code.replace(oldInput, newInput);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed content sending");
