
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Calendar, Bell, Volume2, Sun, Moon, Search, Globe, ChevronDown, CheckCircle2, Navigation, Settings2, RefreshCw, Sparkles, LocateFixed } from 'lucide-react';
import { CountrySelector } from './CountrySelector';
import { CitySelector } from './CitySelector';

export const PrayerTimes: React.FC = () => {
    const [prayerTimes, setPrayerTimes] = useState<any>(null);
    const [location, setLocation] = useState<string>('جاري تحديد الموقع...');
    const [country, setCountry] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [isAutoLocation, setIsAutoLocation] = useState(true);
    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: { h: string; m: string }; percent: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [notificationToast, setNotificationToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAutoLocation) {
            handleAutoLocation();
        } else if (city && country) {
            fetchByCityCountry(city, country);
        }
    }, [isAutoLocation, city, country]);

    const handleAutoLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`);
                    const geoData = await geoRes.json();
                    const detectedLoc = geoData.address.city || geoData.address.town || geoData.address.state || 'موقع غير معروف';
                    setLocation(detectedLoc);

                    const date = new Date().toISOString().split('T')[0];
                    const prayerRes = await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=4`);
                    const prayerData = await prayerRes.json();
                    setPrayerTimes(prayerData.data.timings);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            }, () => {
                setLoading(false);
                setLocation('يرجى تفعيل الموقع');
                setIsAutoLocation(false);
            });
        }
    };

    const fetchByCityCountry = async (cityName: string, countryCode: string) => {
        if (!cityName || !countryCode) return;
        setLoading(true);
        try {
            const date = new Date().toISOString().split('T')[0];
            const prayerRes = await fetch(`https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(countryCode)}&method=4`);
            const prayerData = await prayerRes.json();
            if (prayerData.data && prayerData.data.timings) {
                setPrayerTimes(prayerData.data.timings);
                setLocation(`${cityName}، ${countryCode}`);
            }
        } catch (error) {
            console.error('Error fetching by city:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!prayerTimes) return;

        const timer = setInterval(() => {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();

            const prayers = [
                { name: 'الفجر', id: 'Fajr', time: prayerTimes.Fajr },
                { name: 'الشروق', id: 'Sunrise', time: prayerTimes.Sunrise },
                { name: 'الظهر', id: 'Dhuhr', time: prayerTimes.Dhuhr },
                { name: 'العصر', id: 'Asr', time: prayerTimes.Asr },
                { name: 'المغرب', id: 'Maghrib', time: prayerTimes.Maghrib },
                { name: 'العشاء', id: 'Isha', time: prayerTimes.Isha }
            ];

            let next = null;
            let prev = null;

            for (let i = 0; i < prayers.length; i++) {
                const [h, m] = prayers[i].time.split(':').map(Number);
                const pTime = h * 60 + m;

                if (pTime > currentTime) {
                    next = prayers[i];
                    prev = prayers[i === 0 ? prayers.length - 1 : i - 1];
                    break;
                }
            }

            if (!next) {
                next = prayers[0];
                prev = prayers[prayers.length - 1];
            }

            const [nh, nm] = next.time.split(':').map(Number);
            const nextTotal = nh * 60 + nm;
            const diff = nextTotal > currentTime ? nextTotal - currentTime : (1440 - currentTime + nextTotal);

            const hours = Math.floor(diff / 60);
            const mins = diff % 60;

            const [ph, pm] = prev.time.split(':').map(Number);
            const prevTotal = ph * 60 + pm;
            const span = nextTotal > prevTotal ? nextTotal - prevTotal : (1440 - prevTotal + nextTotal);
            const passed = nextTotal > currentTime ? currentTime - prevTotal : (currentTime > prevTotal ? currentTime - prevTotal : 1440 - prevTotal + currentTime);
            const percent = (passed / span) * 100;

            setNextPrayer({
                name: next.name,
                time: next.time,
                remaining: { h: hours.toString(), m: mins.toString() },
                percent: Math.min(100, Math.max(0, percent))
            });

            // Trigger notification at prayer time
            if (isAlertActive && hours === 0 && mins === 0) {
                const lastNotif = localStorage.getItem('last_prayer_notif');
                const uniqueKey = `${next.name}_${new Date().toDateString()}`;

                if (lastNotif !== uniqueKey) {
                    new Notification("نور الإسلام", {
                        body: `حان الآن موعد أذان ${next.name} (${next.time})`,
                        icon: "/logo.png",
                        requireInteraction: true
                    });
                    localStorage.setItem('last_prayer_notif', uniqueKey);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [prayerTimes, isAlertActive]);

    const prayerOrder = [
        { id: 'Fajr', name: 'الفجر', icon: <Sun className="opacity-50" /> },
        { id: 'Sunrise', name: 'الشروق', icon: <Sun /> },
        { id: 'Dhuhr', name: 'الظهر', icon: <Sun className="text-yellow-400" /> },
        { id: 'Asr', name: 'العصر', icon: <Sun className="text-orange-400" /> },
        { id: 'Maghrib', name: 'المغرب', icon: <Moon className="text-orange-300" /> },
        { id: 'Isha', name: 'العشاء', icon: <Moon className="text-blue-300" /> }
    ];

    const toggleNotifications = async () => {
        if (!isAlertActive) {
            // Check for notification permission
            if ("Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setIsAlertActive(true);
                    setNotificationToast({ message: "تم تفعيل تنبيهات الأذان بنجاح", type: 'success' });
                    // Send a test notification
                    new Notification("نور الإسلام", {
                        body: "سيتم تنبيهك عند دخول وقت الصلاة بإذن الله",
                        icon: "/logo.png"
                    });
                } else {
                    setNotificationToast({ message: "يرجى تفعيل صلاحيات التنبيهات من المتصفح", type: 'info' });
                }
            } else {
                setNotificationToast({ message: "هذا المتصفح لا يدعم التنبيهات", type: 'info' });
            }
        } else {
            setIsAlertActive(false);
            setNotificationToast({ message: "تم إيقاف التنبيهات", type: 'info' });
        }

        // Auto-hide toast
        setTimeout(() => setNotificationToast(null), 3000);
    };

    return (
        <div className="w-full relative min-h-screen" dir="rtl">
            {/* Page specific background elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[100px]" style={{ animationDelay: '-3s' }}></div>
            </div>

            {/* Custom Toast Notification */}
            {notificationToast && (
                <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-500">
                    <div className={`px-8 py-4 rounded-2xl border backdrop-blur-3xl shadow-2xl flex items-center gap-4 ${notificationToast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white'
                        }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notificationToast.type === 'success' ? 'bg-emerald-500' : 'bg-gray-500'}`}>
                            <Bell size={18} className="text-white" />
                        </div>
                        <span className="text-lg font-bold">{notificationToast.message}</span>
                    </div>
                </div>
            )}

            {/* Background elements */}
            <div className="w-full max-w-5xl mx-auto px-4 pb-48 animate-fade-in space-y-8">
                {/* Header - Compact */}
                <div className="relative group/header">
                    <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full scale-110 pointer-events-none"></div>

                    <div className="glass-panel p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 shadow-premium relative backdrop-blur-3xl z-[50]">
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>

                        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8 relative z-10">
                            <div className="text-right space-y-3 flex-1 w-full">
                                <div className="flex items-center justify-end gap-3 text-emerald-400 font-black tracking-[0.3em] uppercase text-[10px]">
                                    <Sparkles size={14} />
                                    شعائر الصلاة
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-white premium-text-gradient tracking-tighter leading-tight drop-shadow-xl">
                                    مواقيت اليوم
                                </h2>
                                <div className="flex flex-wrap items-center justify-end gap-3">
                                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs md:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-500/10">
                                        <MapPin size={16} className="animate-bounce" />
                                        <span>{location}</span>
                                    </div>
                                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs md:text-sm font-bold flex items-center gap-2 backdrop-blur-xl">
                                        <Calendar size={16} />
                                        <span>{new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 md:gap-4">
                                <button
                                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                    className={`h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-[1.8rem] flex items-center justify-center transition-all duration-700 shadow-xl group/settings
                                    ${isSettingsOpen ? 'bg-emerald-500 text-white rotate-180' : 'bg-[#1e293b]/80 text-emerald-400 border border-white/10 hover:bg-emerald-500/20'}`}
                                >
                                    <Settings2 size={24} className="group-hover/settings:scale-110 transition-transform" />
                                </button>
                                <button
                                    onClick={() => { setIsAutoLocation(true); handleAutoLocation(); }}
                                    className="h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-[1.8rem] bg-[#1e293b]/80 border border-white/10 flex items-center justify-center text-teal-400 hover:bg-teal-500/20 transition-all active:scale-90 shadow-xl group/locate"
                                >
                                    <LocateFixed size={24} className={`group-hover/locate:scale-110 transition-transform ${loading && isAutoLocation ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className={`transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSettingsOpen ? 'max-h-[800px] mt-10 opacity-100 visible' : 'max-h-0 opacity-0 invisible overflow-hidden'}`}>
                            <div className="pt-10 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="flex items-center justify-end gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest pointer-events-none mb-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 w-fit ml-auto">
                                        <Globe size={12} />
                                        منطقة التوقيت
                                    </label>
                                    <CountrySelector value={country} onChange={(code) => { setCountry(code); setIsAutoLocation(false); }} />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-end gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest pointer-events-none mb-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 w-fit ml-auto">
                                        <MapPin size={12} />
                                        المدينة المحددة
                                    </label>
                                    <CitySelector countryCode={country} value={city} onChange={(name) => { setCity(name); setIsAutoLocation(false); }} />
                                </div>

                                <div className="lg:col-span-2 flex justify-end">
                                    <button
                                        onClick={() => { setIsAutoLocation(true); setIsSettingsOpen(false); }}
                                        className={`group flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-lg transition-all duration-500 shadow-xl
                                        ${isAutoLocation ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:bg-emerald-500/10'}`}
                                    >
                                        <Navigation size={20} className={isAutoLocation ? 'animate-pulse' : 'group-hover:translate-x-[-4px] group-hover:translate-y-[-4px] transition-transform'} />
                                        الموقع التلقائي
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-fade-in">
                        <div className="relative">
                            <div className="w-24 h-24 border-[8px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Clock size={32} className="text-emerald-500 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-xl font-black text-white premium-text-gradient animate-pulse tracking-widest uppercase">جاري التحديث</p>
                    </div>
                ) : nextPrayer && (
                    <div className="space-y-8 md:space-y-16">
                        {/* Main Countdown Display */}
                        <div className="glass-card p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 relative overflow-hidden group/main shadow-2xl bg-[#0f172a]/40 backdrop-blur-md">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-teal-500/[0.04]"></div>
                            <div className="absolute -top-24 -left-24 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[100px] animate-pulse"></div>

                            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 md:gap-24">
                                
                                {/* REFINED Visual Progress Hub (Smaller & Cleaner on Mobile) */}
                                <div className="relative w-44 h-44 md:w-[20rem] md:h-[20rem] flex items-center justify-center shrink-0">
                                    <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-[60px] md:blur-[100px] scale-110"></div>
                                    <svg className="w-full h-full rotate-[-90deg]">
                                        <circle
                                            cx="50%" cy="50%" r="46%"
                                            className="stroke-white/5 fill-none stroke-[4] md:stroke-[8]"
                                        />
                                        <circle
                                            cx="50%" cy="50%" r="46%"
                                            className="stroke-emerald-500 fill-none stroke-[6] md:stroke-[12] transition-all duration-1000 ease-in-out drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            style={{
                                                strokeDasharray: '289',
                                                strokeDashoffset: `${289 - (289 * nextPrayer.percent) / 100}`,
                                                strokeLinecap: 'round'
                                            }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 md:space-y-5">
                                        <div className="p-3 md:p-5 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                                            <Clock size={24} className="text-emerald-400 md:w-12 md:h-12" />
                                        </div>
                                        <div className="text-center">
                                            <span className="text-4xl md:text-8xl font-black text-white tabular-nums tracking-tighter block leading-none drop-shadow-2xl">
                                                {nextPrayer.time}
                                            </span>
                                            <div className="flex items-center justify-center gap-2 mt-2 md:mt-4 opacity-80">
                                                <span className="text-[10px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">موعد الأذان</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 text-center lg:text-right space-y-6 md:space-y-10 w-full">
                                    <div className="space-y-2 md:space-y-4">
                                        <div className="flex items-center justify-center lg:justify-end gap-3 md:gap-5 text-emerald-400 font-black tracking-[0.3em] uppercase text-[10px] md:text-xs">
                                            <span className="w-8 md:w-16 h-1 bg-gradient-to-r from-transparent to-emerald-500/40 rounded-full"></span>
                                            الصلاة القادمة
                                        </div>
                                        <h3 className="text-5xl md:text-[9rem] font-black text-white tracking-tighter leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] font-amiri">
                                            {nextPrayer.name}
                                        </h3>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center justify-center lg:justify-end gap-4 md:gap-8">
                                        {/* SUPREME Remaining Time Box */}
                                        <div className="group/remaining relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-white/[0.08] to-white/[0.01] border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition-all duration-700 hover:border-emerald-500/40 hover:scale-[1.02] w-full md:w-auto">
                                            <div className="relative z-10 flex items-stretch">
                                                <div className="flex-1 px-6 py-4 md:px-10 md:py-5 flex flex-col items-center justify-center">
                                                    <div className="flex items-center gap-2 mb-1 md:mb-3">
                                                        <span className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] drop-shadow-sm">المتبقي</span>
                                                    </div>

                                                    <div className="flex items-center gap-3 md:gap-5">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-3xl md:text-5xl font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-lg">
                                                                {nextPrayer.remaining.h}
                                                            </span>
                                                            <span className="text-[8px] font-black text-emerald-500/50 uppercase mt-1 md:mt-2 tracking-widest">ساعة</span>
                                                        </div>

                                                        <div className="flex items-center h-8 md:h-10">
                                                            <span className="text-xl md:text-2xl font-black text-emerald-500/40 font-amiri translate-y-[-2px] md:translate-y-[-4px]">و</span>
                                                        </div>

                                                        <div className="flex flex-col items-center">
                                                            <span className="text-3xl md:text-5xl font-black text-white tabular-nums tracking-tighter leading-none drop-shadow-lg">
                                                                {nextPrayer.remaining.m}
                                                            </span>
                                                            <span className="text-[8px] font-black text-emerald-500/50 uppercase mt-1 md:mt-2 tracking-widest">دقيقة</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Alert Button */}
                                        <button
                                            onClick={toggleNotifications}
                                            className={`w-full md:w-auto group/bell relative px-8 py-4 md:px-10 md:py-6 rounded-[2rem] md:rounded-[2.5rem] font-black text-sm md:text-xl flex items-center justify-center gap-3 md:gap-4 transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl overflow-hidden
                                            ${isAlertActive ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                                        >
                                            <Bell size={20} className={`md:w-7 md:h-7 ${isAlertActive ? 'animate-bounce' : 'group-hover/bell:animate-bounce'}`} />
                                            <span>{isAlertActive ? 'التنبيه مفعل' : 'تفعيل التنبيه'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grid 3-Under-3 for Mobile */}
                        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 md:gap-8">
                            {prayerOrder.map((prayer, idx) => {
                                const isNext = nextPrayer?.name === prayer.name;
                                return (
                                    <div
                                        key={prayer.id}
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                        className={`glass-panel p-3 md:p-10 rounded-[2rem] md:rounded-[3.5rem] flex flex-col items-center justify-center gap-2 md:gap-8 border transition-all duration-1000 relative overflow-hidden group animate-in slide-in-from-bottom-5
                                        ${isNext
                                                ? 'border-emerald-500/50 bg-emerald-500/20 scale-105 z-20 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)]'
                                                : 'border-white/5 hover:border-white/20 hover:-translate-y-2'}`}
                                    >
                                        <div className={`p-3 md:p-6 rounded-2xl md:rounded-[2rem] transition-all duration-1000 shadow-xl relative z-10
                                        ${isNext ? 'bg-emerald-500 text-white scale-110 shadow-emerald-500/40' : 'bg-white/5 text-gray-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10'}`}>
                                            {React.cloneElement(prayer.icon as any, { size: 24 })}
                                        </div>

                                        <div className="text-center space-y-1 md:space-y-3 relative z-10">
                                            <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-wider md:tracking-[0.3em] transition-colors ${isNext ? 'text-emerald-300' : 'text-gray-600'}`}>
                                                {prayer.name}
                                            </p>
                                            <p className={`text-sm md:text-4xl font-black tabular-nums tracking-tighter ${isNext ? 'text-white' : 'text-gray-200'}`}>
                                                {prayerTimes[prayer.id]}
                                            </p>
                                        </div>

                                        {isNext && (
                                            <div className="absolute bottom-3 md:bottom-6 flex gap-2">
                                                <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
