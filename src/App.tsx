/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Terminal,
  Info,
  LayoutDashboard,
  Orbit,
  AudioLines,
  Sparkles,
  LogIn,
  LogOut,
  History,
  Trash2,
  Calendar,
  Ticket,
  Utensils,
  Headset,
  Home,
  Landmark,
  Briefcase,
  UserCircle,
  X,
  Flame,
  Target,
  Store,
  Check,
  Lock,
  Trophy,
} from "lucide-react";
import { EltBot, ProficiencyLevel, BotContext, VoiceType } from "./lib/eltBot";
import { predefinedScenarios } from "./lib/scenarios";
import {
  auth,
  loginWithGoogle,
  logout,
  saveReportToDb,
  getUserReports,
  deleteReportFromDb,
  updateReportInDb,
  SavedReport,
  getUserStats,
  UserStats,
  updateUserPurchase,
  updateGamificationStats,
  getLeaderboard,
} from "./lib/firebase";
import {
  saveLocalReport,
  getLocalReports,
  deleteLocalReport,
  updateLocalReportText,
  markReportAsSynced,
  LocalReport,
} from "./lib/indexedDB";
import { onAuthStateChanged, User } from "firebase/auth";

const SHOP_ITEMS = [
  {
    id: "badge_turtle",
    name: "Turtle Badge",
    price: 100,
    type: "badge",
    icon: "🐢",
  },
  {
    id: "badge_deer",
    name: "Deer Badge",
    price: 300,
    type: "badge",
    icon: "🦌",
  },
  {
    id: "badge_lion",
    name: "Lion Badge",
    price: 500,
    type: "badge",
    icon: "🦁",
  },
  {
    id: "badge_tiger",
    name: "Tiger Badge",
    price: 1000,
    type: "badge",
    icon: "🐅",
  },
  {
    id: "badge_eagle",
    name: "Eagle Badge",
    price: 2000,
    type: "badge",
    icon: "🦅",
  },
  {
    id: "outfit_glasses",
    name: "Cool Glasses",
    price: 200,
    type: "outfit",
    icon: "🕶️",
  },
  { id: "outfit_cap", name: "Red Cap", price: 400, type: "outfit", icon: "🧢" },
  {
    id: "outfit_crown",
    name: "Gold Crown",
    price: 3000,
    type: "outfit",
    icon: "👑",
  },
];

import { Mascot } from "./components/Mascot";
import { RoamingPet } from "./components/RoamingPet";
import { Guide } from "./components/Guide";

const StatusBadge = ({ on }: { on: boolean }) => (
  <div className="flex items-center gap-2 bg-slate-900/5 px-4 py-2 rounded-full border border-slate-900/10 backdrop-blur-md shadow-lg">
    <div
      className={`w-2 h-2 rounded-full transition-all duration-300 ${on ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" : "bg-slate-900/20"}`}
    />
    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-600/70">
      {on ? "Neural Link Active" : "System Standby"}
    </span>
  </div>
);

const VoiceBar = ({ level, color }: { level: number; color: string }) => {
  const bars = Array.from({ length: 8 });
  return (
    <div className="flex flex-col gap-1 items-center justify-end h-32 w-4">
      {bars.map((_, i) => {
        const threshold = (i + 1) * 12;
        const active = level > threshold;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: active ? color : "#1e1e1e",
              opacity: active ? 1 : 0.2,
              boxShadow: active ? `0 0 10px ${color}` : "none",
            }}
            className="w-full h-2 rounded-sm"
          />
        );
      })}
    </div>
  );
};

const RoleAvatar = ({
  role,
  isActive,
}: {
  role?: string;
  isActive: boolean;
}) => {
  const IconComponent = () => {
    switch (role) {
      case "station":
        return <Ticket className="w-8 h-8" />;
      case "restaurant":
        return <Utensils className="w-8 h-8" />;
      case "support":
        return <Headset className="w-8 h-8" />;
      case "roommate":
        return <Home className="w-8 h-8" />;
      case "mayor":
        return <Landmark className="w-8 h-8" />;
      case "investor":
        return <Briefcase className="w-8 h-8" />;
      default:
        return <UserCircle className="w-8 h-8" />;
    }
  };

  return (
    <motion.div
      animate={{
        boxShadow: isActive
          ? "0 0 40px rgba(96, 165, 250, 0.4)"
          : "0 0 0px rgba(96, 165, 250, 0)",
        scale: isActive ? 1.05 : 1,
      }}
      className={`relative rounded-full p-4 border flex items-center justify-center transition-colors duration-500 ${role ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-slate-900/10 bg-slate-900/5 text-slate-600/40"}`}
    >
      <IconComponent />
    </motion.div>
  );
};

const EmojiBurst = ({
  icon,
  onComplete,
}: {
  icon: string;
  onComplete: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    angle: Math.random() * Math.PI * 2,
    speed: 50 + Math.random() * 150,
    size: 1 + Math.random() * 2,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.speed * 2,
            y: Math.sin(p.angle) * p.speed * 2,
            scale: p.size,
            rotate: p.rotation + 360,
            opacity: 0,
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute text-4xl"
        >
          {icon}
        </motion.div>
      ))}
    </div>
  );
};

const SUPPORTED_LANGUAGES = [
  { name: "English", code: "en-US", flag: "🇬🇧" },
  { name: "French", code: "fr-FR", flag: "🇫🇷" },
  { name: "Spanish", code: "es-ES", flag: "🇪🇸" },
  { name: "German", code: "de-DE", flag: "🇩🇪" },
  { name: "Italian", code: "it-IT", flag: "🇮🇹" },
  { name: "Turkish", code: "tr-TR", flag: "🇹🇷" },
];

