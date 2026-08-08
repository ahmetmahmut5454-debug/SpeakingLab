import { create } from 'zustand';
import { BotContext } from '../lib/eltBot';
import { LocalReport } from '../lib/db';

interface SessionState {
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isShopOpen: boolean;
  setIsShopOpen: (open: boolean) => void;
  isLeaderboardOpen: boolean;
  setIsLeaderboardOpen: (open: boolean) => void;
  isQuestsOpen: boolean;
  setIsQuestsOpen: (open: boolean) => void;
  isErrorBankOpen: boolean;
  setIsErrorBankOpen: (open: boolean) => void;
  context: BotContext;
  setContext: (context: BotContext) => void;
  report: LocalReport | null;
  setReport: (report: LocalReport | null) => void;
  generatingReport: boolean;
  setGeneratingReport: (generating: boolean) => void;
  cueCardTopic: string | null;
  setCueCardTopic: (topic: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isRunning: false,
  setIsRunning: (running) => set({ isRunning: running }),
  isSettingsOpen: false,
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  isProfileOpen: false,
  setIsProfileOpen: (open) => set({ isProfileOpen: open }),
  isShopOpen: false,
  setIsShopOpen: (open) => set({ isShopOpen: open }),
  isLeaderboardOpen: false,
  setIsLeaderboardOpen: (open) => set({ isLeaderboardOpen: open }),
  isQuestsOpen: false,
  setIsQuestsOpen: (open) => set({ isQuestsOpen: open }),
  isErrorBankOpen: false,
  setIsErrorBankOpen: (open) => set({ isErrorBankOpen: open }),
  context: {
    level: "A2",
    mode: "Free Practice",
    topic: "Tell me about your daily routine.",
    objective: "Practice basic vocabulary and simple present tense.",
    targetLanguage: "English",
    taskDurationMinutes: 5,
  },
  setContext: (context) => set({ context }),
  report: null,
  setReport: (report) => set({ report }),
  generatingReport: false,
  setGeneratingReport: (generating) => set({ generatingReport: generating }),
  cueCardTopic: null,
  setCueCardTopic: (topic) => set({ cueCardTopic: topic }),
}));
