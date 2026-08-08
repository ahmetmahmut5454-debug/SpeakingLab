const fs = require('fs');

const filepath = 'src/App.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const replacement = `<div className="flex flex-wrap gap-2 mt-2">
                                        {struggledText.split(/[,;]+/).map((chunk, i) => {
                                          const word = chunk.trim().replace(/[^a-zA-Z]/g, '');
                                          if (!word) return null;
                                          return (
                                            <button 
                                              key={i}
                                              onClick={() => setPronunciationWord(word)}
                                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-bold transition-colors shadow-sm active:scale-95"
                                            >
                                              <Mic className="w-3.5 h-3.5" />
                                              {word}
                                            </button>
                                          );
                                        })}
                                      </div>`;

content = content.replace(/<p className="text-sm text-orange-800 font-medium">\s*\{struggledText\}\s*<\/p>/g, replacement);

fs.writeFileSync(filepath, content);
