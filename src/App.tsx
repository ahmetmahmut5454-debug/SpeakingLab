/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Mic, MicOff, Phone, PhoneOff, Terminal, Info, LayoutDashboard, Orbit, AudioLines, Sparkles, LogIn, LogOut, History, Trash2, Calendar, Ticket, Utensils, Headset, Home, Landmark, Briefcase, UserCircle, X, Flame, Target } from 'lucide-react';
import { EltBot, ProficiencyLevel, BotContext, VoiceType } from './lib/eltBot';
import { predefinedScenarios } from './lib/scenarios';
import { auth, loginWithGoogle, logout, saveReportToDb, getUserReports, deleteReportFromDb, SavedReport, getUserStats, UserStats } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const CustomLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="url(#bgGradient)" />
    
    {/* Human Face Half (Left) */}
    <path d="M 50 20 C 35 20, 25 30, 25 45 C 25 55, 28 64, 35 70 L 35 78 C 35 83, 42 85, 50 85 Z" fill="#ffffff" opacity="0.9" />
    <path d="M 33 42 Q 38 38 42 42 Q 38 45 33 42 Z" fill="#111113" />
    
    {/* Robot Face Half (Right) */}
    <path d="M 50 20 C 65 20, 75 30, 75 45 C 75 55, 72 64, 65 70 L 65 78 C 65 83, 58 85, 50 85 Z" fill="#10b981" />
    <rect x="58" y="40" width="10" height="4" rx="1.5" fill="#0f0f12" />
    <circle cx="63" cy="42" r="1.5" fill="#34d399" />
    
    {/* Center Divider */}
    <line x1="50" y1="20" x2="50" y2="85" stroke="#0f172a" strokeWidth="1.5" opacity="0.3" />
    
    {/* Speech Bubble */}
    <g transform="translate(0, 10)">
      <path d="M 50 60 C 65 60 75 68 75 76 C 75 84 65 92 50 92 C 45 92 40 91 35 88 L 25 90 L 28 82 C 25 79 23 77 23 74 C 23 66 35 60 50 60 Z" fill="#38bdf8" />
      <circle cx="41" cy="76" r="2.5" fill="#ffffff" />
      <circle cx="50" cy="76" r="2.5" fill="#ffffff" />
      <circle cx="59" cy="76" r="2.5" fill="#ffffff" />
    </g>

    <defs>
      <linearGradient id="bgGradient" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
  </svg>
);

const StatusBadge = ({ on }: { on: boolean }) => (
  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-lg">
    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${on ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-white/20'}`} />
    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/70">
      {on ? 'Neural Link Active' : 'System Standby'}
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
              backgroundColor: active ? color : '#1e1e1e',
              opacity: active ? 1 : 0.2,
              boxShadow: active ? `0 0 10px ${color}` : 'none'
            }}
            className="w-full h-2 rounded-sm"
          />
        );
      })}
    </div>
  );
};

const RoleAvatar = ({ role, isActive }: { role?: string, isActive: boolean }) => {
  const IconComponent = () => {
    switch (role) {
      case 'station': return <Ticket className="w-8 h-8" />;
      case 'restaurant': return <Utensils className="w-8 h-8" />;
      case 'support': return <Headset className="w-8 h-8" />;
      case 'roommate': return <Home className="w-8 h-8" />;
      case 'mayor': return <Landmark className="w-8 h-8" />;
      case 'investor': return <Briefcase className="w-8 h-8" />;
      default: return <UserCircle className="w-8 h-8" />;
    }
  };

  return (
    <motion.div 
      animate={{ 
        boxShadow: isActive ? '0 0 40px rgba(96, 165, 250, 0.4)' : '0 0 0px rgba(96, 165, 250, 0)',
        scale: isActive ? 1.05 : 1
      }}
      className={`relative rounded-full p-4 border flex items-center justify-center transition-colors duration-500 ${role ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-white/10 bg-white/5 text-white/40'}`}
    >
      <IconComponent />
    </motion.div>
  );
};

