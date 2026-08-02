import React from 'react';

interface Props {
  level: string;
}

export const ProficiencyBadge: React.FC<Props> = ({ level }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "A1": return "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20";
      case "A2": return "bg-teal-500 text-white border-teal-400 shadow-teal-500/20";
      case "B1-B2": return "bg-blue-500 text-white border-blue-400 shadow-blue-500/20";
      case "C1": return "bg-purple-500 text-white border-purple-400 shadow-purple-500/20";
      default: return "bg-slate-500 text-white border-slate-400 shadow-slate-500/20";
    }
  };

  return (
    <div className={`absolute -top-1 -left-2 md:-left-3 ${getLevelColor(level)} border rounded-full px-1.5 py-0.5 text-[9px] md:text-[10px] font-black shadow-lg z-20 flex items-center justify-center tracking-wider transform transition-all duration-300 hover:scale-110`}>
      {level}
    </div>
  );
};
