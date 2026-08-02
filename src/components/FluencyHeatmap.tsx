import React from "react";
import { Mic, Bot } from "lucide-react";

interface Props {
  transcript: string[];
}

export const FluencyHeatmap: React.FC<Props> = ({ transcript }) => {
  if (!transcript || transcript.length === 0) return null;

  // Simple heuristic analysis for fluency heatmap
  const renderStudentLine = (line: string) => {
    // Remove the prefix
    const text = line.replace(/^\[Student\]:\s*/, "");
    const words = text.split(/\b/);

    let lastWord = "";
    
    return (
      <p className="leading-relaxed">
        {words.map((word, i) => {
          const lower = word.toLowerCase();
          const isFiller = ["uh", "um", "ah", "er", "hmm", "like"].includes(lower);
          const isRepeated = lower.match(/^[a-z]+$/) && lower === lastWord;
          
          if (word.match(/^[a-zA-Z]+$/)) {
             lastWord = lower;
          }

          let colorClass = "text-emerald-700/80 bg-emerald-100/50"; // Perfect/normal
          let tooltip = "Fluent";

          if (isFiller) {
            colorClass = "text-red-700/80 bg-red-100/80 rounded px-0.5";
            tooltip = "Hesitation (Filler)";
          } else if (isRepeated) {
            colorClass = "text-orange-700/80 bg-orange-100/80 rounded px-0.5";
            tooltip = "Hesitation (Repetition)";
          } else if (word.match(/^\s+$/)) {
            // Whitespace, just return normally without span styles
            return <span key={i}>{word}</span>;
          } else if (!word.match(/[a-zA-Z]/)) {
             // Punctuation
             return <span key={i} className="text-slate-600">{word}</span>;
          }

          return (
            <span key={i} className={`transition-colors cursor-default ${colorClass}`} title={tooltip}>
              {word}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-900/10">
      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-4">
        Session Transcript & Fluency Heatmap
      </h3>
      <div className="flex gap-4 mb-4 text-xs font-medium text-slate-600">
         <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></span> Fluent</div>
         <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></span> Repetition</div>
         <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span> Filler / Hesitation</div>
      </div>
      <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-900/5 max-h-96 overflow-y-auto custom-scrollbar">
        {transcript.map((line, i) => {
          const isStudent = line.startsWith("[Student]:");
          const isTutor = line.startsWith("[Tutor]:");

          if (!isStudent && !isTutor) {
             return <div key={i} className="text-sm text-slate-500 italic">{line}</div>;
          }

          return (
            <div key={i} className={`flex gap-3 ${isStudent ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isStudent ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {isStudent ? <Mic className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`flex flex-col max-w-[80%] ${isStudent ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {isStudent ? "You" : "Tutor"}
                </span>
                <div className={`p-3 rounded-2xl text-sm ${isStudent ? 'bg-indigo-50 border border-indigo-100 text-slate-800 rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                  {isStudent ? renderStudentLine(line) : <p>{line.replace(/^\[Tutor\]:\s*/, "")}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
