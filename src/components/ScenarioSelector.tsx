import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ArrowLeft, Check, Globe } from "lucide-react";
import { predefinedScenarios, Scenario } from "../lib/scenarios";

const LANGUAGES = [
  { name: "English", code: "en-US", flag: "🇬🇧" },
  { name: "Spanish", code: "es-ES", flag: "🇪🇸" },
  { name: "French", code: "fr-FR", flag: "🇫🇷" },
  { name: "German", code: "de-DE", flag: "🇩🇪" },
  { name: "Italian", code: "it-IT", flag: "🇮🇹" },
  { name: "Turkish", code: "tr-TR", flag: "🇹🇷" },
];

interface ScenarioSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scenario: Scenario | null, language?: {name: string, code: string}, freeLevel?: string) => void;
  currentScenarioId: string | null;
  currentTargetLanguageCode?: string;
}

export const ScenarioSelector = ({
  isOpen,
  onClose,
  onSelect,
  currentScenarioId,
  currentTargetLanguageCode,
}: ScenarioSelectorProps) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedScenarioForLang, setSelectedScenarioForLang] = useState<Scenario | "FREE" | null>(null);
  const [freePracticeLevel, setFreePracticeLevel] = useState<string>("B1");
  const [selectedLang, setSelectedLang] = useState(() => {
    return LANGUAGES.find(l => l.code === currentTargetLanguageCode) || LANGUAGES[0];
  });

  useEffect(() => {
    if (isOpen) {
      const matched = LANGUAGES.find(l => l.code === currentTargetLanguageCode) || LANGUAGES[0];
      setSelectedLang(matched);
    }
  }, [isOpen, currentTargetLanguageCode]);

  const allGroups = [
    { id: "A1", title: "A1 (Beginner)", desc: "Basic vocabulary and simple phrases." },
    { id: "A2", title: "A2 (Elementary)", desc: "Everyday situations and short conversations." },
    { id: "B1-B2", title: "B1-B2 (Intermediate)", desc: "More complex topics and natural fluency." },
    { id: "C1", title: "C1 (Advanced)", desc: "Abstract topics, idiomatic expressions, and debate." },
    { id: "IELTS", title: "IELTS Preparation", desc: "Mock exams and topic-specific IELTS tasks." },
    { id: "FREE", title: "Free Practice", desc: "Open-ended conversation on any topic." },
  ];

  const getScenariosForGroup = (groupId: string) => {
    if (groupId === "IELTS") {
      return predefinedScenarios.filter((s) => s.category === "IELTS Preparation");
    }
    return predefinedScenarios.filter((s) => s.level === groupId && s.category !== "IELTS Preparation");
  };

  const handleStart = () => {
    if (selectedScenarioForLang === "FREE") {
      onSelect(null, selectedLang, freePracticeLevel);
    } else {
      onSelect(selectedScenarioForLang, selectedLang);
    }
    onClose();
    // Reset state after close animation
    setTimeout(() => {
      setSelectedGroup(null);
      setSelectedScenarioForLang(null);
    }, 300);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSelectedGroup(null);
      setSelectedScenarioForLang(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white border border-slate-200 p-0 rounded-2xl md:rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10 shrink-0">
              <div className="flex items-center gap-4">
                {(selectedGroup || selectedScenarioForLang) && (
                  <button
                    onClick={() => {
                      if (selectedScenarioForLang) setSelectedScenarioForLang(null);
                      else setSelectedGroup(null);
                    }}
                    className="p-2 -ml-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-all text-slate-500"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-800">
                    {selectedScenarioForLang
                      ? "Select Language"
                      : selectedGroup
                      ? allGroups.find(g => g.id === selectedGroup)?.title
                      : "Choose Your Level"}
                  </h2>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">
                    {selectedScenarioForLang
                      ? "Choose the language you want to practice in."
                      : selectedGroup
                      ? "Select a scenario to start practicing."
                      : "Select a level or category to see scenarios."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="overflow-y-auto flex-1 p-6 bg-slate-50 custom-scrollbar">
              <AnimatePresence mode="wait">
                {/* Step 3: Language Selection */}
                {selectedScenarioForLang ? (
                  <motion.div
                    key="language-selection"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                          <Globe className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-800">
                            {selectedScenarioForLang === "FREE" ? "Free Practice" : selectedScenarioForLang.title}
                          </h3>
                          <p className="text-slate-500 text-sm mt-1">
                            {selectedScenarioForLang === "FREE" 
                              ? "Talk about anything you want! The AI will chat with you freely."
                              : selectedScenarioForLang.studentBriefing || selectedScenarioForLang.topic}
                          </p>
                        </div>
                      </div>
                    </div>


                    {selectedScenarioForLang === "FREE" && (
                      <div className="mb-4">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-3 px-1">
                          Select Practice Level
                        </h4>
                        <div className="grid grid-cols-5 gap-2">
                          {["A1", "A2", "B1", "B2", "C1"].map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setFreePracticeLevel(lvl)}
                              className={`py-3 rounded-xl border-2 font-bold transition-all text-center ${
                                freePracticeLevel === lvl
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/30"
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-widest text-slate-400 mb-3 px-1">
                        Select Target Language
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => setSelectedLang(lang)}
                            className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all text-left ${
                              selectedLang.code === lang.code
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                            }`}
                          >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="font-bold text-slate-700 flex-1">{lang.name}</span>
                            {selectedLang.code === lang.code && (
                              <Check className="w-5 h-5 text-indigo-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      onClick={handleStart}
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                    >
                      Start Practice
                    </button>
                  </motion.div>
                ) : 
                
                /* Step 2: Scenarios List */
                selectedGroup ? (
                  <motion.div
                    key="scenario-selection"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 gap-3"
                  >
                    {selectedGroup === "FREE" ? (
                      <div
                        onClick={() => setSelectedScenarioForLang("FREE")}
                        className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg">Free Practice</h4>
                            <p className="text-slate-500 text-sm mt-1">Talk freely without a specific scenario.</p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      getScenariosForGroup(selectedGroup).map((scenario) => (
                        <div
                          key={scenario.id}
                          onClick={() => setSelectedScenarioForLang(scenario)}
                          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all group flex gap-4 items-center"
                        >
                          {scenario.imageUrl && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 hidden sm:block">
                              <img src={scenario.imageUrl} alt={scenario.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-base md:text-lg truncate">{scenario.title}</h4>
                            <p className="text-slate-500 text-xs md:text-sm mt-1 line-clamp-2 leading-relaxed">
                              {scenario.studentBriefing || scenario.topic}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : 
                
                /* Step 1: Group Selection */
                (
                  <motion.div
                    key="group-selection"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {allGroups.map((group) => (
                      <div
                        key={group.id}
                        onClick={() => setSelectedGroup(group.id)}
                        className={`p-5 rounded-2xl bg-white border cursor-pointer transition-all group flex flex-col justify-between h-32 ${
                          group.id === "FREE" 
                            ? "border-emerald-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100/50" 
                            : "border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50"
                        }`}
                      >
                        <div>
                          <h3 className={`font-bold text-lg mb-1 ${group.id === "FREE" ? "text-emerald-700" : "text-slate-800"}`}>
                            {group.title}
                          </h3>
                          <p className="text-slate-500 text-xs">{group.desc}</p>
                        </div>
                        <div className="flex justify-end mt-auto">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              group.id === "FREE" ? "bg-emerald-50 group-hover:bg-emerald-100" : "bg-slate-50 group-hover:bg-indigo-50"
                           }`}>
                             <ChevronRight className={`w-4 h-4 ${group.id === "FREE" ? "text-emerald-500" : "text-slate-400 group-hover:text-indigo-500"}`} />
                           </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
