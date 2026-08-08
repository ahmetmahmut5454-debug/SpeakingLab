import React from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Zap, Target, BookOpen, Briefcase, Store, Trophy, History, LogOut, LogIn, Flame, Sparkles } from 'lucide-react';
import { ProficiencyBadge } from './ProficiencyBadge';
import { SHOP_ITEMS } from '../lib/shopItems';
import { User } from 'firebase/auth';

const StatusBadge = ({ on }: { on: boolean }) => (
  <div className="flex items-center gap-2 bg-slate-900/5 px-4 py-2 rounded-full border border-slate-900/10 backdrop-blur-md shadow-lg">
    <div
      className={`w-2 h-2 rounded-full transition-all duration-300 ${on ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" : "bg-slate-50/20"}`}
    />
    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-600/70">
      {on ? "Neural Link Active" : "System Standby"}
    </span>
  </div>
);

interface HeaderProps {
  user: User | null;
  userStats: any;
  userActualLevel: string;
  isStreakAnimating: boolean;
  isQuestAnimating: boolean;
  sessionsToday: number;
  setShowShop: (show: boolean) => void;
  loadLeaderboard: () => void;
  setShowLeaderboard: (show: boolean) => void;
  loadReports: () => void;
  setShowHistory: (show: boolean) => void;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  showSubtitles: boolean;
  setShowSubtitles: (show: boolean) => void;
  isRunning: boolean;
}

