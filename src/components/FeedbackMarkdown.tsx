import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Mic, CheckCircle2, AlertCircle, Sparkles, Award, Target, Dumbbell } from 'lucide-react';
import { BandScoreDisplay } from './BandScoreDisplay';

export function FeedbackMarkdown({ content, onPracticeWord }: { content: string, onPracticeWord?: (word: string) => void }) {
  const [wordDefinition, setWordDefinition] = useState<{ word: string; definition: string; phonetic: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const isIeltsReport = content.toLowerCase().includes('band score') ||
                        content.toLowerCase().includes('ielts') ||
                        content.toLowerCase().includes('fluency & coherence') ||
                        content.toLowerCase().includes('lexical resource') ||
                        content.toLowerCase().includes('grammatical range');

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
      {isIeltsReport && <BandScoreDisplay content={content} />}

      <Markdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b border-slate-200" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-slate-800 mt-6 mb-3" {...props} />,
          h3: ({ node, ...props }) => {
            const text = String(props.children);
            let Icon = Sparkles;
            let color = "text-indigo-500";
            if (text.toLowerCase().includes('drill') || text.toLowerCase().includes('1-minute')) {
              Icon = Dumbbell;
              color = "text-amber-500";
            } else if (text.toLowerCase().includes('good') || text.toLowerCase().includes('strength') || text.toLowerCase().includes('positive')) {
              Icon = CheckCircle2;
              color = "text-emerald-500";
            } else if (text.toLowerCase().includes('improve') || text.toLowerCase().includes('weak') || text.toLowerCase().includes('constructive')) {
              Icon = AlertCircle;
              color = "text-rose-500";
            }
            return (
              <h3 className="text-base font-bold text-slate-800 mt-5 mb-2 flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                {props.children}
              </h3>
            );
          },
          p: ({ node, ...props }) => <p className="text-sm leading-relaxed mb-4 text-slate-600" {...props} />,
          ul: ({ node, ...props }) => <ul className="space-y-2 mb-6 ml-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="space-y-2 mb-6 ml-1 list-decimal list-inside" {...props} />,
          li: ({ node, ...props }) => {
            const rawText = React.Children.toArray(props.children)
              .map((c) => (typeof c === 'string' || typeof c === 'number' ? c : ''))
              .join('');

            const isIeltsBandScore = rawText.toLowerCase().includes('estimated band score');
            const isSubScore = rawText.toLowerCase().includes('score:');

            if (isIeltsBandScore) {
              return (
                <li className="flex items-center justify-between p-3.5 my-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 border border-blue-700/50 rounded-xl text-white font-bold shadow-md">
                  <span className="flex items-center gap-2.5 text-sm sm:text-base">
                    <Award className="w-5 h-5 text-amber-400 shrink-0" />
                    {props.children}
                  </span>
                </li>
              );
            }

            if (isSubScore) {
              return (
                <li className="flex items-center justify-between px-3.5 py-2 my-1.5 bg-slate-100/80 border border-slate-200/80 rounded-lg text-slate-800 font-semibold">
                  <span className="flex items-center gap-2 text-xs sm:text-sm">
                    <Target className="w-4 h-4 text-blue-600 shrink-0" />
                    {props.children}
                  </span>
                </li>
              );
            }

            return (
              <li className="flex items-start gap-2 text-sm text-slate-600 group">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-2 transition-colors group-hover:bg-slate-400" />
                <span className="flex-1">{props.children}</span>
              </li>
            );
          },
          strong: ({ node, ...props }) => <strong className="font-bold text-slate-900" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-slate-300 bg-slate-50 p-4 rounded-r-lg italic text-slate-600 my-4" {...props}>
               {props.children}
            </blockquote>
          ),
          code: ({ node, inline, ...props }: any) => 
            inline ? (
              <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[13px] font-mono border border-slate-200" {...props} />
            ) : (
              <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                <code className="block text-slate-700 p-4 text-[13px] font-mono overflow-x-auto" {...props} />
              </div>
            ),
          a: ({ node, href, children, ...props }) => {
            if (href?.startsWith('#define-')) {
              return (
                <span
                  className="underline decoration-dashed decoration-slate-400 cursor-pointer text-slate-800 hover:text-slate-900 font-bold transition-colors bg-slate-100 px-1 rounded-sm"
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
            return <a href={href} className="text-blue-600 hover:text-blue-800 underline font-medium" {...props}>{children}</a>;
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
            <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-5 relative overflow-hidden">
              <button
                onClick={() => setWordDefinition(null)}
                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-300 shrink-0 mt-0.5 border border-slate-700">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white capitalize flex items-baseline gap-2">
                    {wordDefinition.word}
                    {wordDefinition.phonetic && (
                      <span className="text-xs font-medium text-slate-400 normal-case tracking-wide">
                        {wordDefinition.phonetic}
                      </span>
                    )}
                  </h3>
                  <p className={`text-sm mt-1 leading-relaxed ${loading ? 'text-slate-400 italic' : 'text-slate-300'}`}>
                    {wordDefinition.definition}
                  </p>
                  
                  {!loading && onPracticeWord && (
                    <button
                      onClick={() => {
                        onPracticeWord(wordDefinition.word);
                        setWordDefinition(null);
                      }}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-lg transition-colors shadow-sm active:scale-95"
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
  );}
