const fs = require('fs');

let content = fs.readFileSync('src/components/ProgressDashboard.tsx', 'utf8');

// Insert radarData calculation right after insights
const radarDataCode = `  const radarData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    // find the latest valid score for each metric
    const getLatest = (metric) => {
      for (let i = chartData.length - 1; i >= 0; i--) {
        if (chartData[i][metric] !== null && chartData[i][metric] !== undefined) {
          return chartData[i][metric];
        }
      }
      return 0; // fallback
    };

    return [
      { subject: 'Fluency', score: getLatest('Fluency'), fullMark: 9 },
      { subject: 'Vocabulary', score: getLatest('Vocabulary'), fullMark: 9 },
      { subject: 'Grammar', score: getLatest('Grammar'), fullMark: 9 },
      { subject: 'Pronunciation', score: getLatest('Pronunciation'), fullMark: 9 },
    ];
  }, [chartData]);`;

content = content.replace("if (!hasData) {", radarDataCode + "\n\n  if (!hasData) {");

// Replace the render part
const oldRender = `<div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#1e293b' }}
              labelStyle={{ fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="Overall" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
            <Line type="monotone" dataKey="Fluency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={true} animationDuration={1500} animationBegin={200} animationEasing="ease-out" />
            <Line type="monotone" dataKey="Grammar" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={true} animationDuration={1500} animationBegin={400} animationEasing="ease-out" />
            <Line type="monotone" dataKey="Vocabulary" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={true} animationDuration={1500} animationBegin={600} animationEasing="ease-out" />
          </LineChart>
        </ResponsiveContainer>
      </div>`;

const newRender = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4">
        <div className="h-64 w-full flex flex-col">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Score Progression</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 9]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1e293b' }}
                labelStyle={{ fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="Overall" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
              <Line type="monotone" dataKey="Fluency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={true} animationDuration={1500} animationBegin={200} animationEasing="ease-out" />
              <Line type="monotone" dataKey="Grammar" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={true} animationDuration={1500} animationBegin={400} animationEasing="ease-out" />
              <Line type="monotone" dataKey="Vocabulary" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} connectNulls isAnimationActive={true} animationDuration={1500} animationBegin={600} animationEasing="ease-out" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="h-64 w-full flex flex-col">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Current Proficiency Profile</h4>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 9]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Current Skills" dataKey="score" stroke="#6366f1" fill="#818cf8" fillOpacity={0.5} isAnimationActive={true} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', color: '#1e293b', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>`;

content = content.replace(oldRender, newRender);

fs.writeFileSync('src/components/ProgressDashboard.tsx', content);
