import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Mic, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="text-slate-700 leading-relaxed space-y-4 font-medium">
      <Markdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-black text-slate-900 mt-8 mb-6 pb-2 border-b-2 border-indigo-100 flex items-center gap-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-indigo-900 mt-8 mb-4 flex items-center gap-2" {...props} />,
          h3: ({ node, ...props }) => {
            const text = String(props.children);
            let Icon = Sparkles;
            let color = "text-amber-500";
            if (text.toLowerCase().includes('good') || text.toLowerCase().includes('strength') || text.toLowerCase().includes('positive')) {
              Icon = CheckCircle2;
              color = "text-emerald-500";
            } else if (text.toLowerCase().includes('improve') || text.toLowerCase().includes('weak') || text.toLowerCase().includes('constructive')) {
              Icon = AlertCircle;
              color = "text-rose-500";
            }
            return (
              <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                <Icon className={`w-5 h-5 ${color}`} />
                {props.children}
              </h3>
            );
          },
          p: ({ node, ...props }) => <p className="text-[15px] leading-relaxed mb-4 text-slate-600" {...props} />,
          ul: ({ node, ...props }) => <ul className="space-y-3 mb-6 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm" {...props} />,
          ol: ({ node, ...props }) => <ol className="space-y-3 mb-6 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm list-decimal list-inside" {...props} />,
          li: ({ node, ...props }) => (
            <li className="flex items-start gap-3 text-[15px] text-slate-600 group">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0 mt-2.5 transition-transform group-hover:scale-150 group-hover:bg-indigo-500" />
              <span className="flex-1">{props.children}</span>
            </li>
          ),
          strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-indigo-300 bg-indigo-50/50 p-4 sm:p-5 rounded-r-2xl italic text-slate-700 my-6 shadow-inner relative" {...props}>
               <div className="absolute -left-1.5 top-0 bottom-0 w-1 bg-indigo-500 rounded-full"></div>
               {props.children}
            </blockquote>
          ),
          code: ({ node, inline, ...props }: any) => 
            inline ? (
              <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md text-sm font-semibold font-mono border border-indigo-100/50" {...props} />
            ) : (
              <div className="my-6 relative overflow-hidden rounded-2xl shadow-sm border border-slate-200">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-400 to-slate-300" />
                <code className="block bg-slate-50 text-slate-700 p-5 pt-6 text-[13px] sm:text-sm font-mono overflow-x-auto" {...props} />
              </div>
            ),
          a: ({ node, href, children, ...props }) => {
            if (href?.startsWith('#define-')) {
              return (
                <span
                  className="underline decoration-dashed decoration-indigo-400 cursor-pointer text-indigo-600 hover:text-indigo-800 font-bold transition-colors bg-indigo-50/50 px-1 rounded-sm"
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
            return <a href={href} className="text-indigo-600 hover:text-indigo-800 underline font-semibold" {...props}>{children}</a>;
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
    </div>
  );
}
