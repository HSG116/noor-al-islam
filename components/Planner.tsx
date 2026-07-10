
import React, { useState, useEffect } from 'react';
import { plannerService } from '../services/plannerService';
import { MemorizationPlan, PlanStrategy, DayTask, PlanScopeType } from '../types';
import {
    Calendar, ChevronLeft, Award, AlertTriangle, Pause, RefreshCw, CheckCircle,
    Shield, BatteryWarning, CalendarClock, Bookmark, Target, Zap, Sparkles,
    Layers, FileText, Trash2, Map, PlusCircle, X, BookOpen, Clock, ArrowRightCircle,
    FastForward, Loader2, Sunrise, Repeat, Headphones, PenTool, BrainCircuit, BookOpenCheck, Info
} from 'lucide-react';
import { CountrySelector } from './CountrySelector';
import { CitySelector } from './CitySelector';

// تعريف أساليب الحفظ
const MEMORIZATION_METHODS = [
    {
        id: 'PRAYERS',
        title: 'تقسيم الصلوات الخمس',
        icon: <Sunrise size={24} />,
        shortDesc: 'حفظ جزء صغير بعد كل صلاة.',
        fullDesc: 'تعتمد هذه الطريقة على استغلال أوقات الصلوات لتقسيم الورد اليومي إلى 5 أجزاء صغيرة. بدلاً من الجلوس لساعة كاملة، تخصص 10-15 دقيقة بعد كل صلاة لحفظ بضعة أسطر. هذا الأسلوب يجعلك دائم الصلة بالمصحف طوال اليوم ويقلل من الشعور بثقل المهمة.',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20'
    },
    {
        id: 'REPETITION',
        title: 'طريقة الحصون (التكرار)',
        icon: <Repeat size={24} />,
        shortDesc: 'تكرار الآية 20 مرة والربط.',
        fullDesc: 'واحدة من أقوى طرق التثبيت. الخطوات: 1. اقرأ الآية الأولى 20 مرة نظرًا. 2. اقرأها غيبًا. 3. انتقل للآية الثانية وكررها 20 مرة. 4. اربط الآيتين معاً وكررهما 5 مرات. استمر هكذا حتى تنهي الوجه. هذه الطريقة تضمن رسوخ الحفظ لمدى طويل.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20'
    },
    {
        id: 'AUDIO',
        title: 'التلقين السمعي',
        icon: <Headphones size={24} />,
        shortDesc: 'الاستماع المكثف قبل الحفظ.',
        fullDesc: 'مثالية لمن يعتمدون على الذاكرة السمعية. الخطوة الأساسية هي الاستماع للورد الجديد من قارئ متقن (مثل الحصري) 10-15 مرة بتركيز عالٍ قبل محاولة الحفظ. هذا يصحح النطق تلقائياً ويجعل الآيات مألوفة للذهن قبل البدء بالحفظ الفعلي.',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20'
    },
    {
        id: 'WRITING',
        title: 'الحفظ بالكتابة',
        icon: <PenTool size={24} />,
        shortDesc: 'كتابة الآيات غيباً لتثبيت الرسم.',
        fullDesc: 'تستخدم هذه الطريقة "الذاكرة الحركية والبصرية". بعد حفظ الوجه، قم بإحضار ورقة وقلم واكتب ما حفظته كاملاً برسم المصحف. أي خطأ تقع فيه أثناء الكتابة يدل على ضعف في الحفظ يحتاج لمراجعة. ما يُكتب باليد يرسخ في العقل بقوة.',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20'
    },
    {
        id: 'TAFSEER',
        title: 'الربط الموضوعي (التفسير)',
        icon: <BookOpenCheck size={24} />,
        shortDesc: 'فهم القصة والمعنى قبل الحفظ.',
        fullDesc: 'لا تحفظ كلمات مبهمة! قبل الحفظ، اقرأ تفسير الورد (مثل التفسير الميسر). قسّم الصفحة إلى "مواضيع" (مثلاً: قصة نبي، ثم حكم شرعي). حفظ "المعاني" يجعل تذكر "الكلمات" أسهل بكثير ويقلل من التشتت.',
        color: 'text-teal-400',
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/20'
    },
    {
        id: 'STANDARD',
        title: 'الطريقة التقليدية',
        icon: <BrainCircuit size={24} />,
        shortDesc: 'تكرار الصفحة كاملة حتى الثبات.',
        fullDesc: 'الطريقة المعتادة: قراءة الصفحة كاملة عدة مرات حتى تألفها، ثم محاولة تسميعها آية آية، ثم جمع الصفحة كاملة. هي طريقة مرنة وتناسب من لا يحبون التقيد بقيود محددة.',
        color: 'text-gray-400',
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/20'
    }
];