export function Header({
  user,
  userStats,
  userActualLevel,
  isStreakAnimating,
  isQuestAnimating,
  sessionsToday,
  setShowShop,
  loadLeaderboard,
  setShowLeaderboard,
  loadReports,
  setShowHistory,
  logout,
  loginWithGoogle,
  showSubtitles,
  setShowSubtitles,
  isRunning
}: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 mb-6 md:mb-10 w-full">
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="relative group cursor-pointer z-50">
            <ProficiencyBadge level={userActualLevel} />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-md rounded-full group-hover:blur-xl group-hover:bg-blue-400/40 transition-all duration-500" />
            <div className="relative bg-blue-950 w-12 h-12 md:w-16 md:h-16 rounded-full border border-white/10 shadow-2xl transition-all duration-500 group-hover:bg-blue-900 group-hover:border-blue-400/50 overflow-hidden flex items-center justify-center">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User Profile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <UserCircle className="w-8 h-8 md:w-10 md:h-10 text-slate-300 transition-transform duration-500 group-hover:scale-110 group-hover:text-white" />
              )}
            </div>
            {userStats?.equippedBadge && (
              <div className="absolute -bottom-1 -right-1 bg-blue-900 border border-white/20 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg z-10">
                {
                  SHOP_ITEMS.find((i) => i.id === userStats.equippedBadge)
                    ?.icon
                }
              </div>
            )}
          </div>
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-indigo-700">
              Speaking Buddy
            </h1>
            <StatusBadge on={isRunning} />
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 w-full md:w-auto">
        {userStats && (
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 md:mr-2">
            <div className="flex items-center gap-2 bg-white py-1.5 px-3 rounded-xl border border-slate-200 text-xs md:text-sm text-slate-700 shadow-sm">
              <div
                className="flex items-center gap-1.5 text-orange-400 relative"
                title="Daily Streak"
              >
                <motion.div
                  animate={
                    isStreakAnimating
                      ? {
                          scale: [1, 1.5, 1],
                          filter:
                            "drop-shadow(0 0 12px rgba(251, 146, 60, 1))",
                        }
                      : {
                          scale: [1, 1.1, 1],
                          filter: [
                            "drop-shadow(0 0 2px rgba(251, 146, 60, 0.5))",
                            "drop-shadow(0 0 6px rgba(251, 146, 60, 0.8))",
                            "drop-shadow(0 0 2px rgba(251, 146, 60, 0.5))",
                          ],
                        }
                  }
                  transition={
                    isStreakAnimating
                      ? { duration: 0.5, repeat: 5 }
                      : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }
                  className={
                    isStreakAnimating ? "text-orange-300" : "text-orange-400"
                  }
                >
                  <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                </motion.div>
                <motion.span
                  animate={
                    isStreakAnimating
                      ? {
                          scale: [1, 1.3, 1],
                          color: ["#fb923c", "#fcd34d", "#fb923c"],
                        }
                      : {}
                  }
                  transition={{ duration: 0.5, repeat: 5 }}
                  className="font-bold"
                >
                  {userStats.streak}
                </motion.span>
              </div>
              <div className="h-4 w-[1px] bg-slate-900/10" />
              <div
                className="flex items-center gap-1.5 text-emerald-400 relative"
                title="Points"
              >
                <motion.div
                  animate={
                    isStreakAnimating
                      ? {
                          scale: [1, 1.8, 1],
                          filter: "drop-shadow(0 0 15px rgba(52,211,153,1))",
                        }
                      : {}
                  }
                  transition={{ duration: 0.8, repeat: 3 }}
                >
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </motion.div>
                <motion.span
                  animate={
                    isStreakAnimating
                      ? {
                          scale: [1, 1.3, 1],
                          textShadow: "0px 0px 8px rgb(52,211,153)",
                        }
                      : {}
                  }
                  transition={{ duration: 0.8, repeat: 3 }}
                  className="font-bold relative"
                >
                  {userStats.xp} <span className="hidden sm:inline">Points</span>
                  {isStreakAnimating && (
                    <motion.span
                      initial={{ opacity: 0, y: 0, scale: 0.5 }}
                      animate={{ opacity: [0, 1, 0], y: -30, scale: 1.5 }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="absolute left-0 -top-4 text-emerald-300 font-black text-sm pointer-events-none drop-shadow-lg"
                    >
                      +Points!
                    </motion.span>
                  )}
                </motion.span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white py-1.5 px-3 rounded-xl border border-slate-200 text-xs md:text-sm text-slate-700 shadow-sm">
              <motion.div
                animate={
                  isQuestAnimating
                    ? {
                        scale: [1, 1.2, 1],
                        filter: [
                          "drop-shadow(0 0 0px rgba(239,68,68,0))",
                          "drop-shadow(0 0 15px rgba(239,68,68,1))",
                          "drop-shadow(0 0 0px rgba(239,68,68,0))",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.8, repeat: 3 }}
                className={`flex items-center gap-1.5 ${userStats.todaySessions >= 3 ? "text-emerald-500" : "text-zinc-500"}`}
                title="3 Sessions (Daily)"
              >
                <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="font-bold relative">
                  <span className="hidden sm:inline">Daily: </span>
                  {Math.min(3, userStats.todaySessions)}/3
                </span>
              </motion.div>
              <div className="h-4 w-[1px] bg-slate-900/10" />
              <motion.div
                animate={
                  isQuestAnimating
                    ? {
                        scale: [1, 1.2, 1],
                        filter: [
                          "drop-shadow(0 0 0px rgba(239,68,68,0))",
                          "drop-shadow(0 0 15px rgba(239,68,68,1))",
                          "drop-shadow(0 0 0px rgba(239,68,68,0))",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.8, repeat: 3 }}
                className={`flex items-center gap-1.5 ${(userStats.todayTaskSessions || 0) >= 2 ? "text-emerald-500" : "text-zinc-500"}`}
                title="2 TBLT Sessions (Weekly)"
              >
                <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="font-bold relative">
                  <span className="hidden sm:inline">Tasks: </span>
                  {Math.min(2, userStats.todayTaskSessions || 0)}/2
                </span>
              </motion.div>
            </div>
            <button
              onClick={() => setShowShop(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-pink-500 hover:bg-pink-50 transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
              title="Item Store"
            >
              <Store className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-bold hidden sm:inline">Store</span>
            </button>
          </div>
        )}
        {!user && (
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
            <button
              onClick={() => {
                loadLeaderboard();
                setShowLeaderboard(true);
              }}
              className="px-4 py-2 rounded-xl flex items-center gap-2 bg-white border border-orange-200 text-orange-500 hover:bg-orange-50 transition-all text-[10px] font-bold uppercase tracking-widest shadow-sm"
            >
              <Trophy className="w-3 h-3" />
            </button>
            
            <button
              onClick={() => {
                loadReports();
                setShowHistory(true);
              }}
              className="px-4 py-2 rounded-xl flex items-center gap-2 bg-white border border-indigo-200 text-indigo-500 hover:bg-indigo-50 transition-all text-[10px] font-bold uppercase tracking-widest shadow-sm"
            >
              <History className="w-3 h-3" /> Local Feedbacks
            </button>
          </div>
        )}
        {user ? (
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
            <button
              onClick={() => {
                loadLeaderboard();
                setShowLeaderboard(true);
              }}
              className="px-4 py-2 rounded-xl flex items-center gap-2 bg-white border border-orange-200 text-orange-500 hover:bg-orange-50 transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
            >
              <Trophy className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">Leaderboard</span>
            </button>
            
            <button
              onClick={() => {
                loadReports();
                setShowHistory(true);
              }}
              className="px-4 py-2 rounded-xl flex items-center gap-2 bg-white border border-indigo-200 text-indigo-500 hover:bg-indigo-50 transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
            >
              <History className="w-4 h-4" /> Feedbacks
            </button>
            
            <button
              onClick={logout}
              className="pl-2 pr-4 py-2 rounded-xl flex items-center gap-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
            >
              <img
                src={user.photoURL || ""}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full"
              />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              loginWithGoogle().catch((err) => {
                console.error("Login popup failed:", err);
                let errMsg = err.message || JSON.stringify(err);
                if (errMsg.includes("auth/unauthorized-domain")) {
                  alert(
                    "Hata: " +
                      errMsg +
                      "\n\nÇÖZÜM: Firebase Console'da Authentication -> Settings -> Authorized Domains kısmına gidin ve lokaldeki adresinizi (örneğin localhost veya 127.0.0.1) ekleyin. Aksi halde lokalde test ederken Google Login çalışmaz.",
                  );
                } else if (errMsg.includes("popup-blocked")) {
                  alert(
                    "Pop-up engellendi. Lütfen uygulamayı yeni sekmede açmayı deneyin (Sağ üstteki 'Open app in a new tab' butonu ile).",
                  );
                } else if (
                  errMsg.includes("auth/cancelled-popup-request") ||
                  errMsg.includes("auth/popup-closed-by-user")
                ) {
                  alert(
                    "Giriş işlemi iptal edildi veya pop-up kapandı.\n\nNOT: Google Giriş ekranı yapay zeka stüdyosundaki küçük pencerede engellenebilir. Lütfen sağ üstteki ok işaretine ('Open app in a new tab') tıklayarak uygulamayı yeni sekmede açmayı deneyin.",
                  );
                } else {
                  alert(
                    "Google Login hatası: " +
                      errMsg +
                      "\n\nEğer iFrame/test ortamındaysanız, uygulamayı sağ üstten yeni sekmede açarak deneyin.",
                  );
                }
              });
            }}
            className="px-4 py-2 rounded-xl flex items-center gap-2 bg-white border border-blue-200 text-blue-500 hover:bg-blue-50 transition-all text-xs font-bold uppercase tracking-widest shadow-sm"
          >
            <LogIn className="w-4 h-4" /> Sign In to Save Feedbacks
          </button>
        )}
        
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-sm ${showSubtitles ? "bg-white border-cyan-300 text-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            CC
          </button>
        </div>
      </div>
    </header>
  );
}
