const fs = require('fs');

let content = fs.readFileSync('src/components/Character.tsx', 'utf8');

content = content.replace(
  'const isBored = expression === "bored";',
  'const isBored = expression === "bored";\n\n  if (type === "lily" && isBored) {\n    return (\n      <div className={`relative ${className} flex items-center justify-center`}>\n        <motion.img\n          src="/bored_avatar.png"\n          alt="Bored Avatar"\n          className="w-full h-full object-contain drop-shadow-2xl"\n          initial={{ y: 10, opacity: 0 }}\n          animate={{ y: [10, 0, 10], opacity: 1 }}\n          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}\n        />\n      </div>\n    );\n  }'
);

fs.writeFileSync('src/components/Character.tsx', content);
