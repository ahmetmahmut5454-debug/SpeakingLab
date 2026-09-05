const fs = require('fs');
let code = fs.readFileSync('src/lib/eltBot.ts', 'utf8');

code = code.replace(
    /this\.callbacks\.onShowCueCard\(fc\.args\.topic\);/,
    'this.callbacks.onShowCueCard(fc.args.topic as string);'
);

code = code.replace(
    /const outTrans = message\.serverContent\?\.outputTranscription \|\| message\.serverContent\?\.outputAudioTranscription;/,
    'const outTrans = (message.serverContent as any)?.outputTranscription || (message.serverContent as any)?.outputAudioTranscription;'
);

code = code.replace(
    /this\.handleUnexpectedDisconnect\(\);/g,
    'this.stop(); if (this.callbacks.onBotFinished) this.callbacks.onBotFinished();'
);

code = code.replace(
    /type: 6/g,
    'type: Type.OBJECT'
);

code = code.replace(
    /type: 1/g,
    'type: Type.STRING'
);

fs.writeFileSync('src/lib/eltBot.ts', code);
console.log("Fixed TS errors");
