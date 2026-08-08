import { create } from 'zustand';
import { UserStats } from '../lib/firebase';

interface UserState {
  userStats: UserStats | null;
  setUserStats: (stats: UserStats | null) => void;
  isStreakAnimating: boolean;
  setIsStreakAnimating: (animating: boolean) => void;
  isQuestAnimating: boolean;
  setIsQuestAnimating: (animating: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userStats: null,
  setUserStats: (stats) => set({ userStats: stats }),
  isStreakAnimating: false,
  setIsStreakAnimating: (animating) => set({ isStreakAnimating: animating }),
  isQuestAnimating: false,
  setIsQuestAnimating: (animating) => set({ isQuestAnimating: animating }),
}));
