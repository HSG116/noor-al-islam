
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Target, Sparkles, Award, Volume2, VolumeX, Smartphone, Palette, Zap, History, Trash2, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { challengeService, UserChallenge } from '../services/challengeService';
import { Session } from '@supabase/supabase-js';

const DHIKR_LIST = [
    { text: 'سُبْحَانَ اللَّهِ', label: 'تَسْبِيح' },
    { text: 'الْحَمْدُ لِلَّهِ', label: 'تَحْمِيد' },
    { text: 'لَا إِلَهَ إِلَّا اللَّهُ', label: 'تَهْلِيل' },
    { text: 'اللَّهُ أَكْبَرُ', label: 'تَكْبِير' },
    { text: 'أَسْتَغْفِرُ اللَّهَ', label: 'اسْتِغْفَار' },
    { text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', label: 'صَلَاةٌ عَلَى النَّبِيِّ' },
    { text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', label: 'حَوْقَلَة' }
];

const THEMES = [
    { id: 'emerald', name: 'زمردي', primary: '#10b981', secondary: '#064e3b', glow: 'rgba(16, 185, 129, 0.4)', bg: 'from-[#064e3b] to-[#020617]' },
    { id: 'gold', name: 'ذهبي', primary: '#fbbf24', secondary: '#78350f', glow: 'rgba(251, 191, 36, 0.4)', bg: 'from-[#451a03] to-[#020617]' },
    { id: 'blue', name: 'ملكي', primary: '#6366f1', secondary: '#312e81', glow: 'rgba(99, 102, 241, 0.4)', bg: 'from-[#1e1b4b] to-[#020617]' }
];

const TARGETS = [33, 100, 1000, 0];

interface TasbihProps {
    session?: Session | null;
}

export const Tasbih: React.FC<TasbihProps> = ({ session }) => {
    // Persistent states
    const [count, setCount] = useState(() => Number(localStorage.getItem('tasbih_current') || 0));
    const [lap, setLap] = useState(() => Number(localStorage.getItem('tasbih_laps') || 0));
    const [totalCount, setTotalCount] = useState(() => Number(localStorage.getItem('tasbih_total') || 0));
    const [sessionHistory, setSessionHistory] = useState<number[]>(() => {
        try { return JSON.parse(localStorage.getItem('tasbih_history') || '[]'); } catch { return []; }
    });

    const [selectedDhikr, setSelectedDhikr] = useState(0);
    const [target, setTarget] = useState(33);
    const [isAnimating, setIsAnimating] = useState(false);
    const [theme, setTheme] = useState(THEMES[0]);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [isVibrateEnabled, setIsVibrateEnabled] = useState(true);
    const [activeChallenge, setActiveChallenge] = useState<UserChallenge | null>(null);

    // Swipe Logic
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Sync to LocalStorage & Load Challenge
    useEffect(() => {
        if (session?.user) {
            loadActiveChallenge();
        }
    }, [session]);

    const loadActiveChallenge = async () => {
        const challenges = await challengeService.getActiveChallengesByCategory(session!.user.id, 'tasbeeh');
        if (challenges.length > 0) {
            setActiveChallenge(challenges[0]);
        }
    };

    useEffect(() => {
        localStorage.setItem('tasbih_current', count.toString());
        localStorage.setItem('tasbih_laps', lap.toString());
        localStorage.setItem('tasbih_total', totalCount.toString());
        localStorage.setItem('tasbih_history', JSON.stringify(sessionHistory));
    }, [count, lap, totalCount, sessionHistory]);

    const playClick = () => {
        if (!isSoundEnabled) return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { console.warn("Audio Context blocked", e); }
    };

    const recordMilestone = async (amount: number) => {
        if (session?.user) {
            const res = await challengeService.recordTasbeehCount(session.user.id, amount);
            if (res.success) {
                loadActiveChallenge(); // Refresh progress
            }
        }
    };

    const handleIncrement = useCallback(() => {
        playClick();
        if (isVibrateEnabled && navigator.vibrate) navigator.vibrate(20);

        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 100);

        setCount(prev => {
            const next = prev + 1;
            if (target > 0 && next >= target) {
                setLap(l => l + 1);
                if (isVibrateEnabled && navigator.vibrate) navigator.vibrate([100, 50, 100]);
                setSessionHistory(h => [target, ...h].slice(0, 5));

                // Record completion in DB
                recordMilestone(target);

                return 0;
            }
            return next;
        });
        setTotalCount(prev => prev + 1);
    }, [target, isSoundEnabled, isVibrateEnabled, session]);

    const handleResetCurrent = () => {
        setCount(0);
        setLap(0);
        if (isVibrateEnabled && navigator.vibrate) navigator.vibrate(40);
    };

    const handleResetTotal = () => {
        if (confirm('⚠️ سيتم مسح كل شيء نهائياً (العداد، الإجمالي، السجل، والدورات). هل تريد المتابعة؟')) {
            setCount(0);
            setLap(0);
            setTotalCount(0);
            setSessionHistory([]);
            localStorage.removeItem('tasbih_current');
            localStorage.removeItem('tasbih_laps');
            localStorage.removeItem('tasbih_total');
            localStorage.removeItem('tasbih_history');
            if (isVibrateEnabled && navigator.vibrate) navigator.vibrate([100, 100, 100]);
        }
    };

    // Swipe Detection
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 70;
        const isRightSwipe = distance < -70;

        if (isLeftSwipe) {
            setSelectedDhikr(prev => (prev + 1) % DHIKR_LIST.length);
            handleResetCurrent();
        } else if (isRightSwipe) {
            setSelectedDhikr(prev => (prev - 1 + DHIKR_LIST.length) % DHIKR_LIST.length);
            handleResetCurrent();
        }
    };

    const progress = target > 0 ? (count / target) * 100 : (count % 33 / 33) * 100;

    return (
        <div className="w-full max-w-4xl mx-auto px-4 pb-44 flex flex-col items-center space-y-8 animate-fade-in relative">

            {/* --- CHALLENGE PROGRESS HEADER --- */}
            {activeChallenge && (
                <div className="w-full glass-panel p-4 md:p-6 rounded-[2.5rem] border border-amber-500/20 bg-amber-500/5 flex items-center justify-between gap-4 shadow-xl animate-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Target size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest block">التحدي الفعال</span>
                            <h4 className="text-xs md:text-sm font-black text-white">{activeChallenge.challenge_details?.title}</h4>
                            <p className="text-[9px] text-gray-500 font-bold">المتبقي: {(activeChallenge.challenge_details?.total_pages || 0) - activeChallenge.pages_completed} تسبيحة</p>
                        </div>
                    </div>
                    <div className="flex-1 max-w-[120px] md:max-w-[200px] space-y-2">
                        <div className="flex justify-between text-[8px] font-black text-amber-500/60 uppercase">
                            <span>{Math.round((activeChallenge.pages_completed / (activeChallenge.challenge_details?.total_pages || 1)) * 100)}%</span>
                            <span>{activeChallenge.pages_completed} / {activeChallenge.challenge_details?.total_pages}</span>
                        </div>
                        <div className="h-1.5 md:h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (activeChallenge.pages_completed / (activeChallenge.challenge_details?.total_pages || 1)) * 100)}%` }}
                                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* --- TOP SETTINGS BAR --- */}
            <div className="w-full glass-panel p-4 rounded-[2.5rem] border border-white/10 flex items-center justify-between shadow-2xl backdrop-blur-3xl">
                <div className="flex gap-2.5">
                    {THEMES.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t)}
                            className={`w-9 h-9 rounded-full border-2 transition-all duration-300 relative ${theme.id === t.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            style={{ backgroundColor: t.primary }}
                        >
                            {theme.id === t.id && <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                        className={`p-3 rounded-2xl transition-all duration-300 ${isSoundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-600'}`}
                    >
                        {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                    <button
                        onClick={() => setIsVibrateEnabled(!isVibrateEnabled)}
                        className={`p-3 rounded-2xl transition-all duration-300 ${isVibrateEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-600'}`}
                    >
                        <Smartphone size={20} />
                    </button>
                </div>
            </div>

            {/* --- DHIKR LABEL DISPLAY (SWIPEABLE AREA) --- */}
            <div
                className="w-full text-center py-4 relative group cursor-grab active:cursor-grabbing select-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="flex items-center justify-center gap-8">
                    <button onClick={() => { setSelectedDhikr(prev => (prev - 1 + DHIKR_LIST.length) % DHIKR_LIST.length); handleResetCurrent(); }} className="p-2 text-gray-600 hover:text-white transition-colors">
                        <ChevronRight size={24} />
                    </button>

                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 duration-500" key={selectedDhikr}>
                        <h2 className="text-3xl md:text-5xl font-quran text-white font-black drop-shadow-xl tracking-wide">
                            {DHIKR_LIST[selectedDhikr].text}
                        </h2>
                        <span className="text-[10px] font-black tracking-[0.4em] text-emerald-400 mt-2 uppercase opacity-80">
                            {DHIKR_LIST[selectedDhikr].label}
                        </span>
                    </div>

                    <button onClick={() => { setSelectedDhikr(prev => (prev + 1) % DHIKR_LIST.length); handleResetCurrent(); }} className="p-2 text-gray-600 hover:text-white transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                    {DHIKR_LIST.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${selectedDhikr === i ? 'w-6 bg-emerald-500' : 'w-1 bg-white/10'}`}></div>
                    ))}
                </div>
            </div>

            {/* --- THE CORE INTERACTIVE HUB --- */}
            <div
                className="relative w-full max-w-sm aspect-square flex items-center justify-center"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Visual Aura */}
                <div className="absolute inset-0 rounded-full blur-[100px] transition-all duration-1000 opacity-30" style={{ backgroundColor: theme.primary }}></div>

                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-2xl">
                    <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="14" />
                    <circle
                        cx="50%" cy="50%" r="44%"
                        fill="none"
                        stroke={theme.primary}
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray="276"
                        strokeDashoffset={276 - (276 * progress) / 100}
                        className="transition-all duration-500 ease-out"
                        style={{ filter: `drop-shadow(0 0 15px ${theme.primary})` }}
                    />
                </svg>

                {/* Main Crystal Button */}
                <div
                    onClick={handleIncrement}
                    className={`relative w-[78%] h-[78%] rounded-full bg-gradient-to-br ${theme.bg} border-[3px] border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1),inset_0_4px_20px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center cursor-pointer active:scale-90 transition-all duration-100 group select-none overflow-hidden`}
                >
                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] scale-[2] rotate-12"></div>

                    {isAnimating && <div className="absolute inset-0 bg-white/10 animate-ping"></div>}

                    <div className="relative z-10 text-center">
                        <span
                            className={`block text-[8rem] md:text-[9.5rem] font-black tabular-nums transition-all duration-300 leading-none
                            ${isAnimating ? 'scale-105 text-white brightness-125' : ''}`}
                            style={{ color: isAnimating ? '#fff' : theme.primary, textShadow: isAnimating ? `0 0 40px ${theme.primary}` : 'none' }}
                        >
                            {count}
                        </span>

                        <div className="mt-2 flex flex-col items-center">
                            {lap > 0 && (
                                <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 animate-in zoom-in shadow-xl">
                                    <Award size={14} className="text-yellow-400 animate-bounce" />
                                    <span className="text-[10px] font-black text-white">الدورة {lap}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Swipe Helper Text */}
                <div className="absolute -bottom-6 flex items-center gap-2 text-gray-600 text-[10px] font-bold animate-pulse">
                    <ChevronRight size={12} />
                    <span>اسحب للتبديل بين الأذكار</span>
                    <ChevronLeft size={12} />
                </div>
            </div>

            {/* --- STATS & RESET CONTROL DECK --- */}
            <div className="w-full max-w-sm space-y-5 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-panel p-5 rounded-[2.5rem] border border-white/5 flex flex-col justify-center relative overflow-hidden group/stats">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-xl transition-all group-hover/stats:scale-150"></div>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">الإجمالي المحفوظ</span>
                        <div className="flex items-baseline gap-1 relative z-10">
                            <span className="text-3xl font-black text-white tabular-nums">{totalCount.toLocaleString()}</span>
                            <span className="text-[9px] font-bold" style={{ color: theme.primary }}>ذِكر</span>
                        </div>
                    </div>

                    <button
                        onClick={handleResetCurrent}
                        className="group flex flex-col items-center justify-center gap-2 bg-[#1e293b]/40 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 rounded-[2.5rem] transition-all duration-300 active:scale-95"
                    >
                        <RotateCcw size={28} className="text-gray-500 group-hover:text-orange-400 group-hover:rotate-[-60deg] transition-all duration-500" />
                        <span className="text-[10px] font-black text-gray-500 group-hover:text-orange-400 uppercase">تصفير الحالي</span>
                    </button>
                </div>

                {/* Target Selector */}
                <div className="bg-black/40 p-1.5 rounded-[2rem] border border-white/10 flex gap-2">
                    {TARGETS.map(t => (
                        <button
                            key={t}
                            onClick={() => { setTarget(t); handleResetCurrent(); }}
                            className={`flex-1 py-3.5 rounded-2xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-1.5
                                ${target === t
                                    ? 'bg-emerald-500 text-[#0f172a] shadow-lg scale-[1.02]'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {t === 0 ? <Zap size={14} fill="currentColor" /> : t}
                            <span className="text-[8px] opacity-60 font-bold">{t === 0 ? 'مفتوح' : 'مرة'}</span>
                        </button>
                    ))}
                </div>

                {/* Master Wipeout Button */}
                <button
                    onClick={handleResetTotal}
                    className="w-full py-4 rounded-[2rem] border border-red-500/10 bg-red-500/5 hover:bg-red-500/15 text-red-500/40 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 group/delete"
                >
                    <Trash2 size={14} className="group-hover/delete:scale-110 transition-transform" />
                    حذف كافة البيانات نهائياً
                </button>
            </div>

            {/* --- ACHIEVEMENTS LOG --- */}
            {sessionHistory.length > 0 && (
                <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <div className="flex items-center gap-2 text-gray-600 mb-3 px-4">
                        <History size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">أحدث الإنجازات</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar px-2">
                        {sessionHistory.map((h, i) => (
                            <div key={i} className="px-5 py-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-[11px] font-bold text-emerald-400 whitespace-nowrap flex items-center gap-2 shadow-inner">
                                <CheckCircle2 size={12} />
                                تم إكمال {h} ذِكر
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
