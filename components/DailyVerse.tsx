import React, { useState } from 'react';
import { Share2, Copy, Check, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const VERSES = [
    { text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", surahName: "الفاتحة", ayah: "٢" },
    { text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", surahName: "الفاتحة", ayah: "٦" },
    { text: "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ", surahName: "البقرة", ayah: "٣" },
    { text: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ", surahName: "البقرة", ayah: "٤٣" },
    { text: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ", surahName: "البقرة", ayah: "٤٥" },
    { text: "وَقُولُوا لِلنَّاسِ حُسْنًا", surahName: "البقرة", ayah: "٨٣" },
    { text: "فَاذْكُرُونِي أَذْكُرْكُمْ", surahName: "البقرة", ayah: "١٥٢" },
    { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", surahName: "البقرة", ayah: "١٥٣" },
    { text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", surahName: "البقرة", ayah: "٢٥٥" },
    { text: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا", surahName: "آل عمران", ayah: "١٠٣" },
    { text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", surahName: "الطلاق", ayah: "٣" },
    { text: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ", surahName: "النحل", ayah: "٩٠" },
    { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", surahName: "الرعد", ayah: "٢٨" },
    { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", surahName: "الشرح", ayah: "٥" },
    { text: "وَقُل رَّبِّ زِدْنِي عِلْمًا", surahName: "طه", ayah: "١١٤" },
];

export const DailyVerse: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const getDayOfYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime() + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const dayOfYear = getDayOfYear();
  const todayVerse = VERSES[dayOfYear % VERSES.length];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${todayVerse.text} - ${todayVerse.surahName} ${todayVerse.ayah}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVerse = async () => {
    try {
      await navigator.share({ title: 'آية اليوم', text: `${todayVerse.text}\n${todayVerse.surahName} ${todayVerse.ayah}` });
    } catch { copyToClipboard(); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto px-3 md:px-4">
      <div className="relative rounded-3xl md:rounded-[3rem] p-5 md:p-16 overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-900/20 via-[#0f172a] to-teal-900/20 shadow-xl">
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/8 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-teal-500/8 rounded-full blur-[80px]"></div>

        <div className="relative flex flex-col items-center gap-5 md:gap-10">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Sparkles size={12} className="text-emerald-400" />
            <span className="text-[10px] md:text-xs font-black text-emerald-300">آية اليوم</span>
          </div>

          <div className="w-full text-center space-y-4 md:space-y-8">
            <p className="font-quran text-2xl md:text-6xl leading-[2] md:leading-[1.8] text-white/90 drop-shadow-lg">
              {todayVerse.text}
            </p>
            <div className="flex items-center justify-center">
              <span className="text-emerald-400 font-black text-[10px] md:text-xl bg-emerald-500/10 px-3 py-1 md:px-5 md:py-2 rounded-full flex items-center gap-2 md:gap-3">
                {todayVerse.surahName}
                <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500/60 inline-block"></span>
                <span dir="ltr">{todayVerse.ayah}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-2xl border border-white/5 backdrop-blur-sm">
            <button onClick={copyToClipboard}
              className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl transition-all flex items-center gap-2 text-xs md:text-sm font-bold ${copied ? 'bg-emerald-500 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'تم' : 'نسخ'}
            </button>
            <div className="w-px h-6 bg-white/10"></div>
            <button onClick={shareVerse}
              className="px-4 py-2.5 md:px-6 md:py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all flex items-center gap-2 text-xs md:text-sm font-bold">
              <Share2 size={14} />
              مشاركة
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
