
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Sun, Moon, Coffee, RotateCcw, CheckCircle2, Copy, Share2, Heart, BookOpen, Star, Sparkles, Filter, Info, ArrowRight, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { challengeService } from '../services/challengeService';
import { Session } from '@supabase/supabase-js';

interface AzkarCategory {
    ID: number;
    TITLE: string;
    AUDIO_URL: string;
    TEXT: string;
}

interface AzkarItem {
    ID: number;
    ARABIC_TEXT: string;
    LANGUAGE_ARABIC_TRANSLATED?: string;
    TRANSLATED_TEXT?: string;
    REPEAT: number;
    AUDIO?: string;
}

interface AzkarProps {
    session?: Session | null;
}

export const Azkar: React.FC<AzkarProps> = ({ session }) => {
    const [categories, setCategories] = useState<AzkarCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<AzkarCategory | null>(null);
    const [azkarContent, setAzkarContent] = useState<AzkarItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [counts, setCounts] = useState<Record<number, number>>({});
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [hasRecordedCompletion, setHasRecordedCompletion] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Smooth scroll to top when category changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setHasRecordedCompletion(false); // Reset for new category
    }, [selectedCategory]);

    // Track completion for challenges
    useEffect(() => {
        if (!selectedCategory || !session?.user || azkarContent.length === 0 || hasRecordedCompletion) return;

        const completedItems = azkarContent.filter(item => (counts[item.ID] || 0) >= (item.REPEAT || 1)).length;
        const isFullyDone = completedItems === azkarContent.length;

        if (isFullyDone) {
            handleCategoryCompletion();
        }
    }, [counts, azkarContent, selectedCategory, session, hasRecordedCompletion]);

    const handleCategoryCompletion = async () => {
        if (!selectedCategory || !session?.user) return;

        let type: 'morning' | 'evening' | null = null;
        if (selectedCategory.TITLE.includes('أذكار الصباح')) type = 'morning';
        else if (selectedCategory.TITLE.includes('أذكار المساء')) type = 'evening';

        if (type) {
            setHasRecordedCompletion(true);
            const result = await challengeService.recordAzkarCompletion(session.user.id, type);
            if (result.success) {
                // You could show a toast or a special animation here
                console.log(`Successfully recorded ${type} azkar completion`);
            }
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://www.hisnmuslim.com/api/ar/husn_ar.json');
            const data = await response.json();
            setCategories(data['العربية'] || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAzkarContent = async (category: AzkarCategory) => {
        try {
            setLoading(true);
            setSelectedCategory(category);
            const response = await fetch(category.TEXT.replace('http://', 'https://'));
            const data = await response.json();
            const contentKey = Object.keys(data)[0];
            setAzkarContent(data[contentKey] || []);
            setCounts({}); // Reset counts for new category
        } catch (error) {
            console.error('Error fetching azkar content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIncrement = (id: number, goal: number) => {
        setCounts(prev => {
            const current = prev[id] || 0;
            if (current < goal) {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                return { ...prev, [id]: current + 1 };
            }
            return prev;
        });
    };

    const handleReset = (id: number) => {
        setCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[id];
            return newCounts;
        });
    };

    const handleCopy = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredCategories = categories.filter(cat =>
        cat.TITLE.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const completedItems = azkarContent.filter(item => (counts[item.ID] || 0) >= (item.REPEAT || 1)).length;
    const progressPercent = azkarContent.length > 0 ? (completedItems / azkarContent.length) * 100 : 0;

    // View: Selected Category (Azkar List)
    if (selectedCategory) {
        return (
            <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-12 space-y-6 md:space-y-10 overflow-x-hidden">

                {/* Modern Sticky Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-4 z-50"
                >
                    <div className="glass-panel p-3 md:p-6 rounded-2xl md:rounded-[3rem] border border-white/5 flex items-center justify-between gap-4 shadow-2xl backdrop-blur-2xl bg-[#0f172a]/90">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="w-10 h-10 md:w-16 md:h-16 bg-white/5 hover:bg-emerald-500 hover:text-white rounded-xl md:rounded-3xl text-gray-400 flex items-center justify-center transition-all duration-500 shadow-lg"
                        >
                            <ArrowRight size={20} className="md:w-8 md:h-8" />
                        </button>

                        <div className="flex-1 text-center min-w-0">
                            <h3 className="text-sm md:text-2xl font-black text-white truncate px-2 leading-tight">
                                {selectedCategory.TITLE}
                            </h3>
                        </div>

                        <div className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center relative">
                            <svg className="w-full h-full -rotate-90">
                                <circle cx="50%" cy="50%" r="40%" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                                <circle cx="50%" cy="50%" r="40%" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - progressPercent} strokeLinecap="round" className="text-emerald-500 transition-all duration-700" />
                            </svg>
                            <span className="absolute text-[8px] md:text-xs font-black text-emerald-400">{Math.round(progressPercent)}%</span>
                        </div>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <Loader2 className="animate-spin text-emerald-500" size={48} />
                        <p className="text-emerald-500/60 font-black text-xs md:text-lg uppercase tracking-widest animate-pulse">جاري جلب الأذكار...</p>
                    </div>
                ) : (
                    <div className="space-y-4 md:space-y-8">
                        <AnimatePresence mode="popLayout">
                            {azkarContent.map((item, idx) => {
                                const currentCount = counts[item.ID] || 0;
                                const repeatGoal = item.REPEAT || 1;
                                const isDone = currentCount >= repeatGoal;

                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: (idx % 10) * 0.05 }}
                                        key={idx}
                                        className={`relative rounded-2xl md:rounded-[3rem] border transition-all duration-500 overflow-hidden group shadow-xl
                                        ${isDone
                                                ? 'bg-emerald-500/10 border-emerald-500/40'
                                                : 'glass-panel border-white/5 hover:border-white/20'}`}
                                    >
                                        {/* Subtle Progress Bar at Top */}
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/40">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(currentCount / repeatGoal) * 100}%` }}
                                                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                                            ></motion.div>
                                        </div>

                                        <div className="p-6 md:p-12 space-y-6 md:space-y-10">
                                            {/* Arabic Text */}
                                            <p className={`font-amiri text-xl md:text-5xl leading-[2.2] md:leading-[1.8] text-center px-1 transition-colors duration-500 font-medium ${isDone ? 'text-emerald-100' : 'text-white'}`}>
                                                {item.ARABIC_TEXT}
                                            </p>

                                            {/* Translation / Note */}
                                            {item.TRANSLATED_TEXT && (
                                                <div className="bg-black/40 rounded-xl md:rounded-3xl p-4 md:p-8 border border-white/5 shadow-inner">
                                                    <p className="text-gray-400 text-xs md:text-xl leading-relaxed text-center font-bold opacity-60">
                                                        {item.TRANSLATED_TEXT}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Bar */}
                                        <div className="bg-black/40 p-4 md:p-8 flex items-center justify-between gap-4 md:gap-8 border-t border-white/5">

                                            {/* Utility Buttons */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleCopy(item.ARABIC_TEXT, item.ID)}
                                                    className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center transition-all duration-500 shadow-lg ${copiedId === item.ID ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                                >
                                                    {copiedId === item.ID ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                                {currentCount > 0 && !isDone && (
                                                    <button
                                                        onClick={() => handleReset(item.ID)}
                                                        className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center bg-white/5 text-gray-400 hover:text-red-400 transition-all duration-500 shadow-lg"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Tappable Counter Button */}
                                            <button
                                                onClick={() => handleIncrement(item.ID, repeatGoal)}
                                                disabled={isDone}
                                                className={`flex-1 h-12 md:h-20 rounded-xl md:rounded-[2rem] flex items-center justify-center gap-3 transition-all duration-500 active:scale-95 shadow-2xl relative overflow-hidden
                                                    ${isDone
                                                        ? 'bg-emerald-500 text-white cursor-default'
                                                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}
                                            >
                                                {isDone ? (
                                                    <motion.div
                                                        initial={{ scale: 0.8 }}
                                                        animate={{ scale: 1 }}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 size={20} className="md:w-8 md:h-8" />
                                                        <span className="text-xs md:text-2xl font-black uppercase tracking-widest">اكتمل الذكر</span>
                                                    </motion.div>
                                                ) : (
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm md:text-3xl font-black tabular-nums tracking-widest">{currentCount}</span>
                                                        <div className="w-px h-4 md:h-8 bg-emerald-500/20"></div>
                                                        <span className="text-sm md:text-3xl font-black tabular-nums tracking-widest opacity-40">{repeatGoal}</span>
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        );
    }

    // View: Categories List (Main)
    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-20 space-y-8 md:space-y-20 overflow-x-hidden">

            {/* Header - Ultra Premium */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="text-center relative"
            >
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -z-10 animate-pulse"></div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mx-auto mb-6 shadow-lg"
                >
                    <Sparkles size={14} className="animate-pulse text-emerald-300" />
                    <span>حصن المسلم الموثق</span>
                </motion.div>

                <h2 className="text-3xl md:text-8xl font-black leading-tight mb-6 tracking-tighter">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="block bg-gradient-to-b from-white via-white to-emerald-100 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                    >
                        أذكار المسلم
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="block text-emerald-500/80 text-sm md:text-4xl mt-1 font-bold tracking-normal"
                    >
                        طمأنينة لقلبك وذكر لربك
                    </motion.span>
                </h2>

                <div className="relative max-w-2xl mx-auto mt-10 md:mt-20">
                    <div className="glass-panel p-3 md:p-6 rounded-2xl md:rounded-[3rem] border border-white/5 shadow-2xl relative group">
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500/30 group-focus-within:text-emerald-400 transition-all duration-300" size={22} />
                        <input
                            type="text"
                            placeholder="ابحث في الأذكار..."
                            className="w-full bg-black/40 border border-white/5 rounded-xl md:rounded-3xl py-4 md:py-8 pr-14 pl-6 text-white text-sm md:text-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-500 text-right shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Categories Grid */}
            {loading && categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <Loader2 className="animate-spin text-emerald-500" size={64} />
                    <p className="text-emerald-500/60 font-black text-xs md:text-xl uppercase tracking-widest animate-pulse">جاري تحميل الأذكار...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredCategories.map((category, index) => (
                            <motion.button
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: (index % 20) * 0.03 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                key={category.ID}
                                onClick={() => fetchAzkarContent(category)}
                                className="group relative overflow-hidden glass-panel border border-white/5 hover:border-emerald-500/40 p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] transition-all duration-500 active:scale-[0.98] text-right flex items-center gap-6 shadow-xl"
                            >
                                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>

                                <div className="w-14 h-14 md:w-24 md:h-24 bg-black/40 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-emerald-500/70 group-hover:text-white group-hover:bg-emerald-500 transition-all duration-500 border border-white/5 shadow-inner">
                                    {category.TITLE.includes('صباح') || category.TITLE.includes('مساء') ? <Sun size={24} className="md:w-10 md:h-10" /> :
                                        category.TITLE.includes('نوم') ? <Moon size={24} className="md:w-10 md:h-10" /> :
                                            category.TITLE.includes('صلاة') ? <CheckCircle2 size={24} className="md:w-10 md:h-10" /> :
                                                <BookOpen size={24} className="md:w-10 md:h-10" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base md:text-3xl font-black text-white group-hover:text-emerald-400 transition-colors line-clamp-1 leading-tight">
                                        {category.TITLE}
                                    </h3>
                                    <p className="text-[10px] md:text-lg text-gray-600 font-black uppercase tracking-widest mt-2">تصفح الأذكار</p>
                                </div>
                                <ChevronLeft size={20} className="text-gray-700 group-hover:text-emerald-500 group-hover:-translate-x-2 transition-all duration-500" />
                            </motion.button>
                        ))}
                    </AnimatePresence>

                    {filteredCategories.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full py-40 text-center glass-panel rounded-3xl border border-white/5 border-dashed"
                        >
                            <Filter size={48} className="mx-auto text-gray-700 mb-6" />
                            <p className="text-gray-500 font-black text-sm md:text-2xl">لا توجد نتائج مطابقة لبحثك</p>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
