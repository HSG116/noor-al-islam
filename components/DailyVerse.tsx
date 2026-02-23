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
            className="w-full max-w-3xl mx-auto px-4 group"
        >
            <div className="glass-panel rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 relative overflow-hidden border border-white/5 shadow-2xl bg-emerald-500/5">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px] animate-pulse"></div>

                <div className="relative flex flex-col items-center gap-8">
                    {/* Premium Badge */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-lg"
                    >
                        <Sparkles size={16} className="text-emerald-300" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">آية اليوم المباركة</span>
                    </motion.div>

                    {/* Verse Text Area */}
                    <div className="w-full text-center space-y-6">
                        <motion.p 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="font-quran text-3xl md:text-6xl leading-[1.6] md:leading-[1.6] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-gradient-to-b from-white to-emerald-100 bg-clip-text text-transparent"
                        >
                            {todayVerse.text}
                        </motion.p>
                        
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center justify-center gap-4"
                        >
                            <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-500/40"></div>
                            <p className="text-emerald-400 font-black text-xs md:text-xl tracking-wide">
                                {todayVerse.surah}
                            </p>
                            <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-500/40"></div>
                        </motion.div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 bg-black/40 p-2 rounded-3xl border border-white/5 shadow-2xl">
                        <button
                            onClick={copyToClipboard}
                            className={`p-4 rounded-2xl transition-all duration-500 flex items-center gap-3 ${copied ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-300'}`}
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            {copied && <span className="text-xs font-black uppercase tracking-widest">تم النسخ</span>}
                        </button>
                        <div className="w-px h-8 bg-white/5"></div>
                        <button
                            className="p-4 rounded-2xl hover:bg-teal-500/20 text-gray-400 hover:text-teal-300 transition-all duration-500"
                        >
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
