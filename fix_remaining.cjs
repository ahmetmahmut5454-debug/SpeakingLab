const fs = require('fs');

let eltBotCode = fs.readFileSync('src/lib/eltBot.ts', 'utf8');
eltBotCode = eltBotCode.replace(
`  role?: string;`,
`  role?: string;
  icebreaker?: string;`
);
fs.writeFileSync('src/lib/eltBot.ts', eltBotCode);

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
`              'Sec-WebSocket-Key': req.headers['sec-websocket-key'],
              'Sec-WebSocket-Version': req.headers['sec-websocket-version'],
              'Host': 'generativelanguage.googleapis.com'
          } as any`,
`              'Sec-WebSocket-Key': req.headers['sec-websocket-key'],
              'Sec-WebSocket-Version': req.headers['sec-websocket-version'],
              'Sec-WebSocket-Extensions': req.headers['sec-websocket-extensions'],
              'Sec-WebSocket-Protocol': req.headers['sec-websocket-protocol'],
              'Host': 'generativelanguage.googleapis.com'
          } as any`
);
serverCode = serverCode.replace(
`// 'Sec-WebSocket-Extensions': req.headers['sec-websocket-extensions'],`,
``
);
serverCode = serverCode.replace(
`// 'Sec-WebSocket-Protocol': req.headers['sec-websocket-protocol']`,
``
);
fs.writeFileSync('server.ts', serverCode);


let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
`const stats = await updateGamificationStats(context.mode);`,
`const stats = await updateGamificationStats(context.mode as any);`
);
appCode = appCode.replace(
`mode: isIELTS ? "IELTS" : context.mode,`,
`mode: isIELTS ? "IELTS" : (context.mode || "Practice"),`
);
fs.writeFileSync('src/App.tsx', appCode);

