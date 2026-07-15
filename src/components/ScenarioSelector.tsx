import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check } from "lucide-react";
import { predefinedScenarios, Scenario } from "../lib/scenarios";

interface ScenarioSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scenario: Scenario | null) => void;
  currentScenarioId: string | null; // null for practice
}

export const ScenarioSelector = ({
  isOpen,
  onClose,
  onSelect,
  currentScenarioId,
}: ScenarioSelectorProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
                  Select a Scenario
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Choose a situation to practice your English skills.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 -mr-2 space-y-8">
              {/* Free Practice Option */}
              <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4 px-1 border-b pb-2">
                  Free Practice Mode
                </h3>
                <div
                  onClick={() => {
                    onSelect(null);
                    onClose();
                  }}
                  className={`relative p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300 ${
                    currentScenarioId === null
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">
                        Free Practice
                      </h4>
                      <p className="text-slate-600 text-sm mt-2">
                        Talk about anything you want! The AI will chat with you
                        freely without a specific role or objective.
                      </p>
                    </div>
                    {currentScenarioId === null && (
                      <div className="bg-emerald-500 text-white p-1 rounded-full">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Categorized Scenarios */}
              {Array.from(
                new Set(predefinedScenarios.map((s) => s.category || "General")),
              ).map((category) => (
                <div key={category}>
                  <h3 className="text-lg font-bold text-slate-700 mb-4 px-1 border-b pb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {predefinedScenarios
                      .filter((s) => (s.category || "General") === category)
                      .map((scenario) => (
                        <div
                          key={scenario.id}
                          onClick={() => {
                            onSelect(scenario);
                            onClose();
                          }}
                          className={`relative p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300 flex flex-col ${
                            currentScenarioId === scenario.id
                              ? "border-blue-500 bg-blue-50 shadow-md"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm">
                              {scenario.level}
                            </span>
                            {currentScenarioId === scenario.id && (
                              <div className="bg-blue-500 text-white p-1 rounded-full shrink-0">
                                <Check className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          
                          <h4 className="font-bold text-slate-800 text-lg mb-2 leading-tight">
                            {scenario.title}
                          </h4>
                          
                          <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
                            {scenario.studentBriefing || scenario.topic}
                          </p>

                          {scenario.imageUrl && (
                            <div className="w-full h-32 rounded-xl overflow-hidden mt-auto">
                              <img src={scenario.imageUrl} alt={scenario.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
