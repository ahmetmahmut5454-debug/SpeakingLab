import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, X, Clock, Play, Mic, Maximize2, PenTool, Sparkles, CheckSquare } from 'lucide-react';

interface CueCardOverlayProps {
  topic: string;
  onClose: () => void;
}

export function CueCardOverlay({ topic, onClose }: CueCardOverlayProps) {
  const [timeLeft, setTimeLeft] = useState(60); // 1 min preparation timer
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(120); // 2 min speaking timer
  const [phase, setPhase] = useState<'preparation' | 'speaking'>('preparation');
  const [isMinimized, setIsMinimized] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const audioCtxRef = useRef<AudioContext | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const playBeep = (isLast: boolean = false) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(isLast ? 1046.50 : 880, audioCtx.currentTime); 
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (isLast ? 0.4 : 0.1));

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + (isLast ? 0.4 : 0.1));
    } catch (e) {
      console.warn("AudioContext not supported or couldn't play beep", e);
    }
  };

  // Preparation 60s timer effect
  useEffect(() => {
    if (phase === 'preparation' && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      
      if (timeLeft <= 5 && timeLeft > 0) {
        playBeep(timeLeft === 1);
      }
      
      return () => clearInterval(timerId);
    } else if (phase === 'preparation' && timeLeft === 0) {
      playBeep(true);
      setPhase('speaking');
    }
  }, [phase, timeLeft]);

  // Speaking 120s (2-minute) timer effect
  useEffect(() => {
    if (phase === 'speaking' && speakingTimeLeft > 0) {
      const timerId = setInterval(() => {
        setSpeakingTimeLeft((prev) => prev - 1);
      }, 1000);

      if (speakingTimeLeft === 60) {
        // 1-minute speech milestone reached
        playBeep(false);
      } else if (speakingTimeLeft <= 5 && speakingTimeLeft > 0) {
        playBeep(speakingTimeLeft === 1);
      }

      return () => clearInterval(timerId);
    } else if (phase === 'speaking' && speakingTimeLeft === 0) {
      playBeep(true);
    }
  }, [phase, speakingTimeLeft]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
         audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const addNoteSnippet = (snippet: string) => {
    setNotes(prev => prev ? `${prev}\n• ${snippet}` : `• ${snippet}`);
  };

  return (
    <>
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-20 z-[90] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition-colors text-white"
            onClick={() => setIsMinimized(false)}
          >
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${phase === 'preparation' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
               {phase === 'preparation' ? <Clock className="w-5 h-5" /> : <Mic className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">IELTS Cue Card</h3>
              <p className="text-xs text-slate-300 font-medium">
                 {phase === 'preparation' ? `${timeLeft}s Hazırlık Süresi` : `Kalan Konuşma: ${formatTime(speakingTimeLeft)}`}
              </p>
            </div>
            <Maximize2 className="w-4 h-4 text-slate-400 ml-2" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-[2rem] max-w-3xl w-full shadow-2xl flex flex-col overflow-hidden relative border border-slate-200 my-auto max-h-[90vh]"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between p-5 sm:px-8 sm:pt-6 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight leading-tight flex items-center gap-2">
                      IELTS Speaking Part 2
                      <span className="text-[10px] uppercase font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md tracking-wider">Cue Card</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      1 dakika hazırlık yapın, ardından 1-2 dakika kesintisiz konuşun.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    title="Küçült"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
                {/* Topic Card */}
                <div className="bg-amber-500/5 rounded-2xl p-6 border border-amber-500/20 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Konu Başlığı ve Detaylar
                  </h3>
                  <div className="text-slate-800 leading-relaxed font-semibold whitespace-pre-wrap text-base sm:text-lg">
                    {topic}
                  </div>
                </div>

                {/* Preparation Notes Scratchpad */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-indigo-600" />
                      Hazırlık Notlarım & Anahtar Kelimeler (1 Dakikalık Taslak)
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">İsteğe bağlı, ekranınızda görünür kalır</span>
                  </div>

                  {/* Quick structure helpers */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => addNoteSnippet('Ne zaman & Nerede oldu?')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-medium rounded-lg transition-all"
                    >
                      + Ne Zaman/Nerede
                    </button>
                    <button
                      type="button"
                      onClick={() => addNoteSnippet('Kiminle birlikteydim?')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-medium rounded-lg transition-all"
                    >
                      + Kiminle
                    </button>
                    <button
                      type="button"
                      onClick={() => addNoteSnippet('Neden önemli / Nasıl hissettim?')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-medium rounded-lg transition-all"
                    >
                      + Duygu/Düşünce
                    </button>
                    <button
                      type="button"
                      onClick={() => addNoteSnippet('İyi bağlaçlar: Furthermore, Consequently, In hindsight')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 text-xs font-medium rounded-lg transition-all"
                    >
                      + Bağlaçlar
                    </button>
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Buraya konuşurken bakmak istediğiniz hatırlatıcı kelimeleri ve kısa notları yazabilirsiniz..."
                    rows={3}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-sans"
                  />
                </div>
              </div>

              {/* Footer / Timer */}
              <div className={`p-5 sm:px-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-500 ${phase === 'preparation' ? 'bg-indigo-50/90 border-indigo-100' : 'bg-emerald-50/90 border-emerald-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`relative flex items-center justify-center min-w-[3.75rem] h-15 px-3 rounded-2xl border-4 ${phase === 'preparation' ? 'border-indigo-200 bg-white text-indigo-600' : speakingTimeLeft === 0 ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-white text-emerald-600'} shadow-sm`}>
                    {phase === 'preparation' ? (
                       <span className="text-xl font-extrabold tabular-nums z-10">
                         {timeLeft}s
                       </span>
                    ) : (
                       <span className="text-lg font-black tabular-nums z-10 flex items-center gap-1">
                         <Mic className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
                         {formatTime(speakingTimeLeft)}
                       </span>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${phase === 'preparation' ? 'text-indigo-900' : 'text-emerald-900'}`}>
                      {phase === 'preparation' ? '1 DAKİKALIK HAZIRLIK SÜRESİ' : '2 DAKİKALIK KONUŞMA ZAMANI'}
                    </h3>
                    <p className={`text-xs font-medium ${phase === 'preparation' ? 'text-indigo-700' : 'text-emerald-700'}`}>
                      {phase === 'preparation'
                        ? 'Süre bitince otomatik konuşmaya geçilir veya hemen başlatabilirsiniz.'
                        : speakingTimeLeft > 60
                          ? `Asgari 1-2 dakika kesintisiz konuşmanız önerilir (${formatTime(speakingTimeLeft)} kaldı)`
                          : speakingTimeLeft > 0
                            ? `Asgari 1 dakikalık konuşma barajı aşıldı (${formatTime(speakingTimeLeft)} kaldı)`
                            : 'Tam 2 dakika doldu! Konuşmanızı tamamlayabilirsiniz.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  {phase === 'preparation' ? (
                    <button
                      onClick={() => setPhase('speaking')}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Konuşmaya Başla
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Tamamla & Devam Et
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

