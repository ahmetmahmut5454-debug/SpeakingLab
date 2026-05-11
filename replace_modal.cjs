const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the Pre-Task Modal layout
const oldModalHeader = `<div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <RoleAvatar role={context.role} isActive={false} />
                  </div>`;

const newModalHeader = `
                  {predefinedScenarios.find((s) => s.role === context.role)?.imageUrl ? (
                    <img src={predefinedScenarios.find((s) => s.role === context.role)?.imageUrl} alt="Scenario" className="w-full h-40 object-cover rounded-2xl shadow-inner mb-2" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <RoleAvatar role={context.role} isActive={false} />
                    </div>
                  )}`;

code = code.replace(oldModalHeader, newModalHeader);


// Change the main title of Pre-Task Scenario to have the scenario title instead of just "Scenario Briefing"
const oldTitle = `<h2 className="text-2xl font-bold tracking-tight mb-2">
                    Scenario Briefing
                  </h2>`;
const newTitle = `<h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                    {predefinedScenarios.find((s) => s.role === context.role)?.title || "Scenario Briefing"}
                  </h2>`;

code = code.replace(oldTitle, newTitle);

// Change student briefing background inside scenario
code = code.replace(/<p className="text-white\/80 text-sm leading-relaxed mb-4 bg-\[#15161A\] p-4 rounded-xl border border-white\/10">/g, 
  '<p className="text-slate-700 text-sm leading-relaxed mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">');

// Oh wait, my previous script changed bg-[#15161A] to bg-slate-50 already... let's just make it simpler
code = code.replace(/<p className="text-slate-600\/80 text-sm leading-relaxed mb-4 bg-slate-50 p-4 rounded-xl border border-slate-900\/10">/g, 
  '<p className="text-slate-700 font-medium text-sm leading-relaxed mb-4 bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-inner">');

fs.writeFileSync('src/App.tsx', code);
