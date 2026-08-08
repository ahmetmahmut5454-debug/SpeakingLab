const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'const VoiceBar = ({ level, color }: { level: number; color: string }) => {',
  'const VoiceBar = ({ level, color, isActive = false, delayOffset = 0 }: { level: number; color: string; isActive?: boolean; delayOffset?: number }) => {'
);

content = content.replace(
  `        const active = level > threshold;
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: active ? color : "#1e1e1e",
              opacity: active ? 1 : 0.2,
              boxShadow: active ? \`0 0 10px \${color}\` : "none",
            }}
            className="w-full h-2 rounded-sm"
          />
        );`,
  `        const active = level > threshold;
        // Hardware-inspired subtle breathing for the first two bars when active but silent
        const isBreathing = isActive && level <= 12 && i < 2;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={
              isBreathing
                ? {
                    backgroundColor: [color, "#1e1e1e", color],
                    opacity: [0.5, 0.15, 0.5],
                    boxShadow: [\`0 0 8px \${color}40\`, "none", \`0 0 8px \${color}40\`],
                  }
                : {
                    backgroundColor: active ? color : "#1e1e1e",
                    opacity: active ? 1 : 0.2,
                    boxShadow: active ? \`0 0 10px \${color}\` : "none",
                  }
            }
            transition={
              isBreathing
                ? {
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delayOffset + i * 0.3,
                  }
                : { type: "tween", duration: 0.1 }
            }
            className="w-full h-2 rounded-sm"
          />
        );`
);

content = content.replace(
  '<VoiceBar level={userLevel} color="#34d399" />',
  '<VoiceBar level={userLevel} color="#34d399" isActive={isRunning} delayOffset={0} />'
);
content = content.replace(
  '<VoiceBar level={userLevel * 0.9} color="#34d399" />',
  '<VoiceBar level={userLevel * 0.9} color="#34d399" isActive={isRunning} delayOffset={0.2} />'
);
content = content.replace(
  '<VoiceBar level={userLevel * 1.1} color="#34d399" />',
  '<VoiceBar level={userLevel * 1.1} color="#34d399" isActive={isRunning} delayOffset={0.4} />'
);

content = content.replace(
  '<VoiceBar level={botLevel * 1.1} color="#60a5fa" />',
  '<VoiceBar level={botLevel * 1.1} color="#60a5fa" isActive={isRunning} delayOffset={0.4} />'
);
content = content.replace(
  '<VoiceBar level={botLevel} color="#60a5fa" />',
  '<VoiceBar level={botLevel} color="#60a5fa" isActive={isRunning} delayOffset={0} />'
);
content = content.replace(
  '<VoiceBar level={botLevel * 0.9} color="#60a5fa" />',
  '<VoiceBar level={botLevel * 0.9} color="#60a5fa" isActive={isRunning} delayOffset={0.2} />'
);

fs.writeFileSync('src/App.tsx', content);