export default function App() {
  const [context, setContext] = useState<BotContext>({
    level: "B1-B2",
    mode: "Practice",
    taskDurationMinutes: 5,
    objective: "Practice travel-related vocabulary and speaking confidence.",
    topic: "Talking about daily routines and hobbies. Your name is Alex.",
    targetLanguage: "English",
    targetLanguageCode: "en-US",
  });

  const [isRunning, setIsRunning] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [userLevel, setUserLevel] = useState(0);
  const [botLevel, setBotLevel] = useState(0);
  const [report, setReport] = useState<string | null>(null);

  const botRef = useRef<EltBot | null>(null);

  const [generatingReport, setGeneratingReport] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<{
    text: string;
    isBot: boolean;
  } | null>(null);
  const subtitleTimeout = useRef<NodeJS.Timeout | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<UserStats[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [pastReports, setPastReports] = useState<LocalReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isStreakAnimating, setIsStreakAnimating] = useState(false);
  const [isQuestAnimating, setIsQuestAnimating] = useState(false);
  const [purchasedBadgeInfo, setPurchasedBadgeInfo] = useState<{
    id: string;
    icon: string;
  } | null>(null);

  const handlePurchase = async (item: (typeof SHOP_ITEMS)[0]) => {
    if (!userStats) return;

    // Check if already unlocked
    const unlocked = userStats.unlockedItems || [];
    if (unlocked.includes(item.id)) {
      // Just equip
      let newBadge = userStats.equippedBadge || "";
      let newOutfit = userStats.equippedOutfit || "outfit_default";

      if (item.type === "badge") newBadge = item.id;
      if (item.type === "outfit") newOutfit = item.id;

      const newStats = await updateUserPurchase(
        userStats.xp,
        unlocked,
        newBadge,
        newOutfit,
      );
      if (newStats) setUserStats(newStats);
      return;
    }

    // Buy item
    if (userStats.xp >= item.price) {
      if (item.type === "badge") {
        setPurchasedBadgeInfo({ id: item.id, icon: item.icon });
      }
      const remainingXp = userStats.xp - item.price;
      const newUnlocked = [...unlocked, item.id];

      let newBadge = userStats.equippedBadge || "";
      let newOutfit = userStats.equippedOutfit || "outfit_default";

      if (item.type === "badge") newBadge = item.id;
      if (item.type === "outfit") newOutfit = item.id;

      const newStats = await updateUserPurchase(
        remainingXp,
        newUnlocked,
        newBadge,
        newOutfit,
      );
      if (newStats) setUserStats(newStats);
    } else {
      alert("Not enough Points!");
    }
  };

  // Scaffolding & Hint systems
  const [showPreTask, setShowPreTask] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [showHintButton, setShowHintButton] = useState(false);
  const silenceInterval = useRef<NodeJS.Timeout | null>(null);

  // Design/UI State
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const stats = await getUserStats();
        setUserStats(stats);
      } else {
        setUserStats(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    botRef.current = new EltBot({
      onUserLevel: (l) => setUserLevel(l),
      onBotLevel: (l) => setBotLevel(l),
      onTranscription: (text, isModel) => {
        setCurrentSubtitle({ text, isBot: isModel });
        if (subtitleTimeout.current) clearTimeout(subtitleTimeout.current);
        subtitleTimeout.current = setTimeout(
          () => {
            setCurrentSubtitle(null);
          },
          isModel ? 5000 : 3000,
        );
      },
      onError: (err) => {
        console.error("Bot error:", err);
        alert("Connection error: " + (err.message || err));
        setIsRunning(false);
      },
      onBotFinished: () => {
        handleStopAndReport();
      },
    });
    return () => botRef.current?.stop();
  }, []);

  useEffect(() => {
    // Determine if silence is happening
    if (isRunning && userLevel < 3 && botLevel < 3) {
      if (!silenceInterval.current) {
        silenceInterval.current = setInterval(() => {
          setSilenceTimer((prev) => prev + 1);
        }, 1000);
      }
    } else {
      setSilenceTimer(0);
      setShowHintButton(false);
      if (silenceInterval.current) {
        clearInterval(silenceInterval.current);
        silenceInterval.current = null;
      }
    }

    if (silenceTimer > 10) {
      setShowHintButton(true);
    }
  }, [isRunning, userLevel, botLevel, silenceTimer]);

  const handleStopAndReport = async () => {
    if (!botRef.current) return;
    const currentTranscript = botRef.current.transcript;
    setIsRunning(false);
    setGeneratingReport(true);

    const sessionReport = await botRef.current.generateReport(context);
    setReport(sessionReport);
    setGeneratingReport(false);

    // Always give XP for participating, even if report generation (LLM) fails
    if (user) {
      const stats = await updateGamificationStats(context.mode);
      if (stats) {
        setUserStats(stats);
        setIsStreakAnimating(true);
        setIsQuestAnimating(true);
        setTimeout(() => setIsStreakAnimating(false), 3000);
        setTimeout(() => setIsQuestAnimating(false), 3000);
      }
    }

    // Save to IndexedDB locally
    const hasReport = sessionReport && !sessionReport.includes("❌");
    await saveLocalReport({
      id: Date.now().toString(),
      createdAt: new Date(),
      createdAtTime: Date.now(),
      level: context.level,
      mode: context.mode,
      topic: context.topic,
      reportText: hasReport ? sessionReport : "",
      transcript: currentTranscript,
    });

    botRef.current.stop();
  };

  const retryReportGeneration = async (report: LocalReport) => {
    if (!botRef.current) return;
    if (!report.transcript || report.transcript.length === 0) {
      alert("No transcript found for this session.");
      return;
    }

    setLoadingHistory(true);
    try {
      const newReport = await botRef.current.generateReport(
        {
          level: report.level as ProficiencyLevel,
          mode: report.mode as any,
          topic: report.topic,
          objective: report.topic,
          taskDurationMinutes: 5,
        },
        report.transcript,
      );

      if (newReport && !newReport.includes("❌")) {
        const updated = await updateLocalReportText(report.id, newReport);
        if (updated) {
          setPastReports((prev) =>
            prev.map((r) => (r.id === report.id ? updated : r))
          );
        }
        alert("Feedback generated successfully!");
      } else {
        alert("AI server is still busy. Please try again later.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to retry feedback generation.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const [syncing, setSyncing] = useState(false);

  const handleSyncToCloud = async () => {
    if (!user) {
      alert("Please sign in to sync your feedbacks to the cloud.");
      return;
    }
    setSyncing(true);
    try {
      const unsynced = pastReports.filter((r) => !r.synced);
      if (unsynced.length === 0) {
        alert("All feedbacks are already synced.");
        setSyncing(false);
        return;
      }
      
      let syncCount = 0;
      for (const rep of unsynced) {
        if (!rep.reportText && !rep.transcript) continue;
        const cloudId = await saveReportToDb(
          { level: rep.level as any, mode: rep.mode as any, topic: rep.topic, objective: "", taskDurationMinutes: 5 },
          rep.reportText,
          rep.transcript
        );
        if (cloudId) {
          await markReportAsSynced(rep.id, cloudId);
          syncCount++;
        }
      }
      
      // Update local state
      const updatedLocal = await getLocalReports();
      setPastReports(updatedLocal);
      alert(`Successfully synced ${syncCount} feedback(s) to the cloud.`);
    } catch (error) {
      console.error(error);
      alert("Failed to sync some feedbacks.");
    } finally {
      setSyncing(false);
    }
  };

  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    const data = await getLeaderboard(20);
    setLeaderboardData(data);
    setLoadingLeaderboard(false);
  };

  const loadReports = async () => {
    setLoadingHistory(true);
    // Load local reports from IndexedDB
    const localReports = await getLocalReports();
    setPastReports(localReports);
    setLoadingHistory(false);
  };

  const handleDeleteReport = async (id: string) => {
    await deleteLocalReport(id);
    setPastReports((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleBot = async () => {
    // 100% STRICT UI CHECK FOR LOCAL VITE USERS OR MAC APP USERS
    const localKey = localStorage.getItem("gemini_custom_key");
    const metaEnv = (import.meta as any).env;
    if (
      !localKey &&
      !metaEnv?.VITE_GEMINI_API_KEY &&
      typeof process === "undefined"
    ) {
      const userKey = prompt(
        "Bulut ortam değişkeni (VITE_GEMINI_API_KEY) bulunamadı.\n\nEğer kendi sunucunuzda/Vercel'de çalıştırıyorsanız, Vercel ayarlarından Environment Variables kısmına 'VITE_GEMINI_API_KEY' isminde anahtarınızı eklemelisiniz.\n\nYa da hızlıca test etmek için lütfen Gemini API Anahtarınızı buraya yapıştırın:",
      );
      if (userKey) {
        localStorage.setItem("gemini_custom_key", userKey);
        alert(
          "API Anahtarı tarayıcınıza kaydedildi. Lütfen tekrar bağlanmayı deneyin.",
        );
      }
      return;
    }

    if (isRunning) {
      handleStopAndReport();
    } else {
      try {
        setReport(null);
        await botRef.current?.start(context);
        setIsRunning(true);
      } catch (err) {
        console.error("Start failed:", err);
        alert(
          "Bağlantı hatası: Mikrofon izni verilmemiş olabilir veya sistemde geçici bir sorun var.",
        );
        setIsRunning(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] text-slate-800 font-sans selection:bg-green-500/30 antialiased overflow-hidden relative">
      {purchasedBadgeInfo && (
        <EmojiBurst
          icon={purchasedBadgeInfo.icon}
          onComplete={() => setPurchasedBadgeInfo(null)}
        />
      )}

      {/* HUD Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#4ade80_0%,_transparent_75%)]" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto p-4 md:p-12 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 mb-6 md:mb-10 w-full">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-blue-500/30 blur-md rounded-2xl group-hover:blur-xl transition-all duration-500" />
                <div className="relative bg-white p-2 md:p-3.5 rounded-2xl border border-slate-900/10 shadow-2xl">
                  <Mascot
                    className="w-6 h-6 md:w-8 md:h-8"
                    outfit={userStats?.equippedOutfit}
                  />
                </div>
                {userStats?.equippedBadge && (
                  <div className="absolute -bottom-2 -right-2 bg-white border border-slate-900/20 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg">
                    {
                      SHOP_ITEMS.find((i) => i.id === userStats.equippedBadge)
                        ?.icon
                    }
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start gap-1">
                <h1 className="text-xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-blue-400">
                  Speaking Buddy
                </h1>
                <StatusBadge on={isRunning} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 w-full md:w-auto">
            {userStats && (
              <div className="flex items-center gap-3 md:gap-4 md:mr-2 bg-slate-900/5 py-1.5 px-3 md:px-4 rounded-xl border border-slate-900/10 text-xs md:text-sm">
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
                        ? { duration: 0.5, repeat: 5 } // Fast pulse
                        : { duration: 2, repeat: Infinity, ease: "easeInOut" } // Normal breathing
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
                    {userStats.xp} Points
                    {isStreakAnimating && (
                      <motion.span
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 0], y: -30, scale: 1.5 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute left-0 -top-4 text-emerald-300 font-black text-sm pointer-events-none drop-shadow-lg"
                      >
                        +Points\!
                      </motion.span>
                    )}
                  </motion.span>
                </div>
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
                  className={`flex items-center gap-1.5 ${userStats.todaySessions >= 3 ? "text-yellow-400" : "text-zinc-500"}`}
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
                  className={`flex items-center gap-1.5 ${(userStats.todayTaskSessions || 0) >= 2 ? "text-yellow-400" : "text-zinc-500"}`}
                  title="2 TBLT Sessions (Weekly)"
                >
                  <Briefcase className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="font-bold relative">
                    <span className="hidden sm:inline">Tasks: </span>
                    {Math.min(2, userStats.todayTaskSessions || 0)}/2
                  </span>
                </motion.div>
                <div className="h-4 w-[1px] bg-slate-900/10" />
                <button
                  onClick={() => setShowShop(true)}
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                  title="Item Store"
                >
                  <Store className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="font-bold hidden sm:inline">Store</span>
                </button>
              </div>
            )}

            {!user && (
              <>
                <button
                  onClick={() => {
                    loadLeaderboard();
                    setShowLeaderboard(true);
                  }}
                  className="px-4 py-2 rounded-xl flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg"
                >
                  <Trophy className="w-3 h-3" />
                </button>
                <div className="h-6 w-[1px] bg-slate-900/10 mx-1" />
                <button
                  onClick={() => {
                    loadReports();
                    setShowHistory(true);
                  }}
                  className="px-4 py-2 rounded-xl flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg"
                >
                  <History className="w-3 h-3" /> Local Feedbacks
                </button>
                <div className="h-6 w-[1px] bg-slate-900/10 mx-1" />
              </>
            )}

            {user ? (
              <>
                <button
                  onClick={() => {
                    loadLeaderboard();
                    setShowLeaderboard(true);
                  }}
                  className="px-4 py-2 rounded-xl flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 transition-all text-xs font-bold uppercase tracking-widest shadow-lg"
                >
                  <Trophy className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">Leaderboard</span>
                </button>
                <div className="h-6 w-[1px] bg-slate-900/10 mx-2" />
                <button
                  onClick={() => {
                    loadReports();
                    setShowHistory(true);
                  }}
                  className="px-4 py-2 rounded-xl flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-all text-xs font-bold uppercase tracking-widest shadow-lg"
                >
                  <History className="w-4 h-4" /> Feedbacks
                </button>
                <div className="h-6 w-[1px] bg-slate-900/10 mx-2" />
                <button
                  onClick={logout}
                  className="pl-2 pr-4 py-2 rounded-xl flex items-center gap-2 bg-slate-900/5 border border-slate-900/5 text-slate-600/50 hover:bg-slate-900/10 hover:text-slate-600/80 transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <img
                    src={user.photoURL || ""}
                    alt="Profile"
                    className="w-5 h-5 rounded-full"
                  />
                  Sign Out
                </button>
              </>
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
                className="px-4 py-2 rounded-xl flex items-center gap-2 bg-slate-900/10 border border-slate-900/10 hover:bg-slate-900/20 transition-all text-xs font-bold uppercase tracking-widest shadow-lg"
              >
                <LogIn className="w-4 h-4" /> Sign In to Save Feedbacks
              </button>
            )}

            <div className="h-6 w-[1px] bg-slate-900/10 mx-2" />

            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg ${showSubtitles ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-slate-900/5 border-slate-900/5 text-slate-600/40 hover:bg-slate-900/10"}`}
            >
              CC
            </button>
            <button
              onClick={() => setShowDev(!showDev)}
              className={`p-3 rounded-xl border transition-all duration-500 shadow-lg ${showDev ? "bg-slate-900/10 border-slate-900/20 text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "bg-slate-900/5 border-slate-900/5 text-slate-600/40 hover:bg-slate-900/10 hover:text-slate-600/80"}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Application Area (Blurred if onboarding) */}
        <div
          className={`flex-1 flex flex-col items-center justify-center gap-16 transition-all duration-1000 ${showOnboarding && !isRunning ? "blur-sm pointer-events-none opacity-50" : "blur-0"}`}
        >
          {/* Main Visualizer Area */}
          <div className="relative w-full max-w-2xl aspect-[4/3] md:aspect-[21/9] bg-white border border-white/[0.04] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden">
            {/* Ambient Background Glow based on connection (Toned Down) */}
            <div
              className={`absolute inset-0 transition-opacity duration-1000 blur-3xl pointer-events-none ${isRunning ? "opacity-10" : "opacity-0"}`}
            >
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full mix-blend-screen" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-screen" />
            </div>

            {/* Topographic/Grid subtle texture (Sleek) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

            {/* Central Unified Syngery Visualizer */}
            <div className="relative z-10 flex items-end justify-center gap-12 h-40">
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-[6px]">
                  <VoiceBar level={userLevel} color="#34d399" />
                  <VoiceBar level={userLevel * 0.9} color="#34d399" />
                  <VoiceBar level={userLevel * 1.1} color="#34d399" />
                </div>
              </div>

              <div className="mx-2 md:mx-6 self-center shrink-0">
                <RoleAvatar
                  role={context.mode === "Task" ? context.role : undefined}
                  isActive={botLevel > 15}
                />
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-[6px]">
                  <VoiceBar level={botLevel * 1.1} color="#60a5fa" />
                  <VoiceBar level={botLevel} color="#60a5fa" />
                  <VoiceBar level={botLevel * 0.9} color="#60a5fa" />
                </div>
              </div>
            </div>

            {/* Dynamic Status Labels */}
            <AnimatePresence>
              {isRunning && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`absolute left-10 bottom-10 flex flex-col gap-1 transition-opacity duration-300 ${userLevel > botLevel + 5 ? "opacity-100" : "opacity-40"}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                      Human
                    </span>
                    <span className="text-xs uppercase tracking-widest text-slate-600/50 font-medium">
                      Transmitting
                    </span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`absolute right-10 bottom-10 flex flex-col items-end gap-1 transition-opacity duration-300 ${botLevel > userLevel + 5 ? "opacity-100" : "opacity-40"}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                      AI Core
                    </span>
                    <span className="text-xs uppercase tracking-widest text-slate-600/50 font-medium">
                      Processing
                    </span>
                  </motion.div>
                  {/* Add Hint Button */}
                  <AnimatePresence>
                    {showHintButton && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
                      >
                        <button
                          onClick={() => {
                            if (botRef.current) {
                              botRef.current.sendHintRequest();
                            }
                            setSilenceTimer(0);
                            setShowHintButton(false);
                          }}
                          className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full hover:bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                          title="Get a hint"
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                        <span className="text-[9px] uppercase tracking-wider text-indigo-400/70 font-semibold text-center leading-tight">
                          Need a<br />
                          Hint?
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </AnimatePresence>

            {/* Live Subtitles Overlay */}
            <AnimatePresence>
              {showSubtitles && currentSubtitle && isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-6 left-0 right-0 px-24 pointer-events-none text-center"
                >
                  <p
                    className={`text-base md:text-lg font-medium leading-relaxed tracking-wide drop-shadow-md bg-white/80 border border-slate-200 inline-block px-4 py-1.5 rounded-lg border border-slate-900/5 backdrop-blur-sm ${currentSubtitle.isBot ? "text-blue-600" : "text-emerald-600"}`}
                  >
                    {currentSubtitle.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-8 mt-4 z-10">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <select
                value={
                  context.voice ||
                  (context.level === "C1" ? "Charon" : "Zephyr")
                }
                onChange={(e) =>
                  setContext({ ...context, voice: e.target.value as VoiceType })
                }
                className="bg-white border border-slate-900/10 rounded-lg px-4 py-2 text-sm text-slate-600/80 focus:outline-none focus:border-slate-900/30"
                disabled={isRunning}
              >
                <option value="Aoede">Tutor: Aoede (Female, Calm)</option>
                <option value="Zephyr">
                  Tutor: Zephyr (Female, Energetic)
                </option>
                <option value="Kore">Tutor: Kore (Female, Precise)</option>
                <option value="Charon">Tutor: Charon (Male, Deep)</option>
                <option value="Puck">Tutor: Puck (Male, Friendly)</option>
                <option value="Fenrir">Tutor: Fenrir (Male, Strict)</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (isRunning) {
                  toggleBot();
                } else {
                  // If starting and not dev mode (scenarios available), show pretask First
                  if (context.mode === "Task") setShowPreTask(true);
                  else toggleBot(); // Only Practice mode starts directly
                }
              }}
              disabled={generatingReport}
              className={`relative overflow-hidden group flex items-center justify-center gap-2 md:gap-4 px-6 md:px-16 py-4 md:py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs md:text-sm transition-all duration-500 shadow-2xl w-full max-w-md mx-auto
                ${
                  generatingReport
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-not-allowed"
                    : isRunning
                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_60px_rgba(16,185,129,0.2)]"
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {generatingReport ? (
                <>
                  <Sparkles className="w-5 h-5" /> Analyzing Conversation...
                </>
              ) : isRunning ? (
                <>
                  <PhoneOff className="w-5 h-5" /> Terminate Link
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" /> Initialize Speech Lab
                </>
              )}
            </motion.button>
            <div className="flex gap-6 items-center">
              <p className="text-[10px] text-slate-600/30 text-center uppercase tracking-widest font-medium">
                Pulsar Audio Engine Active
              </p>
              <div className="w-1 h-1 rounded-full bg-slate-900/20" />
              <div className="flex gap-2 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-60 shadow-[0_0_5px_#10b981]" />
                <span className="text-[9px] text-slate-600/30 uppercase tracking-widest">
                  End-to-End Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        <AnimatePresence>
          {report && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <div className="bg-white border border-slate-900/10 p-8 rounded-2xl max-w-lg w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <LayoutDashboard className="w-6 h-6 text-green-500" />
                  <h2 className="text-xl font-bold uppercase tracking-tight">
                    Session Analysis
                  </h2>
                </div>
                <div className="prose prose-invert prose-sm overflow-y-auto max-h-[60vh] mb-6 custom-scrollbar">
                  {report.split("\n").map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                <button
                  onClick={() => setReport(null)}
                  className="w-full py-3 bg-slate-900/5 border border-slate-900/10 rounded-lg hover:bg-slate-900/10 font-bold uppercase tracking-widest transition-all"
                >
                  Close Feedback
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pre-Task / Scaffolding Modal */}
        <AnimatePresence>
          {showPreTask && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <div className="bg-white border-4 border-slate-200 p-10 rounded-[2rem] max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col items-center gap-6 text-center">
                  {predefinedScenarios.find((s) => s.role === context.role)
                    ?.imageUrl ? (
                    <img
                      src={
                        predefinedScenarios.find((s) => s.role === context.role)
                          ?.imageUrl
                      }
                      alt="Scenario"
                      className="w-full h-40 object-cover rounded-2xl shadow-inner mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <RoleAvatar role={context.role} isActive={false} />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">
                      Scenario Briefing
                    </h2>
                    <p className="text-slate-700 font-medium text-sm leading-relaxed mb-4 bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-inner">
                      {predefinedScenarios.find((s) => s.role === context.role)
                        ?.studentBriefing ||
                        "Get ready to solve the problem using your English skills!"}
                    </p>
                  </div>

                  <div className="w-full bg-slate-50 rounded-2xl p-6 text-left border border-slate-900/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">
                      Key Vocabulary
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {predefinedScenarios
                        .find((s) => s.role === context.role)
                        ?.vocabulary?.map((word, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-slate-900/5 border border-slate-900/10 rounded-lg text-sm text-slate-600/80"
                          >
                            {word}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="flex gap-4 w-full mt-4">
                    <button
                      onClick={() => setShowPreTask(false)}
                      className="flex-1 py-4 bg-slate-900/5 border border-slate-900/10 rounded-xl hover:bg-slate-900/10 font-bold uppercase tracking-widest transition-all text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowPreTask(false);
                        toggleBot();
                      }}
                      className="flex-[2] py-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 border border-emerald-500/30 text-emerald-300 rounded-xl font-bold uppercase tracking-widest transition-all text-xs shadow-lg"
                    >
                      <Phone className="w-4 h-4 inline-block mr-2 -mt-1" />{" "}
                      Ready, Connect
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <div className="bg-white border border-slate-900/10 p-8 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-slate-900/10 gap-4">
                  <div className="flex items-center gap-3">
                    <History className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-xl font-bold uppercase tracking-tight">
                      Past Session Feedbacks
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncToCloud}
                      disabled={syncing}
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 font-bold uppercase tracking-widest transition-all text-xs flex items-center gap-2"
                    >
                      {syncing ? "Syncing..." : "Sync to Cloud"}
                    </button>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="px-4 py-2 bg-slate-900/5 border border-slate-900/10 rounded-lg hover:bg-slate-900/10 font-bold uppercase tracking-widest transition-all text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Stats Bar */}
                {!loadingHistory && pastReports.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border border-slate-900/5 p-5 rounded-2xl">
                      <div className="text-[10px] text-slate-600/40 font-bold uppercase tracking-widest mb-1">
                        Total Sessions
                      </div>
                      <div className="text-3xl font-light text-slate-900">
                        {pastReports.length}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-900/5 p-5 rounded-2xl">
                      <div className="text-[10px] text-slate-600/40 font-bold uppercase tracking-widest mb-1">
                        Most Frequent Level
                      </div>
                      <div className="text-3xl font-light text-emerald-400">
                        {Object.entries(
                          pastReports.reduce(
                            (acc, r) => ({
                              ...acc,
                              [r.level]: (acc[r.level] || 0) + 1,
                            }),
                            {} as Record<string, number>,
                          ),
                        ).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ||
                          "N/A"}
                      </div>
                    </div>
                    <div className="bg-white border border-slate-900/5 p-5 rounded-2xl">
                      <div className="text-[10px] text-slate-600/40 font-bold uppercase tracking-widest mb-1">
                        Status
                      </div>
                      <div className="text-3xl font-light text-blue-400">
                        Active
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2">
                  {loadingHistory ? (
                    <div className="flex-1 flex items-center justify-center text-slate-600/50 uppercase tracking-widest text-sm animate-pulse">
                      Loading Archives...
                    </div>
                  ) : pastReports.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600/30">
                      <Calendar className="w-12 h-12 opacity-50" />
                      <p className="uppercase tracking-widest text-xs">
                        No records found initialized.
                      </p>
                    </div>
                  ) : (
                    pastReports.map((r) => (
                      <div
                        key={r.id}
                        className="bg-[#1a1b1e] border border-slate-900/5 rounded-xl p-6 relative group flex flex-col gap-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2 items-center">
                            <span className="px-2 py-1 bg-slate-900/10 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600/70">
                              {r.level}
                            </span>
                            <span className="px-2 py-1 bg-slate-900/5 rounded text-[10px] uppercase tracking-widest text-slate-600/50">
                              {r.mode}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-slate-600/40 ml-2">
                              {r.createdAtTime ? new Date(r.createdAtTime).toLocaleDateString() : "Recent"}
                            </span>
                            {r.synced && (
                              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] uppercase tracking-widest rounded ml-2 font-bold" title="Synced to Cloud">
                                Synced
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              handleDeleteReport(r.id)
                            }
                            className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs uppercase tracking-widest text-slate-600/50 border-l-2 border-indigo-500/50 pl-3">
                          {r.topic}
                        </div>
                        <div className="prose prose-invert prose-sm text-slate-600/80 mt-2">
                          {r.reportText ? (
                            r.reportText.split("\n").map((line, i) => (
                              <p key={i}>{line}</p>
                            ))
                          ) : (
                            <div className="flex flex-col items-center gap-4 py-8 bg-slate-900/5 rounded-xl border border-dashed border-slate-900/20">
                              <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                              <div className="text-center">
                                <p className="text-sm font-bold text-slate-800">
                                  Feedback pending...
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  There was an issue generating this feedback
                                  during the session.
                                </p>
                              </div>
                              <button
                                onClick={() => retryReportGeneration(r)}
                                className="px-6 py-2 bg-indigo-500 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/20"
                              >
                                Try Generating Again
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard Modal */}
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 bg-[#f7fdfc]/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8"
            >
              <div className="w-full max-w-lg bg-white border border-yellow-500/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-light text-yellow-50 tracking-tight">
                        Leaderboard
                      </h2>
                      <p className="text-xs text-yellow-500/50 uppercase tracking-widest mt-1">
                        Global Rankings
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="p-2 bg-slate-900/5 border border-slate-900/5 rounded-full hover:bg-slate-900/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                  {loadingLeaderboard ? (
                    <div className="flex-1 flex items-center justify-center text-yellow-500/50 uppercase tracking-widest text-sm animate-pulse">
                      Loading Ranks...
                    </div>
                  ) : leaderboardData.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600/30">
                      <Trophy className="w-12 h-12 opacity-50" />
                      <p className="uppercase tracking-widest text-xs">
                        No records found.
                      </p>
                    </div>
                  ) : (
                    leaderboardData.map((stat, idx) => (
                      <div
                        key={stat.userId}
                        className={`p-4 rounded-xl flex items-center justify-between border ${stat.userId === user?.uid ? "bg-yellow-500/10 border-yellow-500/20" : "bg-slate-50 border-slate-900/5"} transition-all`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`text-sm font-bold w-6 text-center ${idx === 0 ? "text-yellow-400 text-lg" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-amber-600" : "text-slate-600/30"}`}
                          >
                            #{idx + 1}
                          </div>
                          {stat.photoURL ? (
                            <img
                              src={stat.photoURL}
                              alt="Profile"
                              className="w-10 h-10 rounded-full border border-slate-900/10"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-900/5 flex items-center justify-center">
                              <UserCircle className="w-6 h-6 text-slate-600/50" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-600/90 text-sm">
                              {stat.displayName || "Unknown Scholar"}
                              {stat.userId === user?.uid && (
                                <span className="ml-2 text-[10px] uppercase text-yellow-500/70 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-600/40 flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400" />{" "}
                                {stat.streak} Day Flow
                              </span>
                              {stat.equippedBadge && (
                                <span className="text-sm bg-black/20 rounded-full px-1">
                                  {SHOP_ITEMS.find(
                                    (i) => i.id === stat.equippedBadge,
                                  )?.icon || ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <span className="font-black text-lg">{stat.xp}</span>
                          <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">
                            Points
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shop Modal */}
        <AnimatePresence>
          {showShop && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 bg-[#f0fdf4]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-8"
            >
              <div className="max-w-2xl w-full bg-white border border-slate-900/10 rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center mb-8 border-b border-slate-900/10 pb-4">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2 text-blue-400">
                      <Store className="w-6 h-6" /> Item Store
                    </h2>
                    <p className="text-slate-600/50 text-xs uppercase tracking-widest mt-1">
                      Unlock badges and outfits with your Points
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl text-lg font-bold border border-emerald-500/20 shadow-lg">
                      <Sparkles className="w-5 h-5" />
                      {userStats?.xp || 0} Points
                    </div>
                    <button
                      onClick={() => setShowShop(false)}
                      className="p-3 bg-slate-900/5 hover:bg-slate-900/10 rounded-full transition-all border border-slate-900/10 text-slate-600/50 hover:text-slate-900"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {userStats ? (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600/40 mb-4 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Badges
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {SHOP_ITEMS.filter((i) => i.type === "badge").map(
                          (item) => {
                            const isUnlocked =
                              userStats.unlockedItems?.includes(item.id);
                            const isEquipped =
                              userStats.equippedBadge === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handlePurchase(item)}
                                disabled={
                                  !isUnlocked && userStats.xp < item.price
                                }
                                className={`flex flex-col items-center p-4 rounded-2xl border transition-all relative overflow-hidden ${
                                  isEquipped
                                    ? "bg-blue-500/20 border-blue-500/50 shadow-lg"
                                    : isUnlocked
                                      ? "bg-slate-900/5 border-slate-900/10 hover:bg-slate-900/10"
                                      : userStats.xp >= item.price
                                        ? "bg-slate-900/5 border-emerald-500/30 hover:border-emerald-500/80 cursor-pointer"
                                        : "bg-black/50 border-slate-900/5 opacity-50 cursor-not-allowed"
                                }`}
                              >
                                <span className="text-4xl mb-2 drop-shadow-md">
                                  {item.icon}
                                </span>
                                <span className="font-bold text-[10px] uppercase tracking-wider text-center">
                                  {item.name}
                                </span>
                                <div className="mt-2 text-[10px] font-bold">
                                  {isEquipped ? (
                                    <span className="text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Equipped
                                    </span>
                                  ) : isUnlocked ? (
                                    <span className="text-slate-600/70 uppercase tracking-widest">
                                      Equip
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />{" "}
                                      {item.price}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600/40 mb-4 flex items-center gap-2">
                        <UserCircle className="w-4 h-4" /> Avatar Outfits
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        <button
                          onClick={() =>
                            handlePurchase({
                              id: "outfit_default",
                              name: "Default",
                              price: 0,
                              type: "outfit",
                              icon: "",
                            })
                          }
                          className={`flex flex-col items-center p-4 rounded-2xl border transition-all ${
                            userStats.equippedOutfit === "outfit_default" ||
                            !userStats.equippedOutfit
                              ? "bg-blue-500/20 border-blue-500/50"
                              : "bg-slate-900/5 border-slate-900/10 hover:bg-slate-900/10"
                          }`}
                        >
                          <Mascot className="w-12 h-12 mb-3 drop-shadow-lg" />
                          <span className="font-bold text-[10px] uppercase tracking-wider">
                            Default
                          </span>
                        </button>

                        {SHOP_ITEMS.filter((i) => i.type === "outfit").map(
                          (item) => {
                            const isUnlocked =
                              userStats.unlockedItems?.includes(item.id);
                            const isEquipped =
                              userStats.equippedOutfit === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handlePurchase(item)}
                                disabled={
                                  !isUnlocked && userStats.xp < item.price
                                }
                                className={`flex flex-col items-center p-4 rounded-2xl border transition-all relative overflow-hidden ${
                                  isEquipped
                                    ? "bg-blue-500/20 border-blue-500/50 shadow-lg"
                                    : isUnlocked
                                      ? "bg-slate-900/5 border-slate-900/10 hover:bg-slate-900/10"
                                      : userStats.xp >= item.price
                                        ? "bg-slate-900/5 border-emerald-500/30 hover:border-emerald-500/80 cursor-pointer"
                                        : "bg-black/50 border-slate-900/5 opacity-50 cursor-not-allowed"
                                }`}
                              >
                                <Mascot
                                  className="w-12 h-12 mb-3 drop-shadow-md opacity-80"
                                  outfit={item.id}
                                />
                                <span className="font-bold text-[10px] uppercase tracking-wider text-center">
                                  {item.name}
                                </span>
                                <div className="mt-2 text-[10px] font-bold">
                                  {isEquipped ? (
                                    <span className="text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Equipped
                                    </span>
                                  ) : isUnlocked ? (
                                    <span className="text-slate-600/70 uppercase tracking-widest">
                                      Equip
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />{" "}
                                      {item.price}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lock className="w-12 h-12 text-slate-600/20 mx-auto mb-4" />
                    <p className="text-slate-600/50 text-sm uppercase tracking-widest">
                      Please sign in to access the store
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Guide Modal */}
        <AnimatePresence>
          {showOnboarding &&
            !isRunning &&
            !showPreTask &&
            !showHistory &&
            !report && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 max-w-sm w-full"
              >
                <div className="bg-white border border-slate-900/10 p-8 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
                  <Mascot
                    className="w-16 h-16 mx-auto mb-6 drop-shadow-lg"
                    outfit={userStats?.equippedOutfit}
                  />
                  <h2 className="text-xl font-bold tracking-tight mb-2">
                    Let's do practice together!
                  </h2>
                  <p className="text-slate-600/70 font-medium text-sm leading-relaxed mb-6">
                    Pick a scenario from the settings, review your briefing, and
                    start speaking. I'll track your English level and reward you
                    with Points and cool new items!
                  </p>
                  <button
                    onClick={() => setShowOnboarding(false)}
                    className="w-full py-3 bg-slate-900/5 hover:bg-slate-900/10 text-slate-900 font-bold uppercase tracking-widest text-xs rounded-xl transition-all border border-slate-900/5 hover:border-slate-900/20"
                  >
                    Start Learning
                  </button>
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Developer / Context Sidepanel */}
        <AnimatePresence>
          {showDev && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-900/10 p-6 z-40 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-500" />
                  <h2 className="font-bold uppercase tracking-widest text-sm">
                    Scenario Settings
                  </h2>
                </div>
                <button
                  onClick={() => setShowDev(false)}
                  className="p-2 -mr-2 rounded-lg text-slate-600/50 hover:text-slate-900 hover:bg-slate-900/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">
                    Target Language
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() =>
                          setContext({
                            ...context,
                            targetLanguage: lang.name,
                            targetLanguageCode: lang.code,
                          })
                        }
                        className={`py-2 px-1 text-[10px] font-bold uppercase tracking-widest rounded-lg flex flex-col items-center gap-1 border transition-all ${
                          context.targetLanguage === lang.name
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500"
                            : "bg-slate-900/5 border-transparent text-slate-500 hover:bg-slate-900/10"
                        }`}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">
                    Pedagogical Mode
                  </label>
                  <div className="flex bg-slate-900/5 rounded-lg p-1 border border-slate-900/10">
                    <button
                      onClick={() =>
                        setContext({ ...context, mode: "Practice" })
                      }
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${context.mode === "Practice" ? "bg-green-500/20 text-green-500 shadow-sm" : "text-gray-500 hover:text-slate-900"}`}
                    >
                      Practice
                    </button>
                    <button
                      onClick={() => setContext({ ...context, mode: "Task" })}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${context.mode === "Task" ? "bg-blue-500/20 text-blue-500 shadow-sm" : "text-gray-500 hover:text-slate-900"}`}
                    >
                      Task-Based(TBLT)
                    </button>
                  </div>
                </div>

                {context.mode === "Practice" && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase opacity-50 tracking-widest flex justify-between">
                      <span>Target Duration</span>
                      <span className="text-green-500">
                        {context.taskDurationMinutes} mins
                      </span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="15"
                      step="1"
                      value={context.taskDurationMinutes}
                      onChange={(e) =>
                        setContext({
                          ...context,
                          taskDurationMinutes: parseInt(e.target.value),
                        })
                      }
                      className="w-full accent-green-500"
                    />
                    <p className="text-[8px] opacity-40 uppercase">
                      AI will naturally try to close the conversation around
                      this mark.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">
                    Predefined Scenarios
                  </label>
                  <select
                      onChange={(e) => {
                        const scenario = predefinedScenarios.find(
                          (s) => s.id === e.target.value,
                        );
                        if (scenario) {
                          setContext({
                            ...context,
                            level: scenario.level,
                            topic: scenario.topic,
                            objective: scenario.objective,
                            role: scenario.role,
                            icebreaker: scenario.icebreaker,
                          });
                        }
                      }}
                      className="w-full bg-white border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                    >
                      <option value="">-- Start with a Scenario --</option>
                      {Array.from(new Set(predefinedScenarios.map(s => s.category || "General"))).map(category => (
                        <optgroup key={category} label={category}>
                          {predefinedScenarios
                            .filter(s => (s.category || "General") === category)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                [{s.level}] {s.title}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">
                    Proficiency Level
                  </label>
                  <select
                    value={context.level}
                    onChange={(e) =>
                      setContext({
                        ...context,
                        level: e.target.value as ProficiencyLevel,
                      })
                    }
                    className="w-full bg-white border border-slate-900/10 p-3 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                  >
                    <option value="A1">A1 (Absolute Beginner)</option>
                    <option value="A2">A2 (Elementary)</option>
                    <option value="B1-B2">B1-B2 (Intermediate)</option>
                    <option value="C1">C1 (Advanced)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">
                    General Topic / Persona
                  </label>
                  <textarea
                    value={context.topic}
                    onChange={(e) =>
                      setContext({ ...context, topic: e.target.value })
                    }
                    placeholder="e.g. You are a friendly barista. We are at a coffee shop."
                    rows={2}
                    className="w-full bg-white border border-slate-900/10 p-3 rounded-lg text-sm focus:outline-none focus:border-green-500/50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">
                    {context.mode === "Task"
                      ? "Specific Task (TBLT)"
                      : "Learning Objectives"}
                  </label>
                  <textarea
                    value={context.objective}
                    onChange={(e) =>
                      setContext({ ...context, objective: e.target.value })
                    }
                    placeholder={
                      context.mode === "Task"
                        ? "e.g. Student must successfully complain about a cold soup and get a refund."
                        : "e.g. Practice 'used to' and past tense verbs."
                    }
                    rows={3}
                    className="w-full bg-white border border-slate-900/10 p-3 rounded-lg text-sm focus:outline-none focus:border-green-500/50 resize-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-900/10 text-[10px] uppercase tracking-widest opacity-30 flex flex-col gap-2">
                <div className="flex justify-between italic">
                  <span>Engine</span>
                  <span>Gemini 3.1 Flash Live</span>
                </div>
                <div className="flex justify-between">
                  <span>Latency</span>
                  <span>~200ms</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <footer className="mt-8 pt-4 border-t border-slate-900/5 flex justify-between items-center text-[9px] uppercase tracking-widest opacity-30">
          <div className="flex gap-4">
            <span>Lat: 37.7749</span>
            <span>Lng: -122.4194</span>
          </div>
          <span>Built for ELT Professionals</span>
        </footer>

        <Guide isRunning={isRunning} onStartPractice={() => {
           if (context.mode === "Task") setShowPreTask(true);
           else toggleBot();
        }} />
        <RoamingPet outfit={userStats?.equippedOutfit} />
      </main>
    </div>
  );
}
