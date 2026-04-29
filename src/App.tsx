import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Sparkles, 
  RefreshCw,
  Heart,
  HandHeart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { getGeminiResponse, getDailyReadingInfo, getDailyQuote } from './services/geminiService';
import { Type } from "@google/genai";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReadingData {
  chapter: string;
  title: string;
  content: string;
}

interface MeditationData {
  light: string;
  reflection: string;
  prayer: string;
}

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reading, setReading] = useState<ReadingData | null>(null);
  const [meditation, setMeditation] = useState<MeditationData | null>(null);
  const [dailyQuote, setDailyQuote] = useState<{ verse: string; reference: string } | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);
  const [loadingMeditation, setLoadingMeditation] = useState(false);

  // Fetch reading info when date changes
  useEffect(() => {
    fetchReading(selectedDate);
    setMeditation(null);
  }, [selectedDate]);

  const fetchReading = async (date: Date) => {
    setLoadingReading(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Fetch both reading info and daily quote
    const [readingData, quoteData] = await Promise.all([
      getDailyReadingInfo(dateStr),
      getDailyQuote(dateStr)
    ]);

    if (readingData) {
      setReading(readingData);
    }
    if (quoteData) {
      setDailyQuote(quoteData);
    }
    setLoadingReading(false);
  };

  const handleStartMeditation = async () => {
    if (!reading) return;
    setLoadingMeditation(true);
    
    const prompt = `身為一位資深的屬靈導師，請針對以下聖經經文進行導讀與默想引導。
    經文：${reading.chapter} - ${reading.title}
    內容：${reading.content}
    
    請依照以下格式回傳 JSON：
    {
      "light": "【今日亮光】：簡述經文核心意義 (Markdown 格式)",
      "reflection": "【屬靈默想】：3 個啟發性的反思問題，引導將經文應用在職場與生活中 (Markdown 格式)",
      "prayer": "【心靈禱告】：一段約 150 字、溫和且充滿力量的禱告文 (Markdown 格式)"
    }`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        light: { type: Type.STRING },
        reflection: { type: Type.STRING },
        prayer: { type: Type.STRING }
      },
      required: ["light", "reflection", "prayer"]
    };

    try {
      const responseText = await getGeminiResponse(prompt, false, true, schema);
      const data = JSON.parse(responseText || '{}');
      setMeditation(data);
    } catch (e) {
      console.error("Meditation generation failed", e);
    }
    setLoadingMeditation(false);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-6">
      <header className="w-full max-w-4xl mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center space-x-2 mb-4"
        >
          <BookOpen className="w-8 h-8 text-notebook-accent" />
          <h1 className="text-4xl font-bold tracking-tight text-notebook-ink">每日生命靈糧</h1>
        </motion.div>
        <p className="text-notebook-accent italic">Daily Manna — 活潑的生命讀經計畫</p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Calendar & Date Selection */}
        <aside className="lg:col-span-2 space-y-4">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-notebook-line shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-0.5 hover:bg-notebook-line rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="font-bold text-xs">
                {format(currentMonth, 'yyyy/MM')}
              </h2>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-0.5 hover:bg-notebook-line rounded-full transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] mb-1 opacity-50 font-sans">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-0.5">
              {/* Padding for first day of month */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              
              {daysInMonth.map(day => (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-full text-[10px] transition-all font-sans",
                    isSameDay(day, selectedDate) 
                      ? "bg-notebook-ink text-notebook-bg font-bold" 
                      : "hover:bg-notebook-line",
                    isSameDay(day, new Date()) && !isSameDay(day, selectedDate) && "border border-notebook-accent"
                  )}
                >
                  {format(day, 'd')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-notebook-accent/5 rounded-xl p-4 border border-notebook-accent/10">
            <h3 className="flex items-center space-x-2 font-bold text-sm mb-2">
              <Heart className="w-4 h-4 text-notebook-accent" />
              <span>靈修小語</span>
            </h3>
            {dailyQuote ? (
              <p className="text-sm italic leading-relaxed opacity-80">
                「{dailyQuote.verse}」<br/>
                <span className="text-xs not-italic opacity-60">— {dailyQuote.reference}</span>
              </p>
            ) : (
              <div className="h-10 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin opacity-20" />
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Reading & Meditation */}
        <section className="lg:col-span-10 space-y-8">
          {/* Reading Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-notebook-line relative overflow-hidden min-h-[400px]">
            {/* Notebook Lines Decoration */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                 style={{ backgroundImage: 'linear-gradient(var(--color-notebook-ink) 1px, transparent 1px)', backgroundSize: '100% 2.5rem' }} />
            
            <AnimatePresence mode="wait">
              {loadingReading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full space-y-4 py-20"
                >
                  <RefreshCw className="w-8 h-8 animate-spin text-notebook-accent" />
                  <p className="text-notebook-accent">正在查考今日經文進度...</p>
                </motion.div>
              ) : reading ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative z-10"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                      <span className="text-xs font-sans uppercase tracking-widest text-notebook-accent font-semibold block mb-1">
                        {format(selectedDate, 'EEEE, MMMM do', { locale: zhTW })}
                      </span>
                      <h2 className="text-3xl font-bold mb-2">{reading.title}</h2>
                      <div className="flex items-center space-x-2 text-notebook-accent">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="font-medium">{reading.chapter}</span>
                      </div>
                    </div>
                    
                  </div>

                  <div className="prose prose-stone max-w-none mb-12">
                    <div className="text-lg leading-loose">
                      <p className="first-letter:text-4xl first-letter:font-bold first-letter:mr-2 first-letter:float-left">
                        {reading.content}
                      </p>
                    </div>
                  </div>

                  {!meditation && (
                    <div className="flex justify-center pt-8 border-t border-notebook-line">
                      <button
                        onClick={handleStartMeditation}
                        disabled={loadingMeditation}
                        className="group flex items-center space-x-3 px-8 py-4 bg-notebook-ink text-notebook-bg rounded-2xl font-bold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {loadingMeditation ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-yellow-400 group-hover:rotate-12 transition-transform" />
                        )}
                        <span>{loadingMeditation ? '正在尋求亮光...' : '開始默想'}</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-notebook-accent">
                  <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                  <p>未能取得今日經文，請嘗試重新整理或選擇其他日期。</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Meditation Results */}
          <AnimatePresence>
            {meditation && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Light Section */}
                <div className="bg-white/80 rounded-3xl p-8 border border-notebook-line shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-bold">今日亮光</h3>
                  </div>
                  <div className="markdown-body">
                    <Markdown>{meditation.light}</Markdown>
                  </div>
                </div>

                {/* Reflection Section */}
                <div className="bg-white/80 rounded-3xl p-8 border border-notebook-line shadow-lg">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold">屬靈默想</h3>
                  </div>
                  <div className="markdown-body">
                    <Markdown>{meditation.reflection}</Markdown>
                  </div>
                </div>

                {/* Prayer Section */}
                <div className="bg-notebook-ink text-notebook-bg rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Heart className="w-24 h-24 fill-current" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <HandHeart className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white">心靈禱告</h3>
                      </div>
                      
                    </div>
                    <div className="markdown-body text-white/90 italic leading-relaxed text-lg mb-6">
                      <Markdown>{meditation.prayer}</Markdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="mt-20 py-8 border-t border-notebook-line w-full max-w-4xl text-center text-sm text-notebook-accent opacity-60 font-sans">
        <p>© 2026 每日生命靈糧 (Daily Manna) | 經文進度參照《活潑的生命》</p>
      </footer>
    </div>
  );
}
