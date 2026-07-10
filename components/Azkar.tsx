
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowRight, Copy, Check, RotateCcw, Heart, BookOpen, Sun, Moon, Star, Sparkles, Coffee, Moon as MoonIcon, Brain, Home, Plane, Volume2, ChevronRight, ChevronLeft, Award, CheckCircle2, Smile, Shield, Users, MessageCircle, Cloud, CloudRain, Syringe, FileText, Calendar, Camera, BadgeCheck, Loader2, Trophy, BookOpenCheck, Zap } from 'lucide-react';
import { challengeService, AzkarType, AZKAR_TYPES } from '../services/challengeService';

interface AzkarCategory { ID: number; TITLE: string; AUDIO_URL: string; TEXT: string; }
interface AzkarItem { ID: number; ARABIC_TEXT: string; LANGUAGE_ARABIC_TRANSLATED?: string; TRANSLATED_TEXT?: string; REPEAT: number; AUDIO?: string; }

const formatArabic = (text: string) => {
    return text.replace(/\*/g, ' ﴿﴾ ');
};

const DHIKR_QUICK = [
    { text: 'سُبْحَانَ اللَّهِ', label: 'تَسْبِيح' },
    { text: 'الْحَمْدُ لِلَّهِ', label: 'تَحْمِيد' },
    { text: 'لَا إِلَهَ إِلَّا اللَّهُ', label: 'تَهْلِيل' },
    { text: 'اللَّهُ أَكْبَرُ', label: 'تَكْبِير' },
    { text: 'أَسْتَغْفِرُ اللَّهَ', label: 'اسْتِغْفَار' },
    { text: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', label: 'صَلَاةٌ عَلَى النَّبِيِّ' },
    { text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', label: 'حَوْقَلَة' },
    { text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', label: 'تَسْبِيح' },
    { text: 'سُبْحَانَ اللَّهِ الْعَظِيمِ', label: 'تَعْظِيم' },
    { text: 'رَبِّ اغْفِرْ لِي وَارْحَمْنِي', label: 'اسْتِغْفَار' },
    { text: 'اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ', label: 'دُعَاء' },
    { text: 'رَضِيتُ بِاللَّهِ رَبًّا', label: 'رِضَا' },
    { text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ', label: 'عَافِيَة' },
    { text: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ', label: 'دُعَاء يُونُس' },
    { text: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ', label: 'تَوَكُّل' },
    { text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', label: 'صَلَاةٌ عَلَى النَّبِيِّ' },
];

const DUAS = [
    { cat: 'الصباح والمساء', icon: Sun, items: [
        { text: 'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ', translation: 'دعاء الصباح والمساء' },
        { text: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ', translation: 'سيد الاستغفار' },
        { text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ', translation: 'دعاء العافية' },
        { text: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي اللَّهُمَّ عَافِنِي فِي سَمْعِي اللَّهُمَّ عَافِنِي فِي بَصَرِي', translation: 'دعاء العافية في الجسد' },
    ]},
    { cat: 'النوم', icon: MoonIcon, items: [
        { text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', translation: 'عند النوم' },
        { text: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ', translation: 'دعاء النوم' },
        { text: 'بِاسْمِكَ رَبِّ وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ', translation: 'دعاء النوم' },
        { text: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَكَفَانَا وَآوَانَا', translation: 'عند الاستيقاظ' },
        { text: 'الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي وَرَدَّ عَلَيَّ رُوحِي وَأَذِنَ لِي بِذِكْرِهِ', translation: 'دعاء الاستيقاظ' },
    ]},
    { cat: 'الأكل والشرب', icon: Coffee, items: [
        { text: 'بِسْمِ اللَّهِ', translation: 'قبل الأكل' },
        { text: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةَ', translation: 'بعد الأكل' },
        { text: 'بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ', translation: 'إذا نسى التسمية قبل الأكل' },
        { text: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ', translation: 'بعد الأكل والشرب' },
    ]},
    { cat: 'الخروج والمنزل', icon: Home, items: [
        { text: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', translation: 'عند الخروج من المنزل' },
        { text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ أَنْ أَضِلَّ أَوْ أُضَلَّ أَوْ أَزِلَّ أَوْ أُزَلَّ أَوْ أَظْلِمَ أَوْ أُظْلَمَ', translation: 'عند الخروج' },
        { text: 'الْحَمْدُ لِلَّهِ الَّذِي رَدَّنِي سَالِماً', translation: 'عند العودة للمنزل' },
    ]},
    { cat: 'السفر', icon: Plane, items: [
        { text: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى', translation: 'دعاء السفر' },
        { text: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ', translation: 'عند ركوب وسيلة السفر' },
        { text: 'اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ', translation: 'دعاء السفر' },
    ]},
    { cat: 'المسجد', icon: BookOpen, items: [
        { text: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', translation: 'عند دخول المسجد' },
        { text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', translation: 'عند الخروج من المسجد' },
    ]},
    { cat: 'الاختبارات', icon: Brain, items: [
        { text: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي وَاحْلُلْ عُقْدَةً مِنْ لِسَانِي يَفْقَهُوا قَوْلِي', translation: 'قبل المذاكرة والامتحان' },
        { text: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلاً وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً', translation: 'عند صعوبة الامتحان' },
        { text: 'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي', translation: 'بعد المذاكرة' },
    ]},
    { cat: 'الرياح والأمطار', icon: CloudRain, items: [
        { text: 'اللَّهُمَّ صَيِّباً نَافِعاً', translation: 'عند نزول المطر' },
        { text: 'اللَّهُمَّ حَوَالَيْنَا وَلَا عَلَيْنَا', translation: 'دعاء المطر' },
        { text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا وَخَيْرَ مَا فِيهَا وَخَيْرَ مَا أُرْسِلَتْ بِهِ', translation: 'عند هبوب الرياح' },
    ]},
    { cat: 'المرض والعافية', icon: Heart, items: [
        { text: 'لَا بَأْسَ طَهُورٌ إِنْ شَاءَ اللَّهُ', translation: 'زيارة المريض' },
        { text: 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ', translation: 'دعاء المريض' },
        { text: 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ وَاشْفِ أَنْتَ الشَّافِي', translation: 'دعاء الشفاء' },
    ]},
    { cat: 'الزواج والأسرة', icon: Heart, items: [
        { text: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', translation: 'دعاء للأهل والذرية' },
        { text: 'بُورِكَ فِيكَ وَبُورِكَ عَلَيْكَ وَجُمِعَ بَيْنَكُمَا فِي خَيْرٍ', translation: 'دعاء للمتزوجين' },
    ]},
    { cat: 'الجنائز والموتى', icon: Shield, items: [
        { text: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ', translation: 'عند المصيبة' },
        { text: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ', translation: 'دعاء للميت' },
        { text: 'اللَّهُمَّ أَجِرْنِي فِي مُصِيبَتِي وَاخْلُفْ لِي خَيْراً مِنْهَا', translation: 'دعاء الصبر' },
    ]},
];

const TABS = [
    { id: 'azkar', label: 'الأذكار', icon: BookOpen },
    { id: 'tasbih', label: 'تسبيح', icon: Star },
    { id: 'dua', label: 'أدعية', icon: Heart },
];

const getAzkarTypeFromTitle = (title: string): AzkarType | null => {
    if (title.includes('الصباح') || title.includes('الصَّباح')) return 'morning';
    if (title.includes('المساء') || title.includes('المَساء')) return 'evening';
    if (title.includes('النوم') || title.includes('النَّوم')) return 'sleep';
    if (title.includes('بعد الصلاة') || title.includes('الصلاة')) return 'post_prayer';
    if (title.includes('الرقية') || title.includes('الرُّقي')) return 'ruqya';
    return null;
};

export const Azkar: React.FC<{ session?: any }> = ({ session }) => {
    const [activeTab, setActiveTab] = useState('azkar');
    const [categories, setCategories] = useState<AzkarCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<AzkarCategory | null>(null);
    const [azkarContent, setAzkarContent] = useState<AzkarItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [counts, setCounts] = useState<Record<number, number>>({});
    const [copiedId, setCopiedId] = useState<number | string | null>(null);
    const [currentItemIdx, setCurrentItemIdx] = useState(0);
    const [azkarProgress, setAzkarProgress] = useState<Record<AzkarType, { completed: boolean; itemsCount: number }>>({
        morning: { completed: false, itemsCount: 0 },
        evening: { completed: false, itemsCount: 0 },
        sleep: { completed: false, itemsCount: 0 },
        post_prayer: { completed: false, itemsCount: 0 },
        ruqya: { completed: false, itemsCount: 0 },
    });
    const [recordingItem, setRecordingItem] = useState<number | null>(null);
    const [lastCategoryCompletion, setLastCategoryCompletion] = useState<{ type: AzkarType; completed: number; total: number } | null>(null);
    const [celebration, setCelebration] = useState<{ show: boolean; title: string; reward: number; pointsAdded: number } | null>(null);

    const [dhikrIdx, setDhikrIdx] = useState(0);
    const [tasbihCount, setTasbihCount] = useState(0);
    const [tasbihTarget, setTasbihTarget] = useState(33);
    const [tasbihLap, setTasbihLap] = useState(0);
    const [tasbihTotal, setTasbihTotal] = useState(0);

    const [duaCat, setDuaCat] = useState(-1);
    const touchStartX = useRef(0);
    const [todayTasbeeh, setTodayTasbeeh] = useState(0);
    const [recordingTasbeeh, setRecordingTasbeeh] = useState(false);

    // تحميل إجمالي التسبيح اليومي عند فتح تبويب التسبيح
    useEffect(() => {
        if (activeTab === 'tasbih' && session?.user) {
            challengeService.getTasbeehDailyProgress(session.user.id).then(setTodayTasbeeh).catch(() => {});
        }
    }, [activeTab, session]);

    // التنقل التلقائي عند إكمال الذكر
    const goNext = useCallback(() => {
        if (selectedCategory && currentItemIdx < azkarContent.length - 1) {
            setCurrentItemIdx(i => i + 1);
        }
    }, [selectedCategory, currentItemIdx, azkarContent.length]);

    useEffect(() => { if (activeTab === 'azkar' && categories.length === 0) fetchCategories(); }, [activeTab]);

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [selectedCategory, activeTab, duaCat, currentItemIdx]);

    useEffect(() => {
        if (!session?.user) return;
        challengeService.getAzkarDailyProgress(session.user.id).then(res => {
            const progress = { ...azkarProgress };
            for (const key of AZKAR_TYPES) {
                progress[key].completed = res.progress[key];
                progress[key].itemsCount = res.itemCounts[key];
            }
            setAzkarProgress(progress);
        }).catch(() => {});
    }, [session]);

    // تحديث التقدم عند فتح قسم جديد
    useEffect(() => {
        if (!session?.user || !selectedCategory) return;
        const catType = getAzkarTypeFromTitle(selectedCategory.TITLE);
        if (!catType) return;
        challengeService.getAzkarDailyProgress(session.user.id).then(res => {
            setAzkarProgress(p => ({
                ...p,
                [catType]: {
                    completed: res.progress[catType],
                    itemsCount: res.itemCounts[catType]
                }
            }));
        }).catch(() => {});
    }, [selectedCategory?.ID]);

    const fetchCategories = async () => {
        try { setLoading(true);
            const res = await fetch('https://www.hisnmuslim.com/api/ar/husn_ar.json');
            const data = await res.json();
            setCategories(data['العربية'] || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchAzkarContent = async (cat: AzkarCategory) => {
        try { setLoading(true); setSelectedCategory(cat); setCurrentItemIdx(0);
            const res = await fetch(cat.TEXT.replace('http://', 'https://'));
            const data = await res.json();
            const key = Object.keys(data)[0];
            setAzkarContent(data[key] || []); setCounts({});
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleIncrement = (id: number, goal: number) => {
        // نقرأ العداد الحالي لتحديد إن كنا سنكمل الذكر
        const curCount = counts[id] || 0;
        if (curCount >= goal) return;

        // 1. نحدث العداد فوراً
        setCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

        // 2. إذا أكملنا الذكر، نسجل فوراً في قاعدة البيانات (لا ننتظر setCounts)
        const newCount = curCount + 1;
        if (newCount >= goal && session?.user && selectedCategory) {
            const catType = getAzkarTypeFromTitle(selectedCategory.TITLE);
            if (catType && !azkarProgress[catType].completed) {
                // تسجيل الذكر الفردي فوراً - fire-and-forget مع معالجة الأخطاء
                challengeService.recordAzkarItem(
                    session.user.id,
                    catType,
                    id,
                    { category_title: selectedCategory.TITLE }
                );
                // نحدث عدد الأذكار المسجلة محلياً
                setAzkarProgress(p => ({
                    ...p,
                    [catType]: { ...p[catType], itemsCount: p[catType].itemsCount + 1 }
                }));
                // تحقق من إكمال كل الأذكار في هذه الفئة
                const allCompleted = azkarContent.every(i => {
                    const c = counts[i.ID] || 0;
                    const add = i.ID === id ? 1 : 0;
                    return (c + add) >= (i.REPEAT || 1);
                });
                if (allCompleted && !azkarProgress[catType].completed) {
                    challengeService.recordAzkarCompletion(session.user.id, catType).then(res => {
                        if (res.completedChallenges?.length > 0) {
                            const cc = res.completedChallenges[0];
                            setCelebration({ show: true, title: cc.title, reward: cc.reward, pointsAdded: res.pointsAdded || 0 });
                        }
                    });
                    setAzkarProgress(p => ({ ...p, [catType]: { ...p[catType], completed: true } }));
                }
            }
        }

        if (navigator.vibrate) navigator.vibrate(8);
    };

    const handleCopy = (text: string, id: number | string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
    };

    const filtered = categories.filter(c => c.TITLE.includes(searchQuery));

    // ===== DETAIL VIEW =====
    if (selectedCategory) {
        const item = azkarContent[currentItemIdx];
        const isFirst = currentItemIdx === 0;
        const isLast = currentItemIdx === azkarContent.length - 1;
        const completedItems = azkarContent.filter(i => (counts[i.ID] || 0) >= (i.REPEAT || 1)).length;
        const total = azkarContent.length;
        const progress = total > 0 ? (completedItems / total) * 100 : 0;
        const azkarType = getAzkarTypeFromTitle(selectedCategory.TITLE);
        const categoryCompletedToday = azkarType ? azkarProgress[azkarType].completed : false;
        const currentCount = item ? (counts[item.ID] || 0) : 0;
        const repGoal = item?.REPEAT || 1;
        const isItemComplete = currentCount >= repGoal;

        // لمّستا للسحب (swipe) للتنقل
        const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
        const handleTouchEnd = (e: React.TouchEvent) => {
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (diff > 60 && !isFirst) setCurrentItemIdx(i => i - 1);
            else if (diff < -60 && !isLast) setCurrentItemIdx(i => i + 1);
        };

        return (
            <div className="w-full max-w-2xl mx-auto px-4 pb-32 space-y-3"
                onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                {/* الشريط العلوي */}
                <div className="sticky top-3 z-50">
                    <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/5 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-xl">
                        <button onClick={() => setSelectedCategory(null)}
                            className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white flex items-center justify-center transition-all active:scale-90 shrink-0">
                            <ArrowRight size={18} />
                        </button>
                        <div className="flex-1 text-center min-w-0 px-2">
                            <p className="text-xs md:text-sm font-bold text-white truncate">{selectedCategory.TITLE}</p>
                            <p className="text-[8px] md:text-[9px] text-gray-500 font-medium">
                                {categoryCompletedToday ? '✅ مكتمل اليوم' : `${completedItems}/${total}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            {!categoryCompletedToday && (
                                <>
                                    <button onClick={() => setCurrentItemIdx(i => Math.max(0, i - 1))} disabled={isFirst}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                            ${isFirst ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button onClick={() => setCurrentItemIdx(i => Math.min(total - 1, i + 1))} disabled={isLast}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                            ${isLast ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}`}>
                                        <ChevronLeft size={16} />
                                    </button>
                                </>
                            )}
                            <div className="w-9 h-9 flex items-center justify-center relative shrink-0">
                                {categoryCompletedToday ? (
                                    <BadgeCheck size={22} className="text-emerald-400" />
                                ) : (
                                    <>
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="50%" cy="50%" r="38%" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/10" />
                                            <circle cx="50%" cy="50%" r="38%" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="100" strokeDashoffset={100 - progress} strokeLinecap="round" className="text-emerald-500 transition-all duration-500" />
                                        </svg>
                                        <span className="absolute text-[7px] md:text-[8px] font-bold text-emerald-400">{Math.round(progress)}%</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* نقاط التقدم */}
                {!categoryCompletedToday && total > 1 && (
                    <div className="flex gap-1 justify-center py-1">
                        {azkarContent.map((_, i) => (
                            <button key={i} onClick={() => setCurrentItemIdx(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentItemIdx ? 'w-6 bg-emerald-400' : 'w-1.5 bg-white/10 hover:bg-white/20'}`} />
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-24"><div className="w-10 h-10 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" /></div>
                ) : total === 0 ? (
                    <div className="text-center py-20 text-gray-500 text-sm font-bold">لا توجد أذكار في هذا القسم</div>
                ) : item && (
                    <div className="space-y-3">
                        {/* بطاقة الذكر - المساحة كلها قابلة للنقر للتكبير */}
                        <div onClick={() => !isItemComplete && handleIncrement(item.ID, repGoal)}
                            className={`bg-[#1e293b]/60 border rounded-2xl md:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 select-none
                                ${isItemComplete ? 'border-emerald-500/30' : 'border-white/5 active:scale-[0.99] cursor-pointer'}`}>
                            <div className="p-5 md:p-8 space-y-5 md:space-y-6">
                                {/* النص العربي */}
                                <div className="text-center">
                                    <p className="font-quran text-xl md:text-3xl leading-[2.5] md:leading-[2.8] text-white/90" dir="rtl">
                                        {formatArabic(item.ARABIC_TEXT)}
                                    </p>
                                </div>

                                {/* الترجمة */}
                                {item.TRANSLATED_TEXT && (
                                    <div className="bg-black/30 rounded-xl p-3 md:p-4 border border-white/5">
                                        <p className="text-gray-400 text-[10px] md:text-sm leading-relaxed text-center">{item.TRANSLATED_TEXT}</p>
                                    </div>
                                )}

                                {/* العداد الكبير - زر النقر الأساسي */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl
                                        ${isItemComplete
                                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 scale-110 shadow-emerald-500/40'
                                            : 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/30 hover:from-emerald-500/30 hover:to-emerald-600/20'}`}>
                                        {isItemComplete ? (
                                            <div className="flex flex-col items-center">
                                                <CheckCircle2 size={28} className="text-white mb-1" />
                                                <span className="text-white font-black text-xs">اكتمل ✓</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-4xl md:text-5xl font-black text-emerald-400 tabular-nums">{currentCount}</span>
                                                <span className="text-[10px] md:text-xs text-emerald-500/70 font-bold">/ {repGoal}</span>
                                            </>
                                        )}
                                    </div>

                                    {/* أزرار الإضافة السريعة (تظهر فقط قبل الإكمال) */}
                                    {!isItemComplete && (
                                        <div className="flex items-center gap-2">
                                            {[1, 3, 7, repGoal].filter((v, i, a) => a.indexOf(v) === i).map(goal => (
                                                <button key={goal} onClick={(e) => {
                                                    e.stopPropagation();
                                                    const cur = counts[item.ID] || 0;
                                                    if (goal === 1) { handleIncrement(item.ID, repGoal); return; }
                                                    const remaining = repGoal - cur;
                                                    const toCount = Math.min(goal, remaining);
                                                    if (toCount > 0) {
                                                        setCounts(prev => ({ ...prev, [item.ID]: cur + toCount }));
                                                        if (cur + toCount >= repGoal && session?.user && selectedCategory) {
                                                            const catType = getAzkarTypeFromTitle(selectedCategory.TITLE);
                                                            if (catType && !azkarProgress[catType].completed) {
                                                                challengeService.recordAzkarItem(session.user.id, catType, item.ID, { category_title: selectedCategory.TITLE });
                                                                setAzkarProgress(p => ({ ...p, [catType]: { ...p[catType], itemsCount: p[catType].itemsCount + 1 } }));
                                                            }
                                                        }
                                                    }
                                                }}
                                                    className={`px-3 md:px-4 py-1.5 rounded-xl text-[9px] md:text-[10px] font-bold transition-all active:scale-90
                                                        ${goal === repGoal
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                            : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                                                    +{goal === repGoal ? 'الكل' : goal}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* أزرار إضافية صغيرة (نسخ، إعادة) */}
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleCopy(item.ARABIC_TEXT, item.ID); }}
                                        className={`p-2 rounded-lg transition-all active:scale-90 ${copiedId === item.ID ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}>
                                        {copiedId === item.ID ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                    {currentCount > 0 && !isItemComplete && (
                                        <button onClick={(e) => { e.stopPropagation(); setCounts(p => { const n = { ...p }; delete n[item.ID]; return n; }); }}
                                            className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90">
                                            <RotateCcw size={12} />
                                        </button>
                                    )}
                                    <span className="text-[8px] text-gray-600 font-medium">الذكر {currentItemIdx + 1} من {total}</span>
                                </div>
                            </div>
                        </div>

                        {/* أزرار التنقل بين الأذكار */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => !isFirst && setCurrentItemIdx(i => i - 1)}
                                disabled={isFirst}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95
                                    ${isFirst ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                <ChevronRight size={16} /> السابق
                            </button>
                            <span className="text-[9px] md:text-[10px] text-gray-600 font-bold text-center shrink-0">
                                {completedItems}/{total}
                            </span>
                            {isItemComplete && !isLast ? (
                                <button onClick={() => setCurrentItemIdx(i => i + 1)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95
                                        bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/10">
                                    التالي <ChevronLeft size={16} />
                                </button>
                            ) : (
                                <button onClick={() => !isLast && setCurrentItemIdx(i => i + 1)}
                                    disabled={isLast}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95
                                        ${isLast ? 'opacity-20 cursor-not-allowed' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                    التالي <ChevronLeft size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* رسالة إكمال الفئة بالكامل */}
                {categoryCompletedToday && !loading && (
                    <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center shadow-lg">
                        <BadgeCheck size={32} className="mx-auto text-emerald-400 mb-2" />
                        <p className="text-emerald-400 font-black text-sm">أحسنت! أكملت جميع أذكار هذا القسم اليوم ✅</p>
                        <p className="text-gray-500 text-[10px] font-bold mt-1">استمر في ذكر الله دائمًا</p>
                    </div>
                )}

                {/* Celebration Modal */}
                {celebration?.show && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setCelebration(null)}></div>
                        <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="relative w-full max-w-md bg-gradient-to-br from-emerald-900/90 via-teal-900/80 to-emerald-800/90 backdrop-blur-xl rounded-[3rem] p-8 md:p-10 shadow-2xl border border-emerald-400/30 text-center overflow-hidden">
                            {Array.from({ length: 30 }).map((_, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 1, y: -20, x: Math.random() * 400 - 200, rotate: 0, scale: 0 }}
                                    animate={{ opacity: 0, y: 600, rotate: 720, scale: 1.5 }}
                                    transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: 'easeIn' }}
                                    className="absolute w-2.5 h-2.5 rounded-full"
                                    style={{
                                        background: ['#10b981', '#34d399', '#f59e0b', '#f472b6', '#8b5cf6', '#06b6d4', '#f97316'][i % 7],
                                        left: `${Math.random() * 100}%`,
                                        top: '-10px',
                                        boxShadow: '0 0 6px rgba(255,255,255,0.3)',
                                    }}
                                />
                            ))}
                            <div className="relative z-10 space-y-6">
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                    className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 ring-4 ring-amber-400/30">
                                    <Trophy size={48} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                </motion.div>
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black mb-3">
                                        <Sparkles size={12} /> تهانينا! <Sparkles size={12} />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-black text-white mb-2">أتممت التحدي 🎉</h2>
                                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10 mb-4">
                                        <p className="text-emerald-300 font-black text-lg mb-1">{celebration.title}</p>
                                        <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
                                            <BookOpenCheck size={16} className="text-emerald-400" />
                                            <span>تم الإكمال بنجاح</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 shadow-xl shadow-amber-900/30">
                                            <Zap size={24} className="text-white mx-auto mb-1" fill="currentColor" />
                                            <p className="text-white font-black text-2xl">+{celebration.pointsAdded}</p>
                                            <p className="text-amber-200 text-[9px] font-bold">نقطة</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-xl shadow-emerald-900/30">
                                            <BadgeCheck size={24} className="text-white mx-auto mb-1" />
                                            <p className="text-white font-black text-2xl">+{celebration.reward}</p>
                                            <p className="text-emerald-200 text-[9px] font-bold">جائزة التحدي</p>
                                        </div>
                                    </div>
                                </motion.div>
                                <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                                    onClick={() => setCelebration(null)}
                                    className="bg-white/10 hover:bg-white/20 text-white font-black text-sm px-8 py-3 rounded-2xl border border-white/20 transition-all hover:scale-105 active:scale-95 w-full">
                                    🎊 أحسنت!
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        );
    }

    // ===== MAIN VIEW =====
    return (
        <div className="w-full max-w-4xl mx-auto px-3 md:px-4 pb-32 space-y-4 md:space-y-6">

            <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-1 flex shadow-lg">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all
                            ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                        {React.createElement(tab.icon, { size: 14 })}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ===== AZKAR TAB ===== */}
            {activeTab === 'azkar' && (
                <div className="space-y-4">
                    <div className="relative bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-8 text-center overflow-hidden shadow-lg">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/8 rounded-full blur-3xl"></div>
                        <div className="relative z-10 space-y-3">
                            <h2 className="text-xl md:text-3xl font-black text-white premium-text-gradient">حصن المسلم</h2>
                            <p className="text-gray-500 text-[10px] md:text-sm font-medium">أذكار وأدعية من السنة النبوية</p>
                            <div className="relative max-w-md mx-auto">
                                <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                <input type="text" placeholder="ابحث عن قسم..."
                                    className="w-full bg-black/30 border border-white/5 rounded-xl py-2.5 pr-9 md:pr-10 pl-3 text-white text-xs md:text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-600"
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {loading && categories.length === 0 ? (
                        <div className="flex justify-center py-16"><div className="w-10 h-10 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
                            {filtered.map(cat => {
                                const icons = [Sun, Moon, CheckCircle2, BookOpen, Heart, Star, Coffee, Brain, Shield, Users, MessageCircle, Cloud, CloudRain, Home, Plane, Smile, Camera, FileText, Calendar, Syringe];
                                const Icon = icons[cat.ID % icons.length];
                                return (
                                    <button key={cat.ID} onClick={() => fetchAzkarContent(cat)}
                                        className="group bg-[#1e293b]/30 hover:bg-[#1e293b]/60 border border-white/5 hover:border-emerald-500/20 p-3.5 md:p-5 rounded-xl md:rounded-2xl transition-all duration-300 active:scale-[0.98] text-right flex items-center gap-3 md:gap-4 shadow-sm">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-500/60 group-hover:text-emerald-400 group-hover:scale-110 transition-all shrink-0">
                                            <Icon size={18} className="md:w-5 md:h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs md:text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate">{cat.TITLE}</h3>
                                            <p className="text-[8px] md:text-[9px] text-gray-600 font-medium mt-0.5">
                                                {(() => {
                                                    const tp = getAzkarTypeFromTitle(cat.TITLE);
                                                    if (tp && azkarProgress[tp].completed) return '✅ مكتمل اليوم';
                                                    if (tp && azkarProgress[tp].itemsCount > 0) return `📖 تم ${azkarProgress[tp].itemsCount} أذكار`;
                                                    return 'اضغط للقراءة';
                                                })()}
                                            </p>
                                        </div>
                                        {(() => {
                                            const tp = getAzkarTypeFromTitle(cat.TITLE);
                                            if (tp && azkarProgress[tp].completed) return <BadgeCheck size={16} className="text-emerald-400 shrink-0" />;
                                            return <ChevronRight size={14} className="text-gray-600 group-hover:text-emerald-500 group-hover:-translate-x-1 transition-all shrink-0" />;
                                        })()}
                                    </button>
                                );
                            })}
                            {filtered.length === 0 && <div className="col-span-full py-16 text-center text-gray-500 text-sm font-bold">لا توجد نتائج مطابقة</div>}
                        </div>
                    )}
                </div>
            )}

            {/* ===== TASBIH TAB ===== */}
            {activeTab === 'tasbih' && (
                <div className="space-y-5">
                    <div className="relative bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/5 rounded-2xl md:rounded-3xl p-5 text-center overflow-hidden shadow-lg">
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/8 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-lg md:text-2xl font-black text-white">مُسَبِّحَة</h2>
                            <p className="text-gray-500 text-[9px] md:text-sm font-medium mt-1">اختر الذكر وابدأ التسبيح</p>
                        </div>
                        {session?.user && (
                            <div className="relative z-10 mt-2 inline-flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                <Star size={10} className="text-emerald-400" />
                                <span className="text-[9px] md:text-[10px] font-bold text-emerald-400">اليوم: {todayTasbeeh.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 md:gap-4">
                            <button onClick={() => { setDhikrIdx(i => (i - 1 + DHIKR_QUICK.length) % DHIKR_QUICK.length); setTasbihCount(0); }}
                                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all active:scale-90">
                                <ChevronRight size={22} />
                            </button>
                            <div className="flex flex-col items-center px-2" key={dhikrIdx}>
                                <p className="font-quran text-xl md:text-3xl font-black text-white leading-[2]">{DHIKR_QUICK[dhikrIdx].text}</p>
                                <span className="text-[9px] md:text-[10px] font-bold text-emerald-400/70 mt-1">{DHIKR_QUICK[dhikrIdx].label}</span>
                            </div>
                            <button onClick={() => { setDhikrIdx(i => (i + 1) % DHIKR_QUICK.length); setTasbihCount(0); }}
                                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all active:scale-90">
                                <ChevronLeft size={22} />
                            </button>
                        </div>
                        <div className="flex justify-center gap-1.5">
                            {DHIKR_QUICK.map((_, i) => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${dhikrIdx === i ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/10'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center py-2">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/8 rounded-full blur-[60px]"></div>
                            <svg className="relative w-52 h-52 md:w-72 md:h-72 -rotate-90">
                                <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                                <circle cx="50%" cy="50%" r="44%" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round"
                                    strokeDasharray={`276`}
                                    strokeDashoffset={`${tasbihTarget > 0 ? 276 - (276 * Math.min(tasbihCount, tasbihTarget)) / tasbihTarget : 276 - (276 * (tasbihCount % 33)) / 33}`}
                                    className="transition-all duration-500 ease-out" style={{ filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.4))' }} />
                            </svg>
                            <button onClick={() => {
                                if (navigator.vibrate) navigator.vibrate(12);
                                const wasComplete = tasbihTarget > 0 && tasbihCount + 1 >= tasbihTarget;
                                setTasbihCount(p => {
                                    const n = p + 1;
                                    if (tasbihTarget > 0 && n >= tasbihTarget) { setTasbihLap(l => l + 1); return 0; }
                                    return n;
                                });
                                setTasbihTotal(p => p + 1);
                                // حفظ الدورة عند اكتمال الهدف
                                if (wasComplete && session?.user) {
                                    setRecordingTasbeeh(true);
                                    challengeService.recordTasbeehCount(session.user.id, tasbihTarget).then(res => {
                                        if (res.completedChallenges?.length > 0) {
                                            const cc = res.completedChallenges[0];
                                            setCelebration({ show: true, title: cc.title, reward: cc.reward, pointsAdded: res.pointsAdded || 0 });
                                        }
                                        return challengeService.getTasbeehDailyProgress(session.user.id);
                                    }).then(setTodayTasbeeh).catch(() => {}).finally(() => setRecordingTasbeeh(false));
                                }
                            }}
                                className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-full bg-gradient-to-br from-[#064e3b] to-[#020617] border-[3px] border-white/5 flex flex-col items-center justify-center active:scale-90 transition-all duration-100 shadow-2xl cursor-pointer select-none">
                                <span className="text-5xl md:text-7xl font-black text-emerald-400 tabular-nums">{tasbihCount}</span>
                                {tasbihLap > 0 && (
                                    <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20 mt-1.5">
                                        <Award size={10} className="text-yellow-400" />
                                        <span className="text-[8px] font-bold text-white">الدورة {tasbihLap}</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 max-w-xs mx-auto">
                        {[33, 100, 300, 0].map(t => (
                            <button key={t} onClick={() => { setTasbihTarget(t); setTasbihCount(0); }}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition-all active:scale-95 ${tasbihTarget === t ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                {t === 0 ? '∞' : t}<br /><span className="text-[6px] md:text-[7px] opacity-60">{t === 0 ? 'مفتوح' : 'مرة'}</span>
                            </button>
                        ))}
                    </div>

                    {/* إحصائيات التسبيح مع التحديات */}
                    <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                            <p className="text-[7px] text-gray-500 font-bold">إجمالي الجلسة</p>
                            <p className="text-lg md:text-xl font-black text-white tabular-nums">{tasbihTotal.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                            <p className="text-[7px] text-gray-500 font-bold">اليوم</p>
                            <p className="text-lg md:text-xl font-black text-emerald-400 tabular-nums">{todayTasbeeh.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                            <p className="text-[7px] text-gray-500 font-bold">الدورات</p>
                            <p className="text-lg md:text-xl font-black text-white tabular-nums">{tasbihLap}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        {session?.user && (
                            <button onClick={() => {
                                if (tasbihTotal === 0) return;
                                setRecordingTasbeeh(true);
                                challengeService.recordTasbeehCount(session.user.id, tasbihTotal).then(res => {
                                    if (res.completedChallenges?.length > 0) {
                                        const cc = res.completedChallenges[0];
                                        setCelebration({ show: true, title: cc.title, reward: cc.reward, pointsAdded: res.pointsAdded || 0 });
                                    }
                                    return challengeService.getTasbeehDailyProgress(session.user.id);
                                }).then(setTodayTasbeeh).catch(() => {}).finally(() => setRecordingTasbeeh(false));
                            }} disabled={recordingTasbeeh || tasbihTotal === 0}
                                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-black text-[10px] md:text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-lg shadow-blue-900/30 flex items-center gap-1.5">
                                {recordingTasbeeh ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />}
                                حفظ الجلسة
                            </button>
                        )}
                        <button onClick={() => { setTasbihCount(0); setTasbihLap(0); setTasbihTotal(0); }}
                            className="py-2.5 px-5 rounded-xl border border-red-500/10 bg-red-500/5 text-red-500/40 hover:text-red-400 text-[9px] font-bold transition-all active:scale-95 flex items-center gap-1.5">
                            <RotateCcw size={12} /> تصفير
                        </button>
                    </div>
                </div>
            )}

            {/* ===== DUA TAB ===== */}
            {activeTab === 'dua' && (
                <div className="space-y-3">
                    <div className="relative bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/5 rounded-2xl md:rounded-3xl p-5 text-center overflow-hidden shadow-lg">
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/8 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-xl md:text-3xl font-black text-white premium-text-gradient">الأدعية الجامعة</h2>
                            <p className="text-gray-500 text-[9px] md:text-sm font-medium mt-1">أدعية وأذكار لكل المناسبات من السنة</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {DUAS.map((section, ci) => {
                            const Icon = section.icon;
                            const isOpen = duaCat === ci;
                            return (
                                <div key={ci} className="bg-[#1e293b]/30 border border-white/5 rounded-xl md:rounded-2xl overflow-hidden transition-all shadow-sm">
                                    <button onClick={() => setDuaCat(isOpen ? -1 : ci)}
                                        className="w-full p-3.5 md:p-4 flex items-center justify-between gap-3 active:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                                                <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                                            </div>
                                            <span className="text-xs md:text-sm font-bold text-white truncate">{section.cat}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[8px] md:text-[9px] text-gray-600 font-medium">{section.items.length} دعاء</span>
                                            <ChevronLeft size={15} className={`text-gray-500 transition-transform duration-300 ${isOpen ? '-rotate-90' : ''}`} />
                                        </div>
                                    </button>
                                    {isOpen && (
                                        <div className="px-3.5 pb-3.5 md:px-4 md:pb-4 space-y-2.5 border-t border-white/5 pt-3.5">
                                            {section.items.map((dua, di) => (
                                                <div key={di} className="bg-black/30 border border-white/5 rounded-xl p-4 md:p-5 space-y-3">
                                                    <p className="font-quran text-base md:text-xl leading-[2.5] text-center text-white/90">{formatArabic(dua.text)}</p>
                                                    <div className="bg-emerald-500/5 rounded-lg px-3 py-1.5">
                                                        <p className="text-gray-500 text-[9px] md:text-[10px] text-center font-medium">{dua.translation}</p>
                                                    </div>
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => handleCopy(dua.text, `dua_${ci}_${di}`)}
                                                            className={`p-2 rounded-lg transition-all active:scale-90 ${copiedId === `dua_${ci}_${di}` ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                                            {copiedId === `dua_${ci}_${di}` ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <p className="text-center text-[8px] text-gray-600 font-medium pt-2">﴿ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ﴾</p>
                </div>
            )}

            {/* Celebration Modal */}
            {celebration?.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setCelebration(null)}></div>
                    <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="relative w-full max-w-md bg-gradient-to-br from-emerald-900/90 via-teal-900/80 to-emerald-800/90 backdrop-blur-xl rounded-[3rem] p-8 md:p-10 shadow-2xl border border-emerald-400/30 text-center overflow-hidden">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 1, y: -20, x: Math.random() * 400 - 200, rotate: 0, scale: 0 }}
                                animate={{ opacity: 0, y: 600, rotate: 720, scale: 1.5 }}
                                transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: 'easeIn' }}
                                className="absolute w-2.5 h-2.5 rounded-full"
                                style={{
                                    background: ['#10b981', '#34d399', '#f59e0b', '#f472b6', '#8b5cf6', '#06b6d4', '#f97316'][i % 7],
                                    left: `${Math.random() * 100}%`,
                                    top: '-10px',
                                    boxShadow: '0 0 6px rgba(255,255,255,0.3)',
                                }}
                            />
                        ))}
                        <div className="relative z-10 space-y-6">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 ring-4 ring-amber-400/30">
                                <Trophy size={48} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                            </motion.div>
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black mb-3">
                                    <Sparkles size={12} /> تهانينا! <Sparkles size={12} />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">أتممت التحدي 🎉</h2>
                                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 mb-4">
                                    <p className="text-emerald-300 font-black text-lg mb-1">{celebration.title}</p>
                                    <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
                                        <BookOpenCheck size={16} className="text-emerald-400" />
                                        <span>تم الإكمال بنجاح</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-4">
                                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 shadow-xl shadow-amber-900/30">
                                        <Zap size={24} className="text-white mx-auto mb-1" fill="currentColor" />
                                        <p className="text-white font-black text-2xl">+{celebration.pointsAdded}</p>
                                        <p className="text-amber-200 text-[9px] font-bold">نقطة</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-xl shadow-emerald-900/30">
                                        <BadgeCheck size={24} className="text-white mx-auto mb-1" />
                                        <p className="text-white font-black text-2xl">+{celebration.reward}</p>
                                        <p className="text-emerald-200 text-[9px] font-bold">جائزة التحدي</p>
                                    </div>
                                </div>
                            </motion.div>
                            <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                                onClick={() => setCelebration(null)}
                                className="bg-white/10 hover:bg-white/20 text-white font-black text-sm px-8 py-3 rounded-2xl border border-white/20 transition-all hover:scale-105 active:scale-95 w-full">
                                🎊 أحسنت!
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
