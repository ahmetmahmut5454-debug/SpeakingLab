/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useUserStore } from "./store/userStore";
import { useSessionStore } from "./store/sessionStore";
import { motion, AnimatePresence } from "motion/react";
import { FeedbackMarkdown } from "./components/FeedbackMarkdown";
import { PreTaskModal } from "./components/PreTaskModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { EmojiBurst } from "./components/EmojiBurst";
import { PronunciationPractice } from "./components/PronunciationPractice";
import { SpeakingTips } from "./components/SpeakingTips";
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
  FileText,
  WifiOff
} from "lucide-react";
import { AudioProcessor, AudioPlayer } from "./lib/audioManager";
import { ShopModal } from "./components/ShopModal";
import { CueCardOverlay } from "./components/CueCardOverlay";
import { Header } from "./components/Header";
import { ReportModal } from "./components/ReportModal";
import { LeaderboardModal } from "./components/LeaderboardModal";
import { HistoryModal } from "./components/HistoryModal";
import { EltBot, ProficiencyLevel, BotContext, VoiceType, isIELTSSession } from "./lib/eltBot";
import { predefinedScenarios, Scenario, extractCueCardFromScenario } from "./lib/scenarios";
import { translateScenario } from "./lib/translationService";
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

import { checkMasteryUnlocks } from "./lib/mastery";
import { SHOP_ITEMS } from "./lib/shopItems";
import { onAuthStateChanged, User } from "firebase/auth";


import { Guide } from "./components/Guide";
import { ScenarioSelector } from "./components/ScenarioSelector";

import { AudioStageVisualizer, RoleAvatar } from "./components/AudioStageVisualizer";
import { audioLevelEmitter } from "./lib/audioLevelEmitter";

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


const SUPPORTED_LANGUAGES = [
  { name: "English", code: "en-US", flag: "🇬🇧" },
  { name: "French", code: "fr-FR", flag: "🇫🇷" },
  { name: "Spanish", code: "es-ES", flag: "🇪🇸" },
  { name: "German", code: "de-DE", flag: "🇩🇪" },
  { name: "Italian", code: "it-IT", flag: "🇮🇹" },
  { name: "Turkish", code: "tr-TR", flag: "🇹🇷" },
];

import { ProgressDashboard } from "./components/ProgressDashboard";
import { LevelProgress } from "./components/LevelProgress";
import { ScoreTrendChart } from "./components/ScoreTrendChart";
import { LearningPath } from "./components/LearningPath";
import { LevelUpModal } from "./components/LevelUpModal";
import { DailyProgressBar } from "./components/DailyProgressBar";
import { AIProgressInsights } from "./components/AIProgressInsights";
import { FluencyHeatmap } from "./components/FluencyHeatmap";
import { ProficiencyBadge } from "./components/ProficiencyBadge";

