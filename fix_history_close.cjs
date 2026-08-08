const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<\/div>\s*<\/div>\s*<\/div>\s*<\/motion\.div>\s*\)\}\s*<\/AnimatePresence>\s*\{\/\* Leaderboard Modal \*\/\}/;

content = content.replace(
  regex,
  '</div>\n                </div>\n              </div>\n            </motion.div>\n            );\n          })()}\n        </AnimatePresence>\n        {/* Leaderboard Modal */}'
);

fs.writeFileSync('src/App.tsx', content);
