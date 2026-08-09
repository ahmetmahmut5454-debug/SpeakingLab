import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, Medal } from 'lucide-react';
import { UserStats, getLeaderboard } from '../lib/firebase';
import { SHOP_ITEMS } from '../lib/shopItems';
import { useUserStore } from '../store/userStore';

interface LeaderboardModalProps {
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
}

const getLocalDateString = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const getLocalMonthString = (): string => {
  return getLocalDateString().slice(0, 7);
};

export function LeaderboardModal({
  showLeaderboard,
  setShowLeaderboard,
}: LeaderboardModalProps) {
  const { userStats } = useUserStore();
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<"daily" | "monthly" | "allTime">("daily");
  const [leaderboardData, setLeaderboardData] = useState<UserStats[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (showLeaderboard) {
      const loadLeaderboard = async () => {
        setLoadingLeaderboard(true);
        const data = await getLeaderboard(leaderboardPeriod, 20);
        setLeaderboardData(data);
        setLoadingLeaderboard(false);
      };
      loadLeaderboard();
    }
  }, [showLeaderboard, leaderboardPeriod]);

  return (
    <AnimatePresence>
      {showLeaderboard && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <div className="bg-white border-0 sm:border border-slate-200/60 p-6 sm:p-8 rounded-none sm:rounded-[2rem] max-w-2xl w-full h-full sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
            <button
              onClick={() => setShowLeaderboard(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              ✕
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pr-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Leaderboard
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Top Scholars</p>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(["daily", "monthly", "allTime"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setLeaderboardPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      leaderboardPeriod === period
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                  >
                    {period === "allTime" ? "All Time" : period}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-8">
              {loadingLeaderboard ? (
                <div className="text-center p-8 text-slate-500 animate-pulse">
                  Loading rankings...
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center p-8 text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                  No activity found for this period. Start speaking!
                </div>
              ) : (
                leaderboardData.map((user, index) => {
                  const isCurrentUser = userStats?.userId === user.userId;
                  const activeAvatarId = user.equippedOutfit || "outfit_default";
                  const avatarItem = SHOP_ITEMS.find((i) => i.id === activeAvatarId);
                  
                  return (
                    <div
                      key={user.userId || index}
                      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        isCurrentUser
                          ? "bg-indigo-50 border-indigo-200 shadow-sm"
                          : "bg-white border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 font-bold text-slate-400">
                        {index === 0 ? (
                          <Medal className="w-6 h-6 text-yellow-500" />
                        ) : index === 1 ? (
                          <Medal className="w-6 h-6 text-slate-400" />
                        ) : index === 2 ? (
                          <Medal className="w-6 h-6 text-amber-700" />
                        ) : (
                          <span className="text-sm">#{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl shadow-inner border border-slate-200">
                        {avatarItem?.icon || "👤"}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold truncate ${isCurrentUser ? "text-indigo-900" : "text-slate-800"}`}>
                          {user.displayName || "Unknown Scholar"}
                          {isCurrentUser && <span className="ml-2 text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">You</span>}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {leaderboardPeriod === "daily" 
                            ? `${user.daily?.[getLocalDateString()] || 0} Daily XP` 
                            : leaderboardPeriod === "monthly"
                            ? `${user.monthly?.[getLocalMonthString()] || 0} Monthly XP`
                            : `${user.xp || 0} Total XP`
                          }
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
