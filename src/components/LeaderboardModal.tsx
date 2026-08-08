import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Medal } from 'lucide-react';
import { UserStats } from '../lib/firebase';
import { SHOP_ITEMS } from '../lib/shopItems';

interface LeaderboardModalProps {
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  leaderboardPeriod: "daily" | "monthly" | "allTime";
  setLeaderboardPeriod: (period: "daily" | "monthly" | "allTime") => void;
  leaderboardData: UserStats[];
  userStats: UserStats | null;
}

export function LeaderboardModal({
  showLeaderboard,
  setShowLeaderboard,
  leaderboardPeriod,
  setLeaderboardPeriod,
  leaderboardData,
  userStats
}: LeaderboardModalProps) {
  return (
    <AnimatePresence>
      {showLeaderboard && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-white border-0 sm:border border-slate-900/10 rounded-none sm:rounded-[2rem] max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
            <div className="flex flex-col items-center gap-4 sm:gap-6 p-6 sm:p-10 pb-4 sm:pb-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#f59e0b_0%,_transparent_60%)] opacity-20" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                  <Trophy className="w-8 h-8 text-orange-400 drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                    Top Speakers
                  </h2>
                  <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Global Rankings
                  </p>
                </div>
              </div>
              <div className="flex gap-2 bg-slate-950/50 p-1.5 rounded-2xl w-full max-w-sm relative z-10 border border-white/5">
                {(["daily", "monthly", "allTime"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setLeaderboardPeriod(period)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${leaderboardPeriod === period ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white hover:bg-white/10"}`}
                  >
                    {period === "daily" ? "Today" : period === "monthly" ? "This Month" : "All Time"}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-50 p-4 sm:p-8">
              <div className="max-w-xl mx-auto flex flex-col gap-3">
                {leaderboardData.map((user, index) => {
                  const isCurrentUser = userStats?.userId === user.userId;
                  return (
                    <div
                      key={user.userId}
                      className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${isCurrentUser ? "bg-orange-50/50 border-orange-200 shadow-sm" : "bg-white border-slate-200 shadow-sm hover:shadow-md"}`}
                    >
                      <div className="flex items-center justify-center w-8 shrink-0">
                        {index === 0 ? (
                          <Medal className="w-8 h-8 text-yellow-500 drop-shadow-sm" />
                        ) : index === 1 ? (
                          <Medal className="w-8 h-8 text-slate-400 drop-shadow-sm" />
                        ) : index === 2 ? (
                          <Medal className="w-8 h-8 text-amber-700 drop-shadow-sm" />
                        ) : (
                          <span className="text-lg font-black text-slate-400">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-1 min-w-0 relative">
                        <div className="relative">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || "User"}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-slate-100 object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                              <span className="text-xl font-bold text-slate-400">
                                {(user.displayName || "A")[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          {user.equippedBadge && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-900 border border-white/50 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md z-10">
                              {
                                SHOP_ITEMS.find((i) => i.id === user.equippedBadge)
                                  ?.icon
                              }
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="font-bold text-slate-800 text-base sm:text-lg truncate">
                            {user.displayName || "Anonymous User"}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">
                            Level {user.level || "1"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="text-xl sm:text-2xl font-black text-orange-500 leading-none">
                          {leaderboardPeriod === "daily"
                            ? user.dailyXP || 0
                            : leaderboardPeriod === "monthly"
                              ? user.monthlyXP || 0
                              : user.xp || 0}
                        </div>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-orange-600/50">
                          Points
                        </span>
                      </div>
                    </div>
                  );
                })}
                {leaderboardData.length === 0 && (
                  <div className="text-center p-12 text-slate-400 font-medium">
                    No data yet for this period.
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 p-4 sm:p-6 bg-white border-t border-slate-100 flex justify-center z-10">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full max-w-sm py-3 sm:py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg active:scale-[0.98]"
              >
                Close Leaderboard
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