// --- WIZARD COMPONENT ---
const PlannerWizard: React.FC<{ onPlanCreated: (p: MemorizationPlan) => void }> = ({ onPlanCreated }) => {
    const [step, setStep] = useState(1);
    const TOTAL_STEPS = 6; // Increased to 6

    const [scopeType, setScopeType] = useState<PlanScopeType>(PlanScopeType.FULL_QURAN);
    const [rangeMode, setRangeMode] = useState<'PAGES' | 'JUZ'>('PAGES');
    const [customRange, setCustomRange] = useState({ start: 1, end: 604 });
    const [juzRange, setJuzRange] = useState({ start: 1, end: 30 });
    const [strategy, setStrategy] = useState<PlanStrategy>(PlanStrategy.CAPACITY);
    const [pagesPerDay, setPagesPerDay] = useState(2);
    const [deadline, setDeadline] = useState('');
    const [offDays, setOffDays] = useState<number[]>([5]);

    // New State for Method
    const [selectedMethod, setSelectedMethod] = useState<string>('STANDARD');
    const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
    const [country, setCountry] = useState<string>('');
    const [city, setCity] = useState<string>('');

    const [reviewEnabled, setReviewEnabled] = useState(true);
    const [reviewRatio, setReviewRatio] = useState(5);
    const [previewEndDate, setPreviewEndDate] = useState<Date | null>(null);
    const [calculatedDailyPages, setCalculatedDailyPages] = useState<number>(0);

    // Validation State
    const [error, setError] = useState<string | null>(null);

    const JUZ_START_PAGES = [
        0, 1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
        202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
        402, 422, 442, 462, 482, 502, 522, 542, 562, 582
    ];

    // Sync Juz changes to Pages
    useEffect(() => {
        if (scopeType === PlanScopeType.CUSTOM_RANGE && rangeMode === 'JUZ') {
            const startPage = JUZ_START_PAGES[juzRange.start] || 1;
            let endPage = 604;
            if (juzRange.end < 30) {
                endPage = (JUZ_START_PAGES[juzRange.end + 1] || 605) - 1;
            }
            setCustomRange({ start: startPage, end: endPage });
        }
    }, [juzRange, rangeMode, scopeType]);

    // Logic & Validation
    useEffect(() => {
        setError(null);

        // 1. Validation Logic
        if (scopeType === PlanScopeType.CUSTOM_RANGE) {
            if (rangeMode === 'PAGES') {
                if (customRange.start > customRange.end) {
                    setError('عفواً! رقم صفحة البداية يجب أن يكون أصغر من النهاية.');
                } else if (customRange.start < 1 || customRange.end > 604) {
                    setError('أرقام الصفحات يجب أن تكون ضمن المصحف (1-604).');
                }
            } else {
                // Juz Mode
                if (juzRange.start > juzRange.end) {
                    setError('عفواً! الجزء الذي تبدأ به يجب أن يكون قبل الجزء الذي تنتهي به.');
                } else if (juzRange.start < 1 || juzRange.end > 30) {
                    setError('أرقام الأجزاء يجب أن تكون بين 1 و 30.');
                }
            }
        }

        // 2. Calculation Logic (only if valid)
        const start = scopeType === PlanScopeType.FULL_QURAN ? 1 : customRange.start;
        const end = scopeType === PlanScopeType.FULL_QURAN ? 604 : customRange.end;

        // Only calculate if ranges are logically valid
        if (start <= end) {
            if (strategy === PlanStrategy.CAPACITY) {
                const result = plannerService.calculateProjectedEndDate(start, end, pagesPerDay, offDays, 0);
                setPreviewEndDate(result.date);
            } else if (strategy === PlanStrategy.DEADLINE && deadline) {
                const target = new Date(deadline);
                const reqRate = plannerService.calculateRequiredRate(start, end, target, offDays);
                setCalculatedDailyPages(reqRate);
                setPreviewEndDate(target);
            }
        }
    }, [step, scopeType, customRange, juzRange, rangeMode, strategy, pagesPerDay, deadline, offDays]);

    const handleFinish = () => {
        if (error) return; // Prevent creating invalid plans

        const start = scopeType === PlanScopeType.FULL_QURAN ? 1 : customRange.start;
        const end = scopeType === PlanScopeType.FULL_QURAN ? 604 : customRange.end;
        let finalPPD = pagesPerDay;
        let finalDate = previewEndDate || new Date();

        if (strategy === PlanStrategy.DEADLINE) {
            finalPPD = calculatedDailyPages;
            if (deadline) finalDate = new Date(deadline);
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const newPlan: MemorizationPlan = {
            id: crypto.randomUUID(),
            userId: 'local',
            startDate: new Date().toISOString(),
            targetEndDate: finalDate.toISOString(),
            scopeType,
            startPage: start,
            endPage: end,
            strategy,
            pagesPerDay: finalPPD,
            offDays,
            memorizationStyle: selectedMethod, // SAVE SELECTED METHOD
            lastPrayerCompleted: 'NONE', // Initialize Prayer Strategy State
            city: selectedMethod === 'PRAYERS' ? city : undefined,
            country: selectedMethod === 'PRAYERS' ? country : undefined,
            reviewEnabled,
            reviewRatio,
            currentPage: start,
            completedPages: 0,
            totalDaysElapsed: 0,
            streak: 0,
            backlogPages: 0,
            lastActivityDate: yesterday.toISOString()
        };

        onPlanCreated(newPlan);
    };

    const weekDays = [
        { id: 6, label: 'السبت' }, { id: 0, label: 'الأحد' }, { id: 1, label: 'الاثنين' },
        { id: 2, label: 'الثلاثاء' }, { id: 3, label: 'الأربعاء' }, { id: 4, label: 'الخميس' }, { id: 5, label: 'الجمعة' }
    ];

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <h3 className="text-xl font-bold text-white">ما هو هدفك؟ (نطاق الحفظ)</h3>
                        <div className="grid gap-4">
                            <button onClick={() => { setScopeType(PlanScopeType.FULL_QURAN); setError(null); }} className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between ${scopeType === PlanScopeType.FULL_QURAN ? 'bg-emerald-500/20 border-emerald-500' : 'bg-white/5 border-white/10'}`}><span className="font-bold">كامل المصحف (604 صفحة)</span>{scopeType === PlanScopeType.FULL_QURAN && <CheckCircle size={20} className="text-emerald-400" />}</button>
                            <button onClick={() => setScopeType(PlanScopeType.CUSTOM_RANGE)} className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between ${scopeType === PlanScopeType.CUSTOM_RANGE ? 'bg-emerald-500/20 border-emerald-500' : 'bg-white/5 border-white/10'}`}><span className="font-bold">تحديد أجزاء أو صفحات</span>{scopeType === PlanScopeType.CUSTOM_RANGE && <CheckCircle size={20} className="text-emerald-400" />}</button>
                        </div>
                        {scopeType === PlanScopeType.CUSTOM_RANGE && (
                            <div className="bg-black/20 p-4 rounded-xl border border-white/10 space-y-4">
                                <div className="flex bg-black/40 p-1 rounded-lg">
                                    <button onClick={() => setRangeMode('PAGES')} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${rangeMode === 'PAGES' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400'}`}><FileText size={16} />بالصفحات</button>
                                    <button onClick={() => setRangeMode('JUZ')} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${rangeMode === 'JUZ' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400'}`}><Layers size={16} />بالأجزاء</button>
                                </div>
                                {rangeMode === 'PAGES' ? (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">من صفحة</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="604"
                                                // Using || '' allows clearing the input fully
                                                value={customRange.start || ''}
                                                onChange={e => setCustomRange({ ...customRange, start: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                                className={`w-full bg-black/30 border rounded-lg p-2 text-center text-white focus:outline-none focus:border-emerald-500 ${error ? 'border-red-500/50' : 'border-white/10'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">إلى صفحة</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="604"
                                                value={customRange.end || ''}
                                                onChange={e => setCustomRange({ ...customRange, end: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                                className={`w-full bg-black/30 border rounded-lg p-2 text-center text-white focus:outline-none focus:border-emerald-500 ${error ? 'border-red-500/50' : 'border-white/10'}`}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-400 block mb-1">من الجزء</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={juzRange.start || ''}
                                                    onChange={e => setJuzRange({ ...juzRange, start: e.target.value === '' ? 0 : Math.min(30, Math.max(1, parseInt(e.target.value))) })}
                                                    className={`w-full bg-black/30 border rounded-lg p-2 text-center text-white focus:outline-none focus:border-emerald-500 ${error ? 'border-red-500/50' : 'border-white/10'}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 block mb-1">إلى الجزء</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={juzRange.end || ''}
                                                    onChange={e => setJuzRange({ ...juzRange, end: e.target.value === '' ? 0 : Math.min(30, Math.max(1, parseInt(e.target.value))) })}
                                                    className={`w-full bg-black/30 border rounded-lg p-2 text-center text-white focus:outline-none focus:border-emerald-500 ${error ? 'border-red-500/50' : 'border-white/10'}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-center text-xs text-emerald-400 bg-emerald-900/20 py-2 rounded-lg">يعادل الصفحات: من {customRange.start} إلى {customRange.end}</div>
                                    </div>
                                )}

                                {/* ERROR MESSAGE DISPLAY */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg flex items-center gap-2 text-red-300 text-sm animate-in zoom-in">
                                        <AlertTriangle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 2: return (<div className="space-y-6 animate-in slide-in-from-right duration-300"><h3 className="text-xl font-bold text-white">معادلة الحساب</h3><div className="flex gap-2 bg-black/20 p-1 rounded-xl"><button onClick={() => setStrategy(PlanStrategy.CAPACITY)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${strategy === PlanStrategy.CAPACITY ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}>حسب مقدرتي</button><button onClick={() => setStrategy(PlanStrategy.DEADLINE)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${strategy === PlanStrategy.DEADLINE ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>حسب التاريخ</button></div>{strategy === PlanStrategy.CAPACITY ? (<div className="bg-glass-panel p-6 rounded-2xl border border-white/10 text-center"><BatteryWarning size={32} className="mx-auto text-emerald-400 mb-2" /><label className="block text-gray-300 mb-4">كم صفحة تستطيع حفظها في اليوم؟</label><div className="flex items-center justify-center gap-4"><button onClick={() => setPagesPerDay(Math.max(0.5, pagesPerDay - 0.5))} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white">-</button><span className="text-4xl font-bold text-emerald-400">{pagesPerDay}</span><button onClick={() => setPagesPerDay(pagesPerDay + 0.5)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white">+</button></div><span className="text-xs text-gray-500 mt-2 block">صفحة / يوم</span></div>) : (<div className="bg-glass-panel p-6 rounded-2xl border border-white/10 text-center"><Calendar size={32} className="mx-auto text-blue-400 mb-2" /><label className="block text-gray-300 mb-4">متى تود الختم بإذن الله؟</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-black/30 border border-white/20 rounded-xl p-3 text-white text-center focus:border-blue-500 outline-none" /></div>)}</div>);
            case 3: return (<div className="space-y-6 animate-in slide-in-from-right duration-300"><h3 className="text-xl font-bold text-white">الجدول الأسبوعي</h3><p className="text-sm text-gray-400">حدد أيام الراحة (لن يتم جدولة حفظ جديد فيها)</p><div className="flex flex-wrap gap-2 justify-center">{weekDays.map(d => (<button key={d.id} onClick={() => { if (offDays.includes(d.id)) setOffDays(offDays.filter(x => x !== d.id)); else setOffDays([...offDays, d.id]); }} className={`w-24 py-3 rounded-xl border font-bold transition-all ${offDays.includes(d.id) ? 'bg-slate-800 border-slate-700 text-gray-500' : 'bg-emerald-600 border-emerald-500 text-white shadow-lg'}`}>{d.label}{offDays.includes(d.id) && <span className="block text-[10px] font-normal mt-1">راحة</span>}</button>))}</div></div>);

            // --- NEW STEP: Memorization Methods ---
            case 4:
                return (
                    <div className="space-y-4 animate-in slide-in-from-right duration-300 h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-600">
                        <div className="sticky top-0 bg-[#1e293b] z-10 py-2 border-b border-white/5 mb-2">
                            <h3 className="text-xl font-bold text-white">الأسلوب المفضل للحفظ</h3>
                            <p className="text-sm text-gray-400">اختر الطريقة التي تناسب نمط حياتك وذاكرتك.</p>
                        </div>

                        <div className="grid gap-3">
                            {MEMORIZATION_METHODS.map((method) => {
                                const isSelected = selectedMethod === method.id;
                                const isExpanded = expandedMethod === method.id;

                                return (
                                    <div
                                        key={method.id}
                                        className={`relative rounded-xl border transition-all duration-300 overflow-hidden ${isSelected ? `${method.bg} ${method.border} ring-1 ring-emerald-500/50` : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <div
                                            onClick={() => setSelectedMethod(method.id)}
                                            className="p-4 flex items-start gap-4 cursor-pointer"
                                        >
                                            <div className={`mt-1 ${isSelected ? method.color : 'text-gray-500'}`}>
                                                {method.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className={`font-bold text-base ${isSelected ? 'text-white' : 'text-gray-300'}`}>{method.title}</h4>
                                                    {isSelected && <CheckCircle size={18} className="text-emerald-500" />}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                                    {method.shortDesc}
                                                </p>
                                            </div>
                                        </div>

                                        {/* زر التفاصيل */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedMethod(isExpanded ? null : method.id);
                                            }}
                                            className="absolute bottom-4 left-4 text-gray-500 hover:text-white transition-colors"
                                        >
                                            <Info size={18} />
                                        </button>

                                        {/* قسم الشرح التفصيلي */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2">
                                                <div className="mt-2 pt-3 border-t border-white/5">
                                                    <p className="text-sm text-gray-300 leading-7 bg-black/20 p-3 rounded-lg">
                                                        {method.fullDesc}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {selectedMethod === 'PRAYERS' && (
                            <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl mt-4 animate-in fade-in slide-in-from-bottom-2 space-y-4">
                                <p className="text-xs text-emerald-400 font-bold mb-2">تحديد الموقع لتفعيل مواقيت الصلاة:</p>
                                <CountrySelector value={country} onChange={setCountry} />
                                {country && <CitySelector countryCode={country} value={city} onChange={setCity} />}
                            </div>
                        )}
                    </div>
                );

            case 5: return (<div className="space-y-6 animate-in slide-in-from-right duration-300"><div className="flex justify-between items-center"><h3 className="text-xl font-bold text-white">نظام المراجعة</h3><div onClick={() => setReviewEnabled(!reviewEnabled)} className={`w-14 h-8 rounded-full flex items-center p-1 cursor-pointer transition-colors ${reviewEnabled ? 'bg-emerald-500' : 'bg-gray-700'}`}><div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${reviewEnabled ? 'translate-x-0' : '-translate-x-6'}`}></div></div></div>{reviewEnabled && (<div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl"><div className="flex items-start gap-4"><RefreshCw className="text-blue-400 mt-1" size={24} /><div><p className="font-bold text-white mb-2">قاعدة التثبيت</p><p className="text-sm text-gray-300 mb-4">لكل وجه جديد تحفظه، كم وجه قديم تراجع؟</p><div className="flex items-center gap-3"><span className="text-white font-bold">1 حفظ : </span><input type="number" value={reviewRatio || ''} onChange={(e) => setReviewRatio(Math.max(1, parseInt(e.target.value) || 0))} className="w-16 bg-black/30 border border-white/20 rounded-lg p-2 text-center text-white font-bold focus:outline-none focus:border-blue-500" /><span className="text-white font-bold">مراجعة</span></div><p className="text-xs text-blue-300 mt-3">مثال: حفظت الوجه 10، ستراجع من 5 إلى 9.</p></div></div></div>)}{!reviewEnabled && (<div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-200 text-sm flex items-center gap-2"><AlertTriangle size={16} />تحذير: الحفظ بدون مراجعة عرضة للنسيان السريع.</div>)}</div>);
            case 6: return (
                <div className="space-y-6 animate-in slide-in-from-right duration-300 text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-4 animate-bounce"><Sparkles size={40} /></div>
                    <h3 className="text-2xl font-bold text-white">خطتك جاهزة!</h3>
                    <div className="bg-glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-gray-400">تاريخ الختم المتوقع</span><span className="text-xl font-bold text-emerald-400">{previewEndDate?.toLocaleDateString('ar-SA', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-gray-400">الوتيرة اليومية</span><span className="text-white font-bold">{strategy === PlanStrategy.CAPACITY ? pagesPerDay : calculatedDailyPages} صفحة</span></div>

                        {/* Show selected Method in Summary */}
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-gray-400">أسلوب الحفظ</span>
                            <span className="text-emerald-400 font-bold text-sm">
                                {MEMORIZATION_METHODS.find(m => m.id === selectedMethod)?.title}
                            </span>
                        </div>

                        <div className="flex justify-between items-center"><span className="text-gray-400">نظام المراجعة</span><span className="text-blue-300 font-bold">{reviewEnabled ? `1 : ${reviewRatio}` : 'معطل'}</span></div>
                    </div>
                    <p className="text-sm text-gray-500">اضغط "ابدأ الرحلة" لحفظ الخطة واعتمادها.</p>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 pb-24 flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div>
                </div>

                <div className="mt-6">
                    {renderStepContent()}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between">
                    {step > 1 ? (
                        <button onClick={() => setStep(step - 1)} className="text-gray-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
                            <ArrowRightCircle size={20} className="rotate-180" />
                            السابق
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step < TOTAL_STEPS ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!!error}
                            className={`px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all ${error ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        >
                            التالي
                            <ArrowRightCircle size={20} />
                        </button>
                    ) : (
                        <button onClick={handleFinish} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20">
                            ابدأ الرحلة
                            <Sparkles size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- DASHBOARD COMPONENT ---

const PlannerDashboard: React.FC<{ plan: MemorizationPlan; onPlanUpdate: (p: MemorizationPlan | null) => void; session: any; onNavigate: (start: number, end: number, type: 'NEW' | 'REVIEW', isAdvance?: boolean) => void }> = ({ plan, onPlanUpdate, session, onNavigate }) => {
    const [todayTask, setTodayTask] = useState<DayTask | null>(null);
    const [nextTaskOverride, setNextTaskOverride] = useState<DayTask | null>(null);

    // Track Review Completion Locally for the Session/Day
    const [isReviewDone, setIsReviewDone] = useState(false);

    const [showBusyModal, setShowBusyModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [projectedDate, setProjectedDate] = useState<Date>(new Date(plan.targetEndDate));

    useEffect(() => {
        setNextTaskOverride(null);

        // Check local storage for review status
        const reviewStatus = plannerService.getReviewStatus(plan.id);
        setIsReviewDone(reviewStatus);

        const task = plannerService.getTodayTask(plan);
        setTodayTask(task);
        const calc = plannerService.calculateProjectedEndDate(plan.currentPage, plan.endPage, plan.pagesPerDay, plan.offDays, plan.backlogPages);
        setProjectedDate(calc.date);
    }, [plan]);

    const handleComplete = (isAdvance: boolean = false) => {
        const updated = plannerService.completeDay(plan, isAdvance);
        onPlanUpdate(updated);
        setNextTaskOverride(null);
    };

    const handleEmergency = (mode: 'EXTEND' | 'COMPENSATE') => {
        const updated = plannerService.handleEmergency(plan, mode);
        onPlanUpdate(updated);
        setShowBusyModal(false);
    };

    const handleDelete = async () => {
        await plannerService.deletePlan(session?.user?.id);
        onPlanUpdate(null);
    }

    const handleAdvance = () => {
        const startNew = plan.currentPage;
        let dailyTarget = plan.pagesPerDay;

        if (plan.backlogPages > 0) {
            dailyTarget += Math.max(0.5, plan.backlogPages / 7);
        }

        dailyTarget = Math.ceil(dailyTarget * 2) / 2;
        let endNew = startNew + Math.floor(dailyTarget) - 1;
        if (dailyTarget % 1 !== 0) endNew = startNew + Math.ceil(dailyTarget) - 1;
        if (endNew > plan.endPage) endNew = plan.endPage;

        let reviewStart = null;
        let reviewEnd = null;

        if (plan.reviewEnabled && plan.reviewRatio > 0) {
            const reviewCount = Math.ceil(dailyTarget * plan.reviewRatio);
            reviewEnd = Math.max(1, startNew - 1);
            reviewStart = Math.max(1, reviewEnd - reviewCount + 1);
            if (reviewStart < plan.startPage) reviewStart = plan.startPage;
        }

        const hasReview = reviewStart !== null && reviewEnd !== null && reviewEnd >= reviewStart;

        const nextTask: DayTask = {
            date: new Date().toISOString(),
            isOffDay: false,
            newPages: { start: startNew, end: endNew },
            reviewPages: hasReview ? { start: reviewStart!, end: reviewEnd! } : null,
            isBacklog: plan.backlogPages > 0,
            isDone: false
        };

        setNextTaskOverride(nextTask);
        setShowAdvanceModal(false);
    };

    if (!todayTask) return null;

    const activeTask = nextTaskOverride || todayTask;
    const isOverridden = !!nextTaskOverride;

    const progressPercent = Math.round((plan.completedPages / (plan.endPage - plan.startPage + 1)) * 100);
    const getScopeLabel = () => {
        if (plan.scopeType === PlanScopeType.FULL_QURAN) return "كامل المصحف الشريف";
        return `من صفحة ${plan.startPage} إلى ${plan.endPage}`;
    }

    // LOGIC: Is the day truly fully done? 
    // It's done if the plan says it's done (memorization finished) AND (review is disabled OR review is locally marked done).
    const isDayFullyComplete = activeTask.isDone && (!plan.reviewEnabled || isReviewDone);

    // Logic: Is memorization done but review pending?
    const isReviewPending = activeTask.isDone && plan.reviewEnabled && !isReviewDone;

    return (
        <div className="max-w-4xl mx-auto px-4 pb-24 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center justify-between mt-4 mb-2">
                <div><h2 className="text-2xl font-bold text-white flex items-center gap-2"><Target className="text-emerald-400" />لوحة المتابعة</h2><p className="text-xs text-gray-400">التزم بالخطة لتختم في الموعد بإذن الله</p></div>
                <div className="text-left"><span className="block text-xs text-gray-400">تاريخ الختم المتوقع</span><span className={`block text-lg font-bold ${plan.backlogPages > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>{projectedDate.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl text-sm text-gray-300"><Map size={16} className="text-emerald-500" /><span>نطاق الخطة الحالية:</span><span className="font-bold text-white">{getScopeLabel()}</span></div>

            <div className="bg-glass-panel p-1 rounded-full relative h-4 overflow-hidden"><div className="absolute inset-0 bg-gray-800"></div><div className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-400 transition-all duration-1000 rounded-full" style={{ width: `${progressPercent}%` }}></div><span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md z-10">{progressPercent}% مكتمل</span></div>

            <div className={`glass-panel p-6 md:p-8 rounded-[2.5rem] border relative overflow-hidden group shadow-2xl transition-all duration-500 ${isOverridden ? 'border-teal-500/30 shadow-teal-900/20' : 'border-white/10 shadow-emerald-900/10'}`}>

                <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${isOverridden ? 'bg-teal-500' : 'bg-emerald-500'}`}></div>
                {isOverridden && <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-10"></div>}

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            {isOverridden ? (
                                <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent font-bold text-xs uppercase mb-1 block flex items-center gap-1 animate-pulse">
                                    <FastForward size={12} className="text-teal-400" />
                                    ورد الغد / إضافي
                                </span>
                            ) : (
                                <span className="text-emerald-400 font-bold text-xs uppercase mb-1 block">مهمة اليوم</span>
                            )}

                            <h1 className="text-4xl font-bold text-white font-quran leading-tight">
                                {isOverridden ? 'انطلق يا بطل 🚀' : isDayFullyComplete ? 'أحسنت صنعاً! 🎉' : activeTask.isOffDay ? 'استراحة محارب ☕️' : 'واصل مسيرك 🚀'}
                            </h1>
                        </div>

                        {!isDayFullyComplete && !activeTask.isOffDay && !isOverridden && (
                            <button onClick={() => setShowBusyModal(true)} className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-4 py-2 rounded-full text-xs transition-colors border border-white/5 flex items-center gap-2">
                                <Zap size={14} className="text-yellow-400" />ظروف طارئة؟
                            </button>
                        )}

                        {isOverridden && (
                            <button onClick={() => setNextTaskOverride(null)} className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-3 py-1 rounded-full text-xs transition-colors border border-white/5">
                                عودة
                            </button>
                        )}
                    </div>

                    {isDayFullyComplete ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center animate-in zoom-in duration-300">
                            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                            <p className="text-lg text-white font-bold mb-2">تم تسجيل إنجاز اليوم</p>
                            <p className="text-sm text-gray-400 mb-4">رصيد الالتزام (Streak): <span className="text-orange-400 font-bold">{plan.streak} يوم</span> 🔥</p>

                            <button
                                onClick={() => setShowAdvanceModal(true)}
                                className="w-full bg-slate-800 hover:bg-slate-700 border border-white/5 text-gray-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-2"
                            >
                                <ArrowRightCircle size={18} className="text-emerald-400" />
                                إنجاز ورد إضافي / إدارة الغد
                            </button>
                        </div>
                    ) : activeTask.isOffDay ? (
                        <div className="bg-slate-700/30 border border-white/5 rounded-2xl p-6 text-center">
                            <div className="w-16 h-16 bg-slate-600/50 rounded-full flex items-center justify-center mx-auto mb-4"><Pause size={32} className="text-slate-300" /></div>
                            <p className="text-gray-300">اليوم راحة حسب جدولك.</p>
                            <p className="text-xs text-gray-500 mt-2 mb-4">يمكنك المراجعة الحرة أو الاستماع للتلاوة.</p>

                            <button
                                onClick={() => setShowAdvanceModal(true)}
                                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 mx-auto transition-all"
                            >
                                <Zap size={16} />
                                إنجاز ورد الغد اليوم
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-bottom duration-300">

                            {/* --- NEW MEMORIZATION TASK --- */}
                            <div className="flex items-stretch gap-4">
                                <div className={`w-1 rounded-full ${isOverridden ? 'bg-teal-500' : 'bg-emerald-600'}`}></div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-sm font-bold ${isOverridden ? 'text-teal-200' : 'text-gray-400'}`}>
                                            {isOverridden ? 'حفظ الورد القادم' : 'حفظ جديد'}
                                        </span>
                                        {/* SHOW CHECKMARK IF DONE */}
                                        {activeTask.isDone && (
                                            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle size={12} /> تم الحفظ
                                            </span>
                                        )}
                                        {activeTask.isBacklog && !activeTask.isDone && (<span className="bg-orange-500/20 text-orange-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={10} />يوجد تعويض</span>)}
                                    </div>

                                    {activeTask.newPages ? (
                                        <>
                                            <div className="text-2xl font-bold text-white flex items-center gap-2"><span>ص {activeTask.newPages!.start}</span><span className={isOverridden ? 'text-teal-400' : 'text-emerald-500'}>➔</span><span>ص {activeTask.newPages!.end}</span></div>
                                            <p className="text-xs text-gray-500 mt-1">تقريباً {activeTask.newPages!.end - activeTask.newPages!.start + 1} صفحات</p>

                                            {/* DISABLE BUTTON IF ALREADY DONE */}
                                            {!activeTask.isDone ? (
                                                <button
                                                    onClick={() => onNavigate(activeTask.newPages!.start, activeTask.newPages!.end, 'NEW', isOverridden)}
                                                    className={`mt-3 w-full md:w-auto px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all font-bold ${isOverridden
                                                        ? 'bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30'
                                                        : 'bg-white/5 hover:bg-white/10 text-emerald-300 border border-emerald-500/30'
                                                        }`}
                                                >
                                                    <BookOpen size={16} />
                                                    {isOverridden ? 'بدء الحفظ الإضافي' : 'اقرأ الورد الآن'}
                                                </button>
                                            ) : (
                                                <div className="mt-3 text-sm text-emerald-500/60 font-bold flex items-center gap-2">
                                                    تم إنجاز الحفظ، أحسنت!
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-gray-400">لا يوجد حفظ جديد (تم الإنجاز)</p>
                                    )}
                                </div>
                            </div>

                            {/* --- REVIEW TASK --- */}
                            {activeTask.reviewPages && (
                                <div className={`flex items-stretch gap-4 mt-6 pt-6 border-t ${isOverridden ? 'border-teal-500/20' : 'border-white/5'}`}>
                                    <div className="bg-blue-600 w-1 rounded-full"></div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-sm font-bold block ${isOverridden ? 'text-blue-300' : 'text-gray-400'}`}>مراجعة وتثبيت</span>
                                            {isReviewDone && (
                                                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <CheckCircle size={12} /> تمت المراجعة
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-xl font-bold text-gray-200 flex items-center gap-2"><span>ص {activeTask.reviewPages.start}</span><span className="text-blue-500">➔</span><span>ص {activeTask.reviewPages.end}</span></div>

                                        {/* Show Review Button if not done */}
                                        {!isReviewDone ? (
                                            <button
                                                onClick={() => onNavigate(activeTask.reviewPages!.start, activeTask.reviewPages!.end, 'REVIEW')}
                                                className={`mt-3 border px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg ${isReviewPending ? 'bg-blue-600 text-white border-blue-500 animate-pulse' : 'bg-white/5 hover:bg-white/10 text-blue-300 border-blue-500/30'}`}
                                            >
                                                <BookOpen size={16} />
                                                {isReviewPending ? 'ابدأ المراجعة (مطلوب)' : 'مراجعة الورد'}
                                            </button>
                                        ) : (
                                            <div className="mt-3 text-sm text-blue-500/60 font-bold flex items-center gap-2">
                                                تمت المراجعة
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Manual Complete Button (Backup) - Only show if not fully complete */}
                            {!isDayFullyComplete && !activeTask.isDone && !isOverridden && (
                                <button onClick={() => handleComplete(false)} className="w-full mt-6 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-white/5">
                                    تسجيل الإنجاز يدوياً
                                </button>
                            )}
                            {isOverridden && (
                                <button onClick={() => handleComplete(true)} className="w-full mt-6 bg-teal-500/10 hover:bg-teal-500/20 text-teal-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-teal-500/20">
                                    تسجيل إنجاز الورد الإضافي يدوياً
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4"><div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center"><Award className="text-orange-400 mb-2" size={24} /><span className="text-2xl font-bold text-white">{plan.streak}</span><span className="text-xs text-gray-400">أيام متتالية</span></div><div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center"><Bookmark className="text-blue-400 mb-2" size={24} /><span className="text-2xl font-bold text-white">{plan.completedPages}</span><span className="text-xs text-gray-400">صفحة محفوظة</span></div></div>

            {!isOverridden && (
                <div className="mt-8 pt-6 border-t border-white/5"><div className="bg-[#1e293b] border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4"><div><h3 className="text-lg font-bold text-white flex items-center gap-2"><RefreshCw className="text-emerald-400" size={20} />إعدادات الخطة</h3><p className="text-xs text-gray-400 mt-1">تريد تغيير نطاق الحفظ أو البدء من جديد؟</p></div><button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border border-white/5 transition-all shadow-lg active:scale-95 group w-full md:w-auto justify-center"><PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300 text-emerald-400" /><span className="font-bold text-sm">إنشاء خطة جديدة</span></button></div></div>
            )}

            {showDeleteModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center px-4"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)}></div><div className="bg-[#1e293b] border border-white/10 w-full max-w-md rounded-[2rem] p-8 relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl"><button onClick={() => setShowDeleteModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X size={24} /></button><div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 border border-emerald-500/20"><RefreshCw size={32} /></div><h3 className="text-2xl font-bold text-center text-white mb-2">بدء رحلة جديدة؟</h3><p className="text-center text-gray-400 mb-8 leading-relaxed">سيتم حذف الخطة الحالية وتصفير جميع سجلات الحفظ (ألوان السور) والبدء من الصفر. هل أنت متأكد؟</p><div className="flex gap-3"><button onClick={handleDelete} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20">نعم، ابدأ من جديد</button><button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition-all">تراجع</button></div></div></div>)}

            {showBusyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowBusyModal(false)}></div>
                    <div className="bg-[#1e293b] border border-white/10 w-full max-w-md rounded-[2rem] p-8 relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
                        <button onClick={() => setShowBusyModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X size={24} /></button>
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-400 border border-yellow-500/20">
                            <BatteryWarning size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-center text-white mb-2">ظروف طارئة؟</h3>
                        <p className="text-center text-gray-400 mb-8 leading-relaxed">
                            لا تقلق! الإسلام دين يسر. كيف تود التعامل مع ورد اليوم؟
                        </p>
                        <div className="space-y-3">
                            <button onClick={() => handleEmergency('EXTEND')} className="w-full bg-white/5 hover:bg-white/10 text-white p-4 rounded-xl flex items-center gap-4 transition-all border border-white/5 group">
                                <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg"><CalendarClock size={20} /></div>
                                <div className="text-right">
                                    <span className="font-bold block text-sm">تمديد الخطة</span>
                                    <span className="text-xs text-gray-500">ترحيل الورد وتأخير تاريخ الختم يومًا.</span>
                                </div>
                            </button>
                            <button onClick={() => handleEmergency('COMPENSATE')} className="w-full bg-white/5 hover:bg-white/10 text-white p-4 rounded-xl flex items-center gap-4 transition-all border border-white/5 group">
                                <div className="bg-orange-500/20 text-orange-400 p-2 rounded-lg"><Layers size={20} /></div>
                                <div className="text-right">
                                    <span className="font-bold block text-sm">تعويض لاحقاً</span>
                                    <span className="text-xs text-gray-500">تراكم الورد كـ "ديون" تقضيها لاحقاً.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAdvanceModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAdvanceModal(false)}></div>
                    <div className="bg-[#1e293b] border border-white/10 w-full max-w-md rounded-[2rem] p-8 relative z-10 animate-in zoom-in-95 duration-200 shadow-2xl">
                        <button onClick={() => setShowAdvanceModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X size={24} /></button>
                        <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-400 border border-teal-500/20">
                            <Zap size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-center text-white mb-2">همة عالية! 🚀</h3>
                        <p className="text-center text-gray-400 mb-8 leading-relaxed">
                            هل تريد استغلال نشاطك وإنجاز ورد الغد الآن؟ سيتم تقديم موعد الختم.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={handleAdvance} className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20">
                                نعم، أعطني الورد التالي
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Planner: React.FC<{ session: any, onNavigate: any }> = ({ session, onNavigate }) => {
    const [plan, setPlan] = useState<MemorizationPlan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const p = await plannerService.fetchPlan(session?.user?.id);
            setPlan(p);
            setLoading(false);
        };
        load();
    }, [session]);

    const handlePlanUpdate = async (newPlan: MemorizationPlan | null) => {
        setPlan(newPlan);
        if (newPlan) {
            await plannerService.savePlan(newPlan, session?.user?.id);
        } else {
            // Delete handled in service, just update state
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;

    if (plan) {
        return <PlannerDashboard plan={plan} onPlanUpdate={handlePlanUpdate} session={session} onNavigate={onNavigate} />;
    }

    return <PlannerWizard onPlanCreated={(p) => handlePlanUpdate(p)} />;
};
