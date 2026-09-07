const fs = require('fs');

let eltBotCode = fs.readFileSync('src/lib/eltBot.ts', 'utf8');
eltBotCode = eltBotCode.replace(
`export interface BotContext {
  level: ProficiencyLevel;
  mode: string;
  topic?: string;
  objective?: string;
  scenarioId?: string;
  voice?: VoiceType;
  pronunciationPracticeWord?: string;
  targetLanguage?: string;
}`,
`export interface BotContext {
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
  vocabulary?: string[];
  studentBriefing?: string;
  taskDurationMinutes?: number;
}`
);

eltBotCode = eltBotCode.replace(
`export interface EltBotCallbacks {
  onUserLevel?: (level: number) => void;
  onBotLevel?: (level: number) => void;
  onTranscription?: (text: string, isBot: boolean) => void;
  onBotFinished?: () => void;
  onShowCueCard?: (topic: string) => void;
  onReportReady?: (report: string) => void;
}`,
`export interface EltBotCallbacks {
  onUserLevel?: (level: number) => void;
  onBotLevel?: (level: number) => void;
  onTranscription?: (text: string, isBot: boolean) => void;
  onBotFinished?: () => void;
  onShowCueCard?: (topic: string) => void;
  onReportReady?: (report: string) => void;
  onError?: (err: any) => void;
}`
);

eltBotCode = eltBotCode.replace(
`import { GoogleGenAI } from "@google/genai";`,
`import { GoogleGenAI, Type } from "@google/genai";`
);

eltBotCode = eltBotCode.replace(
`parameters: { type: "OBJECT", properties: { topic: { type: "STRING", description: "A short phrase describing the topic" } }, required: ["topic"] }`,
`parameters: { type: Type.OBJECT, properties: { topic: { type: Type.STRING, description: "A short phrase describing the topic" } }, required: ["topic"] }`
);

eltBotCode = eltBotCode.replace(
`console.error("Error starting EltBot", err?.message, err);`,
`console.error("Error starting EltBot", err, err);`
);

fs.writeFileSync('src/lib/eltBot.ts', eltBotCode);

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace(
`    if (!req.url) return;`,
`    if (!req.url) return;` // this is fine if it handles req.url... wait, req.url is still optional
);
// I will just use optional chaining or a non-null assertion
serverCode = serverCode.replace(
`req.url = req.url.replace(/^\\/+/, "/");`,
`req.url = req.url!.replace(/^\\/+/, "/");`
);
serverCode = serverCode.replace(
`'Sec-WebSocket-Extensions': req.headers['sec-websocket-extensions'],`,
`// 'Sec-WebSocket-Extensions': req.headers['sec-websocket-extensions'],`
);
serverCode = serverCode.replace(
`'Sec-WebSocket-Protocol': req.headers['sec-websocket-protocol']`,
`// 'Sec-WebSocket-Protocol': req.headers['sec-websocket-protocol']`
);
fs.writeFileSync('server.ts', serverCode);