export default function App() {
  const [context, setContext] = useState<BotContext>({
    level: 'B1-B2',
    mode: 'Practice',
    taskDurationMinutes: 5,
    objective: 'Practice travel-related vocabulary and speaking confidence.',
    topic: 'Talking about daily routines and hobbies. Your name is Alex.',
  });

  const [isRunning, setIsRunning] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [userLevel, setUserLevel] = useState(0);
  const [botLevel, setBotLevel] = useState(0);
  const [report, setReport] = useState<string | null>(null);

  const botRef = useRef<EltBot | null>(null);

  const [generatingReport, setGeneratingReport] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<{text: string, isBot: boolean} | null>(null);
  const subtitleTimeout = useRef<NodeJS.Timeout | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pastReports, setPastReports] = useState<SavedReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
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
        subtitleTimeout.current = setTimeout(() => {
          setCurrentSubtitle(null);
        }, isModel ? 5000 : 3000);
      },
      onError: (err) => {
         console.error("Bot error:", err);
         alert("Connection error: " + (err.message || err));
         setIsRunning(false);
      },
      onBotFinished: () => {
        handleStopAndReport();
      }
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
    setIsRunning(false);
    setGeneratingReport(true);
    
    const sessionReport = await botRef.current.generateReport(context);
    setReport(sessionReport);
    setGeneratingReport(false);
    
    // Save to Firebase if logged in, otherwise save to LocalStorage (Mac/Desktop fallback)
    if (sessionReport && !sessionReport.includes("❌")) {
      if (user) {
         await saveReportToDb(context, sessionReport);
         const stats = await getUserStats(); // Refresh stats after save
         setUserStats(stats);
      } else {
         const localRep = { 
           id: Date.now().toString(), 
           createdAt: new Date(), 
           level: context.level, 
           mode: context.mode, 
           topic: context.topic, 
           reportText: sessionReport 
         };
         const existing = JSON.parse(localStorage.getItem('local_reports') || '[]');
         localStorage.setItem('local_reports', JSON.stringify([localRep, ...existing]));
      }
    }
    
    botRef.current.stop();
  };

  const loadReports = async () => {
    setLoadingHistory(true);
    let fbReports: any[] = [];
    if (user) {
      fbReports = await getUserReports();
    }
    
    // Load local reports
    const localStr = localStorage.getItem('local_reports');
    const localReportsObj = JSON.parse(localStr || '[]').map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt)
    }));

    // Merge and sort
    setPastReports([...fbReports, ...localReportsObj].sort((a,b) => b.createdAt.valueOf() - a.createdAt.valueOf()));
    setLoadingHistory(false);
  };
  
  const handleDeleteReport = async (id: string, isLocal: boolean = false) => {
    if (!isLocal && user) {
      await deleteReportFromDb(id);
    } else {
      const existing = JSON.parse(localStorage.getItem('local_reports') || '[]');
      const filtered = existing.filter((r: any) => r.id !== id);
      localStorage.setItem('local_reports', JSON.stringify(filtered));
    }
    setPastReports(prev => prev.filter(r => r.id !== id));
  };

  const toggleBot = async () => {
    // 100% STRICT UI CHECK FOR LOCAL VITE USERS OR MAC APP USERS
    const localKey = localStorage.getItem('gemini_custom_key');
    const metaEnv = (import.meta as any).env;
    if (!localKey && !metaEnv?.VITE_GEMINI_API_KEY && typeof process === 'undefined') {
      const userKey = prompt("Bulut ortam değişkeni (VITE_GEMINI_API_KEY) bulunamadı.\n\nEğer kendi sunucunuzda/Vercel'de çalıştırıyorsanız, Vercel ayarlarından Environment Variables kısmına 'VITE_GEMINI_API_KEY' isminde anahtarınızı eklemelisiniz.\n\nYa da hızlıca test etmek için lütfen Gemini API Anahtarınızı buraya yapıştırın:");
      if (userKey) {
        localStorage.setItem('gemini_custom_key', userKey);
        alert("API Anahtarı tarayıcınıza kaydedildi. Lütfen tekrar bağlanmayı deneyin.");
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
        alert("Bağlantı hatası: Mikrofon izni verilmemiş olabilir veya sistemde geçici bir sorun var.");
        setIsRunning(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-[#c9c9c9] font-mono selection:bg-green-500/20 antialiased">
      {/* HUD Background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2a2a2a_0%,_transparent_75%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.1)_50%),_linear-gradient(90deg,rgba(0,0,0,0.1),rgba(0,0,0,0),rgba(0,0,0,0.1))] bg-[length:100%_3px,4px_100%]" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto p-4 md:p-12 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 mb-6 md:mb-10 w-full">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-blue-500/30 blur-md rounded-2xl group-hover:blur-xl transition-all duration-500" />
                <div className="relative bg-[#111113] p-2 md:p-3.5 rounded-2xl border border-white/10 shadow-2xl">
                  <CustomLogo className="w-6 h-6 md:w-8 md:h-8" />
                </div>
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
              <div className="flex items-center gap-3 md:gap-4 md:mr-2 bg-white/5 py-1.5 px-3 md:px-4 rounded-xl border border-white/10 text-xs md:text-sm">
                <div className="flex items-center gap-1.5 text-orange-400" title="Daily Streak">
                  <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                  <span className="font-bold">{userStats.streak}</span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-1.5 text-emerald-400" title="XP">
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="font-bold">{userStats.xp} XP</span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className={`flex items-center gap-1.5 ${userStats.todaySessions >= 3 ? 'text-yellow-400' : 'text-zinc-500'}`} title="Daily Quest (3 Sessions)">
                  <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="font-bold">{Math.min(3, userStats.todaySessions)}/3</span>
                </div>
              </div>
            )}
            
            {!user && (
              <>
                <button 
                  onClick={() => {
                    loadReports();
                    setShowHistory(true);
                  }}
                  className="px-4 py-2 rounded-xl flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg"
                >
                  <History className="w-3 h-3" /> Local Reports
                </button>
                <div className="h-6 w-[1px] bg-white/10 mx-1" />
              </>
            )}
            
            {user ? (
              <>
                <button 
                  onClick={() => {
                    loadReports();
                    setShowHistory(true);
                  }}
                  className="px-4 py-2 rounded-xl flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 transition-all text-xs font-bold uppercase tracking-widest shadow-lg"
                >
                  <History className="w-4 h-4" /> Reports
                </button>
                <div className="h-6 w-[1px] bg-white/10 mx-2" />
                <button 
                   onClick={logout}
                   className="pl-2 pr-4 py-2 rounded-xl flex items-center gap-2 bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 transition-all text-xs font-bold uppercase tracking-widest"
                >
                  <img src={user.photoURL || ''} alt="Profile" className="w-5 h-5 rounded-full" />
                  Sign Out
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  loginWithGoogle().catch(err => {
                    console.error("Login popup failed:", err);
                    let errMsg = err.message || JSON.stringify(err);
                    if (errMsg.includes('auth/unauthorized-domain')) {
                       alert("Hata: " + errMsg + "\n\nÇÖZÜM: Firebase Console'da Authentication -> Settings -> Authorized Domains kısmına gidin ve lokaldeki adresinizi (örneğin localhost veya 127.0.0.1) ekleyin. Aksi halde lokalde test ederken Google Login çalışmaz.");
                    } else if (errMsg.includes('popup-blocked')) {
                       alert("Pop-up engellendi. Uygulamayı yeni sekmede açmayı deneyin (Sağ üstte ok ikonu).");
                    } else {
                       alert("Google Login hatası: " + errMsg + "\n\nEğer lokal/telefon testindeyseniz sorunu çözmek için yukarıdaki hatayı inceleyin.");
                    }
                  });
                }}
                className="px-4 py-2 rounded-xl flex items-center gap-2 bg-white/10 border border-white/10 hover:bg-white/20 transition-all text-xs font-bold uppercase tracking-widest shadow-lg"
              >
                <LogIn className="w-4 h-4" /> Sign In to Save Reports
              </button>
            )}

            <div className="h-6 w-[1px] bg-white/10 mx-2" />

            <button
               onClick={() => setShowSubtitles(!showSubtitles)}
               className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg ${showSubtitles ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
            >
              CC
            </button>
            <button 
              onClick={() => setShowDev(!showDev)}
              className={`p-3 rounded-xl border transition-all duration-500 shadow-lg ${showDev ? 'bg-white/10 border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white/80'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Application Area (Blurred if onboarding) */}
        <div className={`flex-1 flex flex-col items-center justify-center gap-16 transition-all duration-1000 ${showOnboarding && !isRunning ? 'blur-sm pointer-events-none opacity-50' : 'blur-0'}`}>
          {/* Main Visualizer Area */}
          <div className="relative w-full max-w-2xl aspect-[4/3] md:aspect-[21/9] bg-[#0f1013] border border-white/[0.04] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center justify-center overflow-hidden">
            {/* Ambient Background Glow based on connection (Toned Down) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 blur-3xl pointer-events-none ${isRunning ? 'opacity-10' : 'opacity-0'}`}>
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
                <RoleAvatar role={context.mode === 'Task' ? context.role : undefined} isActive={botLevel > 15} />
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
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className={`absolute left-10 bottom-10 flex flex-col gap-1 transition-opacity duration-300 ${userLevel > botLevel + 5 ? 'opacity-100' : 'opacity-40'}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Human</span>
                    <span className="text-xs uppercase tracking-widest text-white/50 font-medium">Transmitting</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className={`absolute right-10 bottom-10 flex flex-col items-end gap-1 transition-opacity duration-300 ${botLevel > userLevel + 5 ? 'opacity-100' : 'opacity-40'}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">AI Core</span>
                    <span className="text-xs uppercase tracking-widest text-white/50 font-medium">Processing</span>
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
                        <span className="text-[9px] uppercase tracking-wider text-indigo-400/70 font-semibold text-center leading-tight">Need a<br/>Hint?</span>
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
                  <p className={`text-base md:text-lg font-medium leading-relaxed tracking-wide drop-shadow-md bg-black/40 inline-block px-4 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm ${currentSubtitle.isBot ? 'text-blue-100' : 'text-emerald-100'}`}>
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
                value={context.voice || (context.level === 'C1' ? 'Charon' : 'Zephyr')}
                onChange={(e) => setContext({...context, voice: e.target.value as VoiceType})}
                className="bg-[#151619] border border-white/10 rounded-lg px-4 py-2 text-sm text-white/80 focus:outline-none focus:border-white/30"
                disabled={isRunning}
              >
                <option value="Aoede">Tutor: Aoede (Female, Calm)</option>
                <option value="Zephyr">Tutor: Zephyr (Female, Energetic)</option>
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
                  if (context.mode === 'Task') setShowPreTask(true);
                  else toggleBot(); // Only Practice mode starts directly
                }
              }}
              disabled={generatingReport}
              className={`relative overflow-hidden group flex items-center justify-center gap-2 md:gap-4 px-6 md:px-16 py-4 md:py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs md:text-sm transition-all duration-500 shadow-2xl w-full max-w-md mx-auto
                ${generatingReport 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30 cursor-not-allowed' 
                  : isRunning 
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_60px_rgba(16,185,129,0.2)]'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {generatingReport 
                ? <><Sparkles className="w-5 h-5" /> Analyzing Conversation...</> 
                : isRunning 
                  ? <><PhoneOff className="w-5 h-5" /> Terminate Link</> 
                  : <><Phone className="w-5 h-5" /> Initialize Speech Lab</>
              }
            </motion.button>
            <div className="flex gap-6 items-center">
              <p className="text-[10px] text-white/30 text-center uppercase tracking-widest font-medium">
                Pulsar Audio Engine Active
              </p>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex gap-2 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-60 shadow-[0_0_5px_#10b981]" />
                <span className="text-[9px] text-white/30 uppercase tracking-widest">End-to-End Encrypted</span>
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
              <div className="bg-[#151619] border border-white/10 p-8 rounded-2xl max-w-lg w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <LayoutDashboard className="w-6 h-6 text-green-500" />
                  <h2 className="text-xl font-bold uppercase tracking-tight">Session Analysis</h2>
                </div>
                <div className="prose prose-invert prose-sm overflow-y-auto max-h-[60vh] mb-6 custom-scrollbar">
                  {report.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
                <button 
                  onClick={() => setReport(null)}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 font-bold uppercase tracking-widest transition-all"
                >
                  Close Report
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
              <div className="bg-[#111113] border border-white/10 p-10 rounded-[2rem] max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                     <RoleAvatar role={context.role} isActive={false} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Scenario Briefing</h2>
                    <p className="text-white/80 text-sm leading-relaxed mb-4 bg-[#15161A] p-4 rounded-xl border border-white/10">
                      {predefinedScenarios.find(s => s.role === context.role)?.studentBriefing || "Get ready to solve the problem using your English skills!"}
                    </p>
                  </div>
                  
                  <div className="w-full bg-[#15161A] rounded-2xl p-6 text-left border border-white/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Key Vocabulary</h3>
                    <div className="flex flex-wrap gap-2">
                      {predefinedScenarios.find(s => s.role === context.role)?.vocabulary?.map((word, i) => (
                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80">{word}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 w-full mt-4">
                    <button 
                      onClick={() => setShowPreTask(false)}
                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 font-bold uppercase tracking-widest transition-all text-xs"
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
                      <Phone className="w-4 h-4 inline-block mr-2 -mt-1" /> Ready, Connect
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
              <div className="bg-[#111113] border border-white/10 p-8 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <History className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-xl font-bold uppercase tracking-tight">Past Session Reports</h2>
                  </div>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 font-bold uppercase tracking-widest transition-all text-xs"
                  >
                    Close
                  </button>
                </div>
                
                {/* Stats Bar */}
                {!loadingHistory && pastReports.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#151619] border border-white/5 p-5 rounded-2xl">
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Total Sessions</div>
                      <div className="text-3xl font-light text-white">{pastReports.length}</div>
                    </div>
                    <div className="bg-[#151619] border border-white/5 p-5 rounded-2xl">
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Most Frequent Level</div>
                      <div className="text-3xl font-light text-emerald-400">
                        {
                          Object.entries(pastReports.reduce((acc, r) => ({...acc, [r.level]: (acc[r.level] || 0) + 1}), {} as Record<string,number>))
                          .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'N/A'
                        }
                      </div>
                    </div>
                    <div className="bg-[#151619] border border-white/5 p-5 rounded-2xl">
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Status</div>
                      <div className="text-3xl font-light text-blue-400">Active</div>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2">
                  {loadingHistory ? (
                    <div className="flex-1 flex items-center justify-center text-white/50 uppercase tracking-widest text-sm animate-pulse">
                      Loading Archives...
                    </div>
                  ) : pastReports.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/30">
                      <Calendar className="w-12 h-12 opacity-50" />
                      <p className="uppercase tracking-widest text-xs">No records found initialized.</p>
                    </div>
                  ) : (
                    pastReports.map((r) => (
                      <div key={r.id} className="bg-[#1a1b1e] border border-white/5 rounded-xl p-6 relative group flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2 items-center">
                            <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold uppercase tracking-widest text-white/70">
                              {r.level}
                            </span>
                            <span className="px-2 py-1 bg-white/5 rounded text-[10px] uppercase tracking-widest text-white/50">
                              {r.mode}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-white/40 ml-2">
                              {typeof r.createdAt !== 'undefined' && 'seconds' in r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteReport(r.id, !('seconds' in (r.createdAt || {})))}
                            className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs uppercase tracking-widest text-white/50 border-l-2 border-indigo-500/50 pl-3">
                          {r.topic}
                        </div>
                        <div className="prose prose-invert prose-sm text-white/80 mt-2">
                          {r.reportText.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Guide Modal */}
        <AnimatePresence>
          {showOnboarding && !isRunning && !showPreTask && !showHistory && !report && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 max-w-sm w-full"
            >
              <div className="bg-[#111113] border border-white/10 p-8 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
                <CustomLogo className="w-16 h-16 mx-auto mb-6" />
                <h2 className="text-xl font-bold tracking-tight mb-2">Welcome to Speaking Buddy</h2>
                <p className="text-white/50 text-sm leading-relaxed mb-6">
                  Select a scenario from the settings panel on the right, review your briefing, and start speaking naturally. We'll track your English level and give you a detailed CEFR report when you finish.
                </p>
                <button 
                  onClick={() => setShowOnboarding(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all border border-white/5 hover:border-white/20"
                >
                  Enter the Lab
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
              className="fixed right-0 top-0 bottom-0 w-80 bg-[#0f0f12] border-l border-white/10 p-6 z-40 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-green-500" />
                  <h2 className="font-bold uppercase tracking-widest text-sm">Dev Console</h2>
                </div>
                <button 
                  onClick={() => setShowDev(false)}
                  className="p-2 -mr-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">Pedagogical Mode</label>
                  <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                    <button 
                      onClick={() => setContext({...context, mode: 'Practice'})}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${context.mode === 'Practice' ? 'bg-green-500/20 text-green-500 shadow-sm' : 'text-gray-500 hover:text-white'}`}
                    >Practice</button>
                    <button 
                      onClick={() => setContext({...context, mode: 'Task'})}
                      className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${context.mode === 'Task' ? 'bg-blue-500/20 text-blue-500 shadow-sm' : 'text-gray-500 hover:text-white'}`}
                    >Task-Based(TBLT)</button>
                  </div>
                </div>

                {context.mode === 'Practice' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase opacity-50 tracking-widest flex justify-between">
                      <span>Target Duration</span>
                      <span className="text-green-500">{context.taskDurationMinutes} mins</span>
                    </label>
                    <input 
                      type="range" 
                      min="2" max="15" step="1"
                      value={context.taskDurationMinutes}
                      onChange={(e) => setContext({...context, taskDurationMinutes: parseInt(e.target.value)})}
                      className="w-full accent-green-500"
                    />
                    <p className="text-[8px] opacity-40 uppercase">AI will naturally try to close the conversation around this mark.</p>
                  </div>
                )}
                
                {context.mode === 'Task' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase opacity-50 tracking-widest">Predefined TBLT Scenarios</label>
                    <select 
                      onChange={(e) => {
                        const scenario = predefinedScenarios.find(s => s.id === e.target.value);
                        if (scenario) {
                          setContext({
                            ...context,
                            level: scenario.level,
                            topic: scenario.topic,
                            objective: scenario.objective,
                            role: scenario.role,
                            icebreaker: scenario.icebreaker
                          });
                        }
                      }}
                      className="w-full bg-[#151619] border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                    >
                      <option value="">-- Start with a Scenario --</option>
                      {predefinedScenarios.map(s => (
                        <option key={s.id} value={s.id}>[{s.level}] {s.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">Proficiency Level</label>
                  <select 
                    value={context.level}
                    onChange={(e) => setContext({...context, level: e.target.value as ProficiencyLevel})}
                    className="w-full bg-[#151619] border border-white/10 p-3 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                  >
                    <option value="A2">A2 (Pre-Intermediate)</option>
                    <option value="B1-B2">B1-B2 (Intermediate)</option>
                    <option value="C1">C1 (Advanced)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">General Topic / Persona</label>
                  <textarea 
                    value={context.topic}
                    onChange={(e) => setContext({...context, topic: e.target.value})}
                    placeholder="e.g. You are a friendly barista. We are at a coffee shop."
                    rows={2}
                    className="w-full bg-[#151619] border border-white/10 p-3 rounded-lg text-sm focus:outline-none focus:border-green-500/50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-50 tracking-widest">
                    {context.mode === 'Task' ? 'Specific Task (TBLT)' : 'Learning Objectives'}
                  </label>
                  <textarea 
                    value={context.objective}
                    onChange={(e) => setContext({...context, objective: e.target.value})}
                    placeholder={context.mode === 'Task' ? "e.g. Student must successfully complain about a cold soup and get a refund." : "e.g. Practice 'used to' and past tense verbs."}
                    rows={3}
                    className="w-full bg-[#151619] border border-white/10 p-3 rounded-lg text-sm focus:outline-none focus:border-green-500/50 resize-none"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 text-[10px] uppercase tracking-widest opacity-30 flex flex-col gap-2">
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
        <footer className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-[9px] uppercase tracking-widest opacity-30">
          <div className="flex gap-4">
            <span>Lat: 37.7749</span>
            <span>Lng: -122.4194</span>
          </div>
          <span>Built for ELT Professionals</span>
        </footer>
      </main>
    </div>
  );
}
