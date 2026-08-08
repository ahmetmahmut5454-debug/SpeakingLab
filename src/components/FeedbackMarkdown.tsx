import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Mic } from 'lucide-react';

export function FeedbackMarkdown({ content, onPracticeWord }: { content: string, onPracticeWord?: (word: string) => void }) {
  const [wordDefinition, setWordDefinition] = useState<{ word: string; definition: string; phonetic: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleWordClick = async (word: string) => {
    // Strip punctuation if any sneaked in
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (!cleanWord) return;
    
    setLoading(true);
    setWordDefinition({ word: cleanWord, definition: "Loading...", phonetic: "" });
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
      if (res.ok) {
        const data = await res.json();
        const firstMeaning = data[0]?.meanings[0]?.definitions[0]?.definition;
        const phonetic = data[0]?.phonetics?.find((p: any) => p.text)?.text || data[0]?.phonetic || '';
        if (firstMeaning) {
          setWordDefinition({
            word: data[0].word,
            definition: firstMeaning,
            phonetic
          });
          setLoading(false);
          return;
        }
      }
      setWordDefinition({
        word: cleanWord,
        definition: "Definition not found.",
        phonetic: ""
      });
    } catch (err) {
      console.error(err);
      setWordDefinition({
        word: cleanWord,
        definition: "Error fetching definition.",
        phonetic: ""
      });
    }
    setLoading(false);
  };

  const processedReport = content.replace(/<u>(.*?)<\/u>/g, '[$1](#define-$1)');

  return (
    <>
      <Markdown
        components={{
          a: ({ node, href, children, ...props }) => {
            if (href?.startsWith('#define-')) {
              return (
                <span
                  className="underline decoration-dashed decoration-indigo-400 cursor-pointer text-indigo-700 hover:text-indigo-900 font-medium transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof children === 'string' || (Array.isArray(children) && typeof children[0] === 'string')) {
                      handleWordClick(String(children));
                    } else if (href) {
                      handleWordClick(href.replace('#define-', ''));
                    }
                  }}
                  title="Click for definition"
                >
                  {children}
                </span>
              );
            }
            return <a href={href} {...props}>{children}</a>;
          }
        }}
      >
        {processedReport}
      </Markdown>

      <AnimatePresence>
        {wordDefinition && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
          >
            <div className="bg-white border border-indigo-100 shadow-[0_20px_50px_-12px_rgba(79,70,229,0.25)] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-80" />
              <button
                onClick={() => setWordDefinition(null)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 capitalize flex items-baseline gap-2">
                    {wordDefinition.word}
                    {wordDefinition.phonetic && (
                      <span className="text-xs font-medium text-slate-400 normal-case tracking-wide">
                        {wordDefinition.phonetic}
                      </span>
                    )}
                  </h3>
                  <p className={`text-sm mt-1 leading-relaxed ${loading ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                    {wordDefinition.definition}
                  </p>
                  
                  {!loading && onPracticeWord && (
                    <button
                      onClick={() => {
                        onPracticeWord(wordDefinition.word);
                        setWordDefinition(null);
                      }}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-sm rounded-xl transition-colors border border-orange-200 shadow-sm active:scale-95"
                    >
                      <Mic className="w-4 h-4" />
                      Practice Pronunciation
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
