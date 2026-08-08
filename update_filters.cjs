const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'const [pastReports, setPastReports] = useState<LocalReport[]>([]);',
  'const [pastReports, setPastReports] = useState<LocalReport[]>([]);\n  const [historyLevelFilter, setHistoryLevelFilter] = useState<string>("All");\n  const [historyModeFilter, setHistoryModeFilter] = useState<string>("All");'
);

// We need to find the showHistory render.
content = content.replace(
  '{showHistory && (',
  '{showHistory && (() => {\n            const filteredReports = pastReports.filter(r => {\n              if (historyLevelFilter !== "All" && r.level !== historyLevelFilter) return false;\n              if (historyModeFilter !== "All" && r.mode !== historyModeFilter) return false;\n              return true;\n            });\n            return ('
);

content = content.replace(
  '                    </button>\n                    <button\n                      onClick={() => setShowHistory(false)}\n                      className="px-4 py-2 bg-slate-900/5 border border-slate-900/10 rounded-lg hover:bg-slate-900/10 font-bold uppercase tracking-widest transition-all text-xs"\n                    >\n                      Close\n                    </button>\n                  </div>\n                </div>\n                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-4 sm:p-8">',
  `                    </button>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="px-4 py-2 bg-slate-900/5 border border-slate-900/10 rounded-lg hover:bg-slate-900/10 font-bold uppercase tracking-widest transition-all text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border-b border-slate-100 px-4 sm:px-8 py-3 flex flex-wrap gap-4 items-center shrink-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters:</span>
                  <select
                    value={historyLevelFilter}
                    onChange={(e) => setHistoryLevelFilter(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="All">All Levels</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                  <select
                    value={historyModeFilter}
                    onChange={(e) => setHistoryModeFilter(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="All">All Modes</option>
                    <option value="IELTS">IELTS Mock</option>
                    <option value="Task">Scenario Task</option>
                    <option value="Practice">Free Practice</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-4 sm:p-8">`
);

content = content.replace(
  'LevelProgress reports={pastReports}',
  'LevelProgress reports={filteredReports}'
);
content = content.replace(
  'LearningPath reports={pastReports}',
  'LearningPath reports={filteredReports}'
);
content = content.replace(
  'ScoreTrendChart reports={pastReports}',
  'ScoreTrendChart reports={filteredReports}'
);
content = content.replace(
  'ProgressDashboard reports={pastReports}',
  'ProgressDashboard reports={filteredReports}'
);
content = content.replace(
  'AIProgressInsights reports={pastReports}',
  'AIProgressInsights reports={filteredReports}'
);

content = content.replace(
  'Total Sessions\n                      </div>\n                      <div className="text-3xl font-light text-slate-900">\n                        {pastReports.length}',
  'Total Sessions\n                      </div>\n                      <div className="text-3xl font-light text-slate-900">\n                        {filteredReports.length}'
);

content = content.replace(
  'Object.entries(\n                          pastReports.reduce(',
  'Object.entries(\n                          filteredReports.reduce('
);

content = content.replace(
  'loadingHistory ? (\n                    <div className="flex-1 flex items-center justify-center text-slate-600/50 uppercase tracking-widest text-sm animate-pulse">\n                      Loading Archives...\n                    </div>\n                  ) : pastReports.length === 0 ? (\n                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600/30">\n                      <Calendar className="w-12 h-12 opacity-50" />\n                      <p className="uppercase tracking-widest text-xs">\n                        No records found initialized.\n                      </p>\n                    </div>\n                  ) : (\n                    pastReports.map((r) => (',
  'loadingHistory ? (\n                    <div className="flex-1 flex items-center justify-center text-slate-600/50 uppercase tracking-widest text-sm animate-pulse">\n                      Loading Archives...\n                    </div>\n                  ) : filteredReports.length === 0 ? (\n                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-600/30">\n                      <Calendar className="w-12 h-12 opacity-50" />\n                      <p className="uppercase tracking-widest text-xs">\n                        No records found for the selected filters.\n                      </p>\n                    </div>\n                  ) : (\n                    filteredReports.map((r) => ('
);

content = content.replace(
  '</AnimatePresence>\n        {showPreTask && (',
  '            );\n          })()}\n          </AnimatePresence>\n        {showPreTask && ('
);

content = content.replace(
  '!loadingHistory && pastReports.length > 0',
  '!loadingHistory && filteredReports.length > 0'
);

fs.writeFileSync('src/App.tsx', content);
