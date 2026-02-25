import React, { useState } from 'react';
import { Share2, Copy, BookOpen, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const VERSES = [
    { text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", surah: "سورة الفاتحة: 2" },
    { text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", surah: "سورة الفاتحة: 6" },
    { text: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ", surah: "سورة البقرة: 3" },
    { text: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ", surah: "سورة البقرة: 43" },
    { text: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", surah: "سورة البقرة: 45" },
    { text: "وَقُولُوا لِلنَّاسِ حُسْنًا", surah: "سورة البقرة: 83" },
    { text: "فَاذْكُرُونِي أَذْكُرْكُمْ", surah: "سورة البقرة: 152" },
    { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", surah: "سورة البقرة: 153" },
    { text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", surah: "سورة البقرة: 255" },
    { text: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا", surah: "سورة آل عمران: 103" },
    { text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", surah: "سورة الطلاق: 3" },
    { text: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ", surah: "سورة النحل: 90" },
    { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", surah: "سورة الرعد: 28" },
    { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "سورة الشرح: 5" },
    { text: "وَقُل رَّبِّ زِدْنِي عِلْمًا", surah: "سورة طه: 114" }
];

export const DailyVerse: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const getDayOfYear = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };

    const dayOfYear = getDayOfYear();
    const verseIndex = dayOfYear % VERSES.length;
    const todayVerse = VERSES[verseIndex];

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${todayVerse.text} - ${todayVerse.surah}`);
        setCopied(true);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto px-4 group"
        >
            <div className="crystal-glass rounded-[4rem] p-12 md:p-24 relative overflow-hidden border border-white/15 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full radiant-rays opacity-40"></div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] animate-pulse"></div>

                <div className="relative flex flex-col items-center gap-12">
                    {/* Premium Badge */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                        <Sparkles size={18} className="text-emerald-400" />
                        <span className="text-xs md:text-sm font-black uppercase tracking-[0.4em]">آية اليوم المباركة</span>
                    </motion.div>

                    {/* Verse Text Area */}
                    <div className="w-full text-center space-y-10">
                        <motion.p
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="font-quran text-4xl md:text-7xl leading-[1.8] md:leading-[1.8] text-white drop-shadow-[0_15px_45px_rgba(0,0,0,0.7)] bg-gradient-to-b from-white via-white to-emerald-200 bg-clip-text text-transparent"
                        >
                            {todayVerse.text}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center justify-center gap-6"
                        >
                            <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
                            <p className="text-emerald-400 font-black text-sm md:text-2xl tracking-widest bg-emerald-500/10 px-6 py-2 rounded-xl">
                                {todayVerse.surah}
                            </p>
                            <div className="h-px w-16 md:w-32 bg-gradient-to-l from-transparent via-emerald-500/40 to-transparent"></div>
                        </motion.div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6 bg-black/40 p-2.5 rounded-[2rem] border border-white/10 shadow-3xl backdrop-blur-xl">
                        <button
                            onClick={copyToClipboard}
                            className={`p-5 rounded-[1.5rem] transition-all duration-700 flex items-center gap-4 ${copied ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'hover:bg-emerald-500/20 text-emerald-100/60 hover:text-white'}`}
                        >
                            {copied ? <Check size={24} /> : <Copy size={24} />}
                            {copied && <span className="text-xs font-black uppercase tracking-widest">تم النسخ</span>}
                        </button>
                        <div className="w-px h-10 bg-white/10"></div>
                        <button
                            className="p-5 rounded-[1.5rem] hover:bg-teal-500/20 text-emerald-100/60 hover:text-white transition-all duration-700"
                        >
                            <Share2 size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
