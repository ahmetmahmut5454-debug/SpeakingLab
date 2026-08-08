const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'const [report, setReport] = useState<string | null>(null);',
  'const [report, setReport] = useState<LocalReport | null>(null);\n  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);'
);

content = content.replace(
  'setIsRunning(true);',
  'setIsRunning(true);\n        setSessionStartTime(Date.now());'
);

// In handleStopAndReport
content = content.replace(
  '    const sessionReport = await botRef.current.generateReport(context, currentTranscript);\n    setReport(sessionReport);\n    setGeneratingReport(false);\n\n    // Save to IndexedDB locally\n    const hasReport = sessionReport && !sessionReport.includes("❌");\n    const newReport: LocalReport = {\n      id: Date.now().toString(),\n      createdAt: new Date(),\n      createdAtTime: Date.now(),\n      level: context.level,\n      mode: context.mode,\n      topic: context.topic,\n      reportText: hasReport ? sessionReport : "",\n      transcript: currentTranscript,\n      synced: false,\n    };\n    await saveLocalReport(newReport);\n    setPastReports((prev) => [newReport, ...prev]);',
  `    const sessionReport = await botRef.current.generateReport(context, currentTranscript);
    setGeneratingReport(false);

    // Save to IndexedDB locally
    const hasReport = sessionReport && !sessionReport.includes("❌");
    const newReport: LocalReport = {
      id: Date.now().toString(),
      createdAt: new Date(),
      createdAtTime: Date.now(),
      level: context.level,
      mode: context.mode,
      topic: context.topic,
      reportText: hasReport ? sessionReport : "",
      transcript: currentTranscript,
      synced: false,
      durationMs: sessionStartTime ? Date.now() - sessionStartTime : undefined,
    };
    await saveLocalReport(newReport);
    setPastReports((prev) => [newReport, ...prev]);
    setReport(newReport);`
);

// Fix report usage in the modal
content = content.replace(
  `                  <LayoutDashboard className="w-6 h-6 text-emerald-500" />
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight">
                    Session Analysis
                  </h2>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 p-4 sm:p-8">
                  {(() => {
                    const match = report.match(/(?:\\*\\s*)?\\*?\\*?Struggled Sounds\\/Words:\\*?\\*?\\s*(.+)/i);
                    const struggledText = match ? match[1] : null;
                    const cleanReport = report.replace(/(?:\\*\\s*)?\\*?\\*?Struggled Sounds\\/Words:\\*?\\*?\\s*(.+)\\n?/i, '');`,
  `                  <LayoutDashboard className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight">
                      {report.mode === "Task" ? "Scenario Task" : report.mode === "IELTS" ? "IELTS Mock" : "Free Practice"} ({report.level})
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                      <span>{new Date(report.createdAtTime).toLocaleDateString()}</span>
                      {report.durationMs && (
                        <>
                          <span>•</span>
                          <span>{Math.round(report.durationMs / 60000)}m {Math.round((report.durationMs % 60000) / 1000)}s</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 p-4 sm:p-8">
                  {(() => {
                    const match = report.reportText.match(/(?:\\*\\s*)?\\*?\\*?Struggled Sounds\\/Words:\\*?\\*?\\s*(.+)/i);
                    const struggledText = match ? match[1] : null;
                    const cleanReport = report.reportText.replace(/(?:\\*\\s*)?\\*?\\*?Struggled Sounds\\/Words:\\*?\\*?\\s*(.+)\\n?/i, '');`
);

fs.writeFileSync('src/App.tsx', content);