export default function App() {
  const { context, setContext, isRunning, setIsRunning, report, setReport, generatingReport, setGeneratingReport, cueCardTopic, setCueCardTopic, pastReports, setPastReports, isShopOpen, setIsShopOpen, isLeaderboardOpen, setIsLeaderboardOpen, isHistoryOpen, setIsHistoryOpen } = useSessionStore();
  /* const [context, setContext] = useState<BotContext>({
    level: "B1",
    mode: "Practice",
    taskDurationMinutes: 5,
    objective: "Speak whatever you like and practice natural conversation.",
    topic: "Friendly conversation on any topic you like.",
    targetLanguage: "English",
    targetLanguageCode: "en-US",
  }); */

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const botRef = useRef<EltBot | null>(null);

  const [showSubtitles, setShowSubtitles] = useState(false);
  const [isMascotHovered, setIsMascotHovered] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<{
    text: string;
    isBot: boolean;
  } | null>(null);
  const subtitleTimeout = useRef<NodeJS.Timeout | null>(null);

  const [user, setUser] = useState<User | null>(null);  const [pronunciationWord, setPronunciationWord] = useState<string | null>(null);  const [showScenarioSelector, setShowScenarioSelector] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);  const { userStats, setUserStats, isStreakAnimating, setIsStreakAnimating, isQuestAnimating, setIsQuestAnimating } = useUserStore();
  const [levelUpBadgeId, setLevelUpBadgeId] = useState<string | null>(null);
  const [purchasedBadgeInfo, setPurchasedBadgeInfo] = useState<{
    id: string;
    icon: string;
  } | null>(null);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  // Scaffolding & Hint systems
  const [showPreTask, setShowPreTask] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [showHintButton, setShowHintButton] = useState(false);
  const silenceInterval = useRef<NodeJS.Timeout | null>(null);

  // Design/UI State
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const stats = await getUserStats();
        setUserStats(stats);
      } else {
        
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    botRef.current = new EltBot({
      onUserLevel: (l) => audioLevelEmitter.emitUser(l),
      onBotLevel: (l) => audioLevelEmitter.emitBot(l),
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
      onShowCueCard: (topic) => {
        setCueCardTopic(topic);
      }
    });
    return () => botRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setSilenceTimer(0);
      setShowHintButton(false);
      if (silenceInterval.current) {
        clearInterval(silenceInterval.current);
        silenceInterval.current = null;
      }
      return;
    }

    if (!silenceInterval.current) {
      silenceInterval.current = setInterval(() => {
        const isUserSilent = audioLevelEmitter.latestUserLevel < 3;
        const isBotSilent = audioLevelEmitter.latestBotLevel < 3;
        if (isUserSilent && isBotSilent) {
          setSilenceTimer((prev) => {
            const next = prev + 1;
            if (next > 10) setShowHintButton(true);
            return next;
          });
        } else {
          setSilenceTimer(0);
          setShowHintButton(false);
        }
      }, 1000);
    }

    return () => {
      if (silenceInterval.current) {
        clearInterval(silenceInterval.current);
        silenceInterval.current = null;
      }
    };
  }, [isRunning]);

  const handleStopAndReport = async () => {
    if (!botRef.current) return;
    const currentTranscript = botRef.current.transcript;
    setIsRunning(false);
    setCueCardTopic(null);
    setGeneratingReport(true);
    botRef.current.stop(); // Stop audio/mic first

    // Always give XP for participating, but only if they actually interacted
    const studentTurns = currentTranscript.filter((line) => line.startsWith("[Student]:")).length;
    const botTurns = currentTranscript.filter((line) => line.startsWith("[Tutor]:")).length;
    
    if (currentTranscript.length > 0 || studentTurns > 0 || botTurns > 0) {
      try {
        const stats = await updateGamificationStats(context.mode);
        if (stats) {
          setUserStats(stats);
          setIsStreakAnimating(true);
          setIsQuestAnimating(true);
          setTimeout(() => setIsStreakAnimating(false), 3000);
          setTimeout(() => setIsQuestAnimating(false), 3000);
        }
      } catch (err) {
        console.error("Failed to update gamification stats during session end:", err);
      }
    }

    const sessionReport = await botRef.current.generateReport(context, currentTranscript);
    setGeneratingReport(false);

    // Save directly to Firestore
    const hasReport = sessionReport && !sessionReport.includes("❌");
    const isIELTS = isIELTSSession(context);
    const newReport: SavedReport = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      
      level: isIELTS ? "IELTS" : context.level,
      mode: isIELTS ? "IELTS" : context.mode,
      topic: context.topic,
      scenarioId: context.scenarioId,
      reportText: hasReport ? sessionReport : "",
      transcript: currentTranscript,
      
      durationMs: sessionStartTime ? Date.now() - sessionStartTime : undefined,
    };
    const cloudId = await saveReportToDb(context, sessionReport || "", currentTranscript, sessionStartTime ? Date.now() - sessionStartTime : undefined); 
    if (cloudId) newReport.id = cloudId;    setReport(newReport);
  };

  const retryReportGeneration = async (report: SavedReport) => {
    if (!botRef.current) return;
    if (!report.transcript || report.transcript.length === 0) {
      alert("No transcript found for this session.");
      return;
    }    try {
      const isIeltsScenario = report.scenarioId?.toLowerCase().includes("ielts") || report.topic?.toLowerCase().includes("ielts");
      const newReport = await botRef.current.generateReport(
        {
          level: report.level as ProficiencyLevel,
          mode: (report.mode === "IELTS" || isIeltsScenario) ? "IELTS" : (report.mode as any),
          topic: report.topic,
          objective: report.topic,
          scenarioId: report.scenarioId,
          taskDurationMinutes: 5,
        },
        report.transcript,
      );

      if (newReport && !newReport.includes("❌")) {
        const updated = await updateReportInDb(report.id, newReport);
        if (updated) { report.reportText = newReport; }
        if (updated) {
          setPastReports(pastReports.map((r) => (r.id === report.id ? report : r)));
        }
        alert("Feedback generated successfully!");
      } else {
        alert("AI server is still busy. Please try again later.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to retry feedback generation.");
    } finally {    }
  };
  useEffect(() => {
    if (userStats && pastReports.length > 0) {
      const unlockedBadges = checkMasteryUnlocks(pastReports);
      const currentUnlocked = userStats.unlockedItems || [];
      const newUnlocks = unlockedBadges.filter(id => !currentUnlocked.includes(id));
      
      if (newUnlocks.length > 0) {
        const handleUnlocks = async () => {
          const newStats = await updateUserPurchase(
            userStats.xp,
            [...currentUnlocked, ...newUnlocks],
            userStats.equippedBadge || "",
            userStats.equippedOutfit || "outfit_default"
          );
          if (newStats) {
             setUserStats(newStats);
             const levelBadge = newUnlocks.find(id => id.startsWith("badge_level_"));
             if (levelBadge) {
               setLevelUpBadgeId(levelBadge);
             } else {
               const firstBadge = SHOP_ITEMS.find(i => i.id === newUnlocks[0]);
               if (firstBadge) {
                 setPurchasedBadgeInfo({ id: firstBadge.id, icon: firstBadge.icon });
               }
             }
          }
        };
        handleUnlocks();
      }
    }
  }, [pastReports, userStats]);  const toggleBot = async () => {
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
        // Synchronous unlock of AudioContexts for iOS Safari requirement
        AudioProcessor.unlockGlobal();
        AudioPlayer.unlockGlobal();

        setReport(null);
        setCueCardTopic(null);
        await botRef.current?.start(context);
        setIsRunning(true);
        setSessionStartTime(Date.now());
      } catch (err) {
        console.error("Start failed:", err);
        alert(
          "Bağlantı hatası: Mikrofon izni verilmemiş olabilir veya sistemde geçici bir sorun var.",
        );
        setIsRunning(false);
      }
    }
  };

  const sessionsToday = useMemo(() => {
    const today = new Date().toDateString();
    return pastReports.filter(r => {
      let timeMs = r.createdAt as any;
      if (typeof timeMs !== 'number' && timeMs) {
        if (typeof timeMs.seconds === 'number') timeMs = timeMs.seconds * 1000;
        else if (timeMs.getTime) timeMs = timeMs.getTime();
        else timeMs = new Date(timeMs).getTime();
      }
      if (!timeMs) return false;
      return new Date(timeMs).toDateString() === today;
    }).length;
  }, [pastReports]);

  const [isGoalDismissed, setIsGoalDismissed] = useState(false);
  const [goalMetRecently, setGoalMetRecently] = useState(false);
  useEffect(() => {
    if (sessionsToday === 3) {
      setGoalMetRecently(true);
      setIsGoalDismissed(false); // Make sure celebration is shown when goal is reached
      const t = setTimeout(() => setGoalMetRecently(false), 7000);
      return () => clearTimeout(t);
    }
  }, [sessionsToday]);

  const showGoalBanner = !isRunning && (sessionsToday < 3 || goalMetRecently) && !isGoalDismissed;

  const userActualLevel = useMemo(() => {
    if (!userStats?.unlockedItems) return "A1";
    const unlocks = userStats.unlockedItems;
    if (unlocks.includes("badge_level_c1")) return "C1";
    if (unlocks.includes("badge_level_b2")) return "B2";
    if (unlocks.includes("badge_level_b1")) return "B1";
    if (unlocks.includes("badge_level_a2")) return "A2";
    return "A1";
  }, [userStats?.unlockedItems]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-500/30 antialiased overflow-hidden relative">
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2 text-center text-sm flex items-center justify-center gap-2 shadow-lg animate-bounce">
          <WifiOff className="w-4 h-4" />
          <span>İnternet Bağlantısı Kesildi — Lütfen bağlantınızı kontrol edin.</span>
        </div>
      )}
      {levelUpBadgeId && (
        <LevelUpModal badgeId={levelUpBadgeId} onClose={() => setLevelUpBadgeId(null)} />
      )}

      {/* HUD Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#4ade80_0%,_transparent_75%)]" />
      </div>

      <main className={`relative z-10 max-w-4xl mx-auto p-4 md:p-12 flex flex-col min-h-screen ${showGoalBanner ? "pt-16 sm:pt-20 md:pt-24" : ""}`}>
        {showGoalBanner && (
          <DailyProgressBar sessionsToday={sessionsToday} goal={3} onClose={() => setIsGoalDismissed(true)} />
        )}

        {/* Header */}
        <Header 
          user={user}
          userStats={userStats}
          userActualLevel={userActualLevel}
          isStreakAnimating={isStreakAnimating}
          isQuestAnimating={isQuestAnimating}
          sessionsToday={sessionsToday}
          setShowShop={setIsShopOpen}
          setShowLeaderboard={setIsLeaderboardOpen}
          setShowHistory={setIsHistoryOpen}
          logout={logout}
          loginWithGoogle={loginWithGoogle}
          showSubtitles={showSubtitles}
          setShowSubtitles={setShowSubtitles}
          isRunning={isRunning}
        />
        {/* Main Application Area (Blurred if onboarding) */}
        <div
          className={`flex-1 flex flex-col items-center justify-center gap-16 transition-all duration-1000 ${showOnboarding && !isRunning ? "blur-sm pointer-events-none opacity-50" : "blur-0"}`}
        >
          {/* Main Visualizer Area */}
          <div className="relative w-full max-w-2xl aspect-[4/3] md:aspect-[21/9] bg-blue-900 border border-white/[0.04] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden">
            {/* Ambient Background Glow based on connection (Toned Down) */}
            <div
              className={`absolute inset-0 transition-opacity duration-1000 blur-3xl pointer-events-none ${isRunning ? "opacity-10" : "opacity-0"}`}
            >
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-yellow-400/10 rounded-full mix-blend-screen" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-screen" />
            </div>

            {/* Topographic/Grid subtle texture (Sleek) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

            {/* Central Audio Stage Visualizer */}
            <AudioStageVisualizer isRunning={isRunning} role={context.role} mode={context.mode} />
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
                    className={`text-base md:text-lg font-medium leading-relaxed tracking-wide drop-shadow-md bg-blue-900/80 border border-slate-200 inline-block px-4 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm ${currentSubtitle.isBot ? "text-blue-600" : "text-yellow-400"}`}
                  >
                    {currentSubtitle.text}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-6 mt-4 z-10 w-full max-w-2xl">
            {isRunning && context.mode === "Task" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl p-4 w-full text-center shadow-lg"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 mb-2 font-extrabold">Key Vocabulary to Practice</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {context.vocabulary?.map((word, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700 shadow-sm transition-transform duration-200">
                      {word}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label className="text-xs uppercase tracking-wider font-bold text-slate-700 mb-1 text-center">
                  Scenario
                </label>
                <button
                  onClick={() => setShowScenarioSelector(true)}
                  disabled={isRunning}
                  className="bg-blue-900 border border-blue-700 text-white font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg cursor-pointer hover:bg-blue-800 transition-colors truncate"
                >
                  {context.mode === "Practice" 
                    ? `-- Free Practice (${context.targetLanguage || "English"}) --` 
                    : context.mode === "IELTS"
                    ? `[IELTS] ${predefinedScenarios.find(s => s.id === context.scenarioId)?.title || "IELTS Mock Assessment"}`
                    : `[${context.level}] ${predefinedScenarios.find(s => s.id === context.scenarioId)?.title || "Custom Scenario"}`}
                </button>
              </div>

              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-xs uppercase tracking-wider font-bold text-slate-700 mb-1 text-center">
                  Target Language
                </label>
                <select
                  value={context.targetLanguageCode || "en-US"}
                  onChange={(e) => {
                    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                    if (lang) {
                      setContext({
                        ...context,
                        targetLanguage: lang.name,
                        targetLanguageCode: lang.code,
                      });
                    }
                  }}
                  className="bg-blue-900 border border-blue-700 text-white font-bold rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg cursor-pointer hover:bg-blue-800 transition-colors h-[42px] mt-[2px]"
                  disabled={isRunning}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-white text-slate-900 font-medium">
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-xs uppercase tracking-wider font-bold text-slate-700 mb-1 text-center">
                  Tutor Voice
                </label>
                <select
                  value={
                    context.voice ||
                    (context.level === "C1" ? "Charon" : "Zephyr")
                  }
                  onChange={(e) =>
                    setContext({ ...context, voice: e.target.value as VoiceType })
                  }
                  className="bg-blue-900 border border-blue-700 text-white font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg cursor-pointer hover:bg-blue-800 transition-colors h-[42px] mt-[2px]"
                  disabled={isRunning}
                >
                  <option value="Zephyr" className="bg-white text-slate-900 font-medium">Zephyr (Female, Energetic)</option>
                  <option value="Aoede" className="bg-white text-slate-900 font-medium">Aoede (Female, Calm)</option>
                  <option value="Kore" className="bg-white text-slate-900 font-medium">Kore (Female, Precise)</option>
                  <option value="Charon" className="bg-white text-slate-900 font-medium">Charon (Male, Deep)</option>
                  <option value="Puck" className="bg-white text-slate-900 font-medium">Puck (Male, Friendly)</option>
                  <option value="Fenrir" className="bg-white text-slate-900 font-medium">Fenrir (Male, Strict)</option>
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (isRunning) {
                  toggleBot();
                } else {
                  // If starting scenario, show pretask modal first
                  if (context.mode === "Task" || context.mode === "IELTS" || context.scenarioId) setShowPreTask(true);
                  else toggleBot(); // Free practice mode starts directly
                }
              }}
              disabled={generatingReport}
              className={`relative overflow-hidden group flex items-center justify-center gap-2 md:gap-4 px-6 md:px-16 py-4 md:py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs md:text-sm transition-all duration-500 shadow-2xl w-full max-w-md mx-auto
                ${
                  generatingReport
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-not-allowed"
                    : isRunning
                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]"
                      : "bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 hover:border-yellow-300/50 shadow-[0_0_30px_rgba(250,204,21,0.1)] hover:shadow-[0_0_60px_rgba(250,204,21,0.2)]"
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
              <div className="w-1 h-1 rounded-full bg-slate-400/20" />
              <div className="flex gap-2 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 opacity-60 shadow-[0_0_5px_#facc15]" />
                <span className="text-[9px] text-slate-600/30 uppercase tracking-widest">
                  End-to-End Encrypted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating IELTS Cue Card Button during active session */}
        {isRunning && isIELTSSession(context) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-6 z-[80]"
          >
            <button
              onClick={() => {
                const activeScenario = context.scenarioId ? predefinedScenarios.find(s => s.id === context.scenarioId) : null;
                const cardText = cueCardTopic || extractCueCardFromScenario(activeScenario) || (context.topic ? `Topic: ${context.topic}` : "Describe the topic given by your IELTS examiner.");
                setCueCardTopic(cardText);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-full shadow-2xl border border-amber-300/50 transition-all cursor-pointer transform hover:scale-105"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>📋 IELTS Cue Card Göster</span>
            </button>
          </motion.div>
        )}

        {/* Cue Card Modal */}
        <AnimatePresence>
          {cueCardTopic && isRunning && (
            <CueCardOverlay topic={cueCardTopic} onClose={() => setCueCardTopic(null)} />
          )}
        </AnimatePresence>

        {/* Report Modal */}
        <ReportModal 
          report={report}
          setReport={setReport}
          setPronunciationWord={setPronunciationWord}
          transcript={botRef.current?.transcript || []}
        />
        {/* Pre-Task / Scaffolding Modal */}
        <PreTaskModal 
          showPreTask={showPreTask}
          setShowPreTask={setShowPreTask}
          context={context}
          setCueCardTopic={setCueCardTopic}
          toggleBot={toggleBot}
        />

        {/* History Modal */}
        <HistoryModal 
          showHistory={isHistoryOpen}
          setShowHistory={setIsHistoryOpen}
          setPronunciationWord={setPronunciationWord}
          retryReportGeneration={retryReportGeneration}
        />
        {/* Leaderboard Modal */}
        <LeaderboardModal 
          showLeaderboard={isLeaderboardOpen}
          setShowLeaderboard={setIsLeaderboardOpen}
        />
        <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} userStats={userStats} />

        {/* Onboarding Guide Modal */}
        <OnboardingModal
          showOnboarding={showOnboarding}
          isRunning={isRunning}
          showPreTask={showPreTask}
          showHistory={isHistoryOpen}
          report={report}
          setShowOnboarding={setShowOnboarding}
        />

        {/* Footer info */}
        <footer className="mt-12 pt-6 pb-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Speaking Buddy</span>
            <span className="text-slate-300">•</span>
            <span>© {new Date().getFullYear()} Ahmet M. Oturak</span>
          </div>
          <div className="text-[11px] text-slate-500 text-center sm:text-right">
            Developed by <span className="font-semibold text-slate-700">Ahmet M. Oturak</span>. All Rights Reserved.
          </div>
        </footer>

        <ScenarioSelector
          isOpen={showScenarioSelector}
          onClose={() => setShowScenarioSelector(false)}
          currentScenarioId={
            context.mode === "Practice"
              ? null
              : context.scenarioId || null
          }
          currentTargetLanguageCode={context.targetLanguageCode}
          onSelect={async (scenario, language, freeLevel) => {
            if (scenario) {
              setIsTranslating(true);
              const translated = await translateScenario(scenario, language?.name || context.targetLanguage || "English");
              setIsTranslating(false);
              const isIelts = scenario.category === "IELTS Preparation" || (scenario.level as string) === "IELTS";
              setContext({
                ...context,
                mode: isIelts ? "IELTS" : "Task",
                level: scenario.level === "B1-B2" ? "B2" : (scenario.level as any),
                topic: translated?.studentBriefing || scenario.topic,
                objective: scenario.objective,
                role: scenario.role,
                icebreaker: translated?.icebreaker || scenario.icebreaker,
                scenarioId: scenario.id,
                targetLanguage: language?.name || context.targetLanguage,
                targetLanguageCode: language?.code || context.targetLanguageCode,
                vocabulary: translated?.vocabulary || scenario.vocabulary,
                studentBriefing: translated?.studentBriefing || scenario.studentBriefing,
              });
              setShowPreTask(true);
            } else {
              setContext({ 
                ...context, 
                mode: "Practice", 
                level: (freeLevel as any) || "B1",
                scenarioId: undefined,
                topic: "Friendly conversation on any topic you like.",
                objective: "Speak whatever you like and practice natural conversation.",
                role: "default",
                icebreaker: undefined,
                targetLanguage: language?.name || context.targetLanguage,
                targetLanguageCode: language?.code || context.targetLanguageCode,
                vocabulary: undefined,
                studentBriefing: undefined,
              });
            }
          }}
        />

        <Guide isRunning={isRunning} onStartPractice={() => {
           if (context.mode === "Task" || context.mode === "IELTS" || context.scenarioId) setShowPreTask(true);
           else toggleBot();
        }} />
        <AnimatePresence>{pronunciationWord && <PronunciationPractice word={pronunciationWord} onClose={() => setPronunciationWord(null)} />}</AnimatePresence>
        <SpeakingTips mode={context.mode} level={context.level} />
      </main>
    </div>
  );
}
