const fs = require('fs');

let content = fs.readFileSync('src/components/Guide.tsx', 'utf8');

content = content.replace(
  'import { Character } from "./Character";',
  'import { Character } from "./Character";\nimport { X } from "lucide-react";'
);

content = content.replace(
  'const [state, setState] = useState<"greeting" | "bored" | "hidden">(\n    "greeting",\n  );',
  'const [state, setState] = useState<"greeting" | "bored" | "hidden">("greeting");\n  const [isDismissed, setIsDismissed] = useState(false);'
);

content = content.replace(
  'useEffect(() => {\n    if (isRunning) {\n      setState("hidden");\n      return;\n    }',
  'useEffect(() => {\n    if (isRunning || isDismissed) {\n      setState("hidden");\n      return;\n    }'
);

content = content.replace(
  '[isRunning]);',
  '[isRunning, isDismissed]);'
);

content = content.replace(
  'className="bg-white px-5 py-4 md:py-5 md:px-6 rounded-3xl rounded-bl-none shadow-xl border border-slate-200 mb-12 -ml-6 relative hover:shadow-2xl transition-shadow cursor-pointer max-w-[200px] md:max-w-[250px] z-20"\n          onClick={onStartPractice}',
  `className="bg-white px-5 py-4 md:py-5 md:px-6 md:pr-10 rounded-3xl rounded-bl-none shadow-xl border border-slate-200 mb-12 -ml-6 relative hover:shadow-2xl transition-shadow cursor-pointer max-w-[200px] md:max-w-[250px] z-20 group"
          onClick={onStartPractice}`
);

content = content.replace(
  '<p className="font-extrabold text-slate-800 text-sm md:text-base leading-tight">',
  `<button
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <p className="font-extrabold text-slate-800 text-sm md:text-base leading-tight mt-1">`
);

fs.writeFileSync('src/components/Guide.tsx', content);
