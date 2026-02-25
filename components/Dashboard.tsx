import React, { useEffect, useState } from 'react';
import { progressService } from '../services/progressService';
import { plannerService } from '../services/plannerService';
import { prayerService } from '../services/prayerService';
import { supabase } from '../supabaseClient';
import { UserProgress, MemorizationPlan, PlanScopeType, PrayerTimes } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Award, AlertTriangle, Calendar, BookOpen, CheckCircle, Zap, Target, Clock, Activity, Layers, ArrowUpRight, Sunrise, Sun, Moon, CloudRain, Clock4, MapPin, Sparkles } from 'lucide-react';

interface DashboardProps {
    session: any;
    onNavigate?: (start: number, end: number, type: string, isAdvance?: boolean) => void;
}

const LOGO_URL = "./logo.png";

export const Dashboard: React.FC<DashboardProps> = ({ session, onNavigate }) => {
    const [progress, setProgress] = useState<UserProgress[]>([]);
    const [plan, setPlan] = useState<MemorizationPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [nextPrayer, setNextPrayer] = useState<{ name: string, arabicName: string, time: string, timeLeft: string } | null>(null);

    const [stats, setStats] = useState({
        completedSurahs: 0,
        inProgressSurahs: 0,
        notStartedSurahs: 114
    });

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const currentPlan = await plannerService.fetchPlan(session?.user?.id);
            setPlan(currentPlan);

            if (currentPlan && currentPlan.memorizationStyle === 'PRAYERS' && currentPlan.city && currentPlan.country) {
                const timings = await prayerService.getPrayerTimes(currentPlan.city, currentPlan.country);
                if (timings) {
                    setPrayerTimes(timings);
                    setNextPrayer(prayerService.getNextPrayer(timings));
                }
            }

            const progressData = await progressService.getAll(session?.user?.id);
            setProgress(progressData);

            const completed = progressData.filter(i => i.status === 'completed').length;
            const inProgress = progressData.filter(i => i.status === 'in_progress').length;

            setStats({
                completedSurahs: completed,
                inProgressSurahs: inProgress,
                notStartedSurahs: 114 - completed - inProgress
            });

            setLoading(false);
        };
        loadData();
    }, [session]);

    const totalPages = plan ? (plan.endPage - plan.startPage + 1) : 604;
    const completedPages = plan ? plan.completedPages : 0;
    const progressPercent = Math.min(100, Math.round((completedPages / totalPages) * 100));

    return (
        <div className="max-w-5xl mx-auto px-4 pb-24 space-y-8 md:space-y-12 overflow-x-hidden">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 mt-6 flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex items-center gap-4">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                        <img src={LOGO_URL} alt="Logo" className="w-16 md:w-24 h-auto drop-shadow-2xl relative z-10" />
                    </motion.div>
                    <div className="text-right">
                        <h2 className="text-2xl md:text-5xl font-black text-white leading-tight tracking-tighter">
                            <span className="bg-gradient-to-b from-white to-emerald-100 bg-clip-text text-transparent">إحصائياتك</span>
                        </h2>
                        <p className="text-emerald-500/60 text-xs md:text-lg font-black uppercase tracking-widest">تقدمك في حفظ كتاب الله</p>
                    </div>
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 shadow-lg"
                >
                    <Sparkles size={18} className="text-emerald-300 animate-pulse" />
                    <span className="text-xs md:text-sm font-black uppercase tracking-widest">مستوى المتقن</span>
                </motion.div>
            </motion.header>

            {plan && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8 glass-panel p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px] animate-pulse"></div>

                    <div className="relative z-10 space-y-8 md:space-y-12">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg">
                                <Target size={14} />
                                <span>الخطة الحالية</span>
                            </div>
                            <div className="text-right">
                                <span className="text-emerald-400 font-black text-4xl md:text-7xl font-sans drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">{progressPercent}%</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl md:text-5xl font-black text-white mb-6 md:mb-10 leading-tight">
                                {plan.scopeType === PlanScopeType.FULL_QURAN ? 'ختمة المصحف الشريف' : 'خطة مخصصة'}
                            </h3>

                            <div className="relative h-4 md:h-8 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 relative"
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
                                </motion.div>
                            </div>

                            <div className="flex justify-between mt-4 md:mt-6 text-[10px] md:text-lg font-black text-emerald-500/60 uppercase tracking-widest">
                                <span>{completedPages} صفحة منجزة</span>
                                <span>{totalPages} إجمالي الصفحات</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                <StatCard icon={<CheckCircle size={24} />} label="محفوظة" value={stats.completedSurahs} color="emerald" delay={0.4} />
                <StatCard icon={<Target size={24} />} label="قيد الحفظ" value={stats.inProgressSurahs} color="amber" delay={0.5} />
                <StatCard icon={<BookOpen size={24} />} label="لم تبدأ" value={stats.notStartedSurahs} color="slate" isWideOnMobile delay={0.6} />
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color, isWideOnMobile = false, delay = 0 }: { icon: any, label: string, value: number, color: string, isWideOnMobile?: boolean, delay?: number }) => {
    const colorMap: any = {
        emerald: 'from-emerald-500/20 to-emerald-900/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
        amber: 'from-amber-500/20 to-amber-900/10 text-amber-400 border-amber-500/20 shadow-amber-500/5',
        slate: 'from-slate-500/20 to-slate-900/10 text-slate-400 border-slate-500/20 shadow-slate-500/5'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`glass-panel p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border ${colorMap[color].split(' ')[2]} bg-gradient-to-b ${colorMap[color].split(' ')[0]} ${colorMap[color].split(' ')[1]} ${isWideOnMobile ? 'col-span-2 md:col-span-1' : ''} shadow-2xl relative overflow-hidden group`}
        >
            <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-slate-500'}`}></div>

            <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] bg-black/40 flex items-center justify-center mb-6 md:mb-10 ${colorMap[color].split(' ')[2]} shadow-inner`}>
                {icon}
            </div>
            <p className="text-slate-500 text-[10px] md:text-lg font-black uppercase tracking-widest mb-2">{label}</p>
            <p className="text-3xl md:text-6xl font-black text-white tabular-nums leading-none">
                {value}
                <span className="text-[10px] md:text-xl font-bold text-slate-600 mr-2">سورة</span>
            </p>
        </motion.div>
    );
};
