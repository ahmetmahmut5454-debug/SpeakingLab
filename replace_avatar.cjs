const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const dynamicAvatarReplacement = `const DynamicAvatar = ({
  className,
  outfit,
}: {
  className?: string;
  outfit?: string;
}) => {
  let seed = "Leo";
  let bg = "b6e3f4";
  if (outfit === "outfit_glasses") {
    seed = "Molly";
    bg = "ffd5dc";
  } else if (outfit === "outfit_cap") {
    seed = "Jack";
    bg = "d1d4f9";
  } else if (outfit === "outfit_crown") {
    seed = "King";
    bg = "c0aede";
  }
  return (
    <img 
      src={\`https://api.dicebear.com/7.x/lorelei/svg?seed=\${seed}&backgroundColor=\${bg}\`} 
      alt="Avatar" 
      className={\`rounded-full object-cover shadow-inner \${className}\`}
    />
  );
};`;

// We use regex to replace the old DynamicAvatar component
// The old one is an arrow function that returns an <svg>...</svg>
code = code.replace(/const DynamicAvatar = \(\{[\s\S]*?className,\s*outfit,[\s\S]*?\}\) => \([\s\S]*?<\/svg>\n\);/m, dynamicAvatarReplacement);


// Update Onboarding Text
code = code.replace(/Welcome to Speaking Buddy/g, "Let's do practice together!");

// Replace WalkingBadge to be anchored at the bottom without floating
code = code.replace(/y: isClicked \? -10 : 0/g, 'y: isClicked ? -10 : 0');
code = code.replace(/className="fixed bottom-24/g, 'className="fixed bottom-10 origin-bottom');

// Change hover effect
code = code.replace(/scaleY: isClicked \? 1.5 : isHovered \? 1.2 : 1/g, 'scaleY: isHovered ? 1.1 : 1');

// Change the background colors for pre-task
code = code.replace(/<div className="bg-white border border-slate-900\/10 p-10/g, '<div className="bg-white border-4 border-slate-200 p-10');

// Write back
fs.writeFileSync('src/App.tsx', code);
