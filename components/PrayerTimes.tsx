
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Calendar, Bell, Volume2, Sun, Moon, Search, Globe, ChevronDown, CheckCircle2, Navigation, Settings2, RefreshCw, Sparkles, LocateFixed } from 'lucide-react';
import { CountrySelector } from './CountrySelector';
import { CitySelector } from './CitySelector';

const CONTINENTS: Record<string, string> = {
    SA:'asia', EG:'africa', SY:'asia', LB:'asia', JO:'asia', PS:'asia',
    IQ:'asia', AE:'asia', KW:'asia', QA:'asia', BH:'asia', OM:'asia',
    YE:'asia', SD:'africa', LY:'africa', TN:'africa', DZ:'africa',
    MA:'africa', MR:'africa', TR:'asia', IR:'asia', PK:'asia',
    IN:'asia', BD:'asia', AF:'asia', ID:'asia', MY:'asia',
    RU:'europe', CN:'asia', FR:'europe', GB:'europe', US:'americas',
    CA:'americas', DE:'europe', IT:'europe', ES:'europe', NL:'europe',
    SE:'europe', NO:'europe', DK:'europe', BE:'europe', CH:'europe',
    AT:'europe', GR:'europe', BR:'americas', AR:'americas',
    ZA:'africa', NG:'africa', SN:'africa', GH:'africa',
    TH:'asia', SG:'asia', PH:'asia', VN:'asia',
    NZ:'oceania', AU:'oceania', IE:'europe', PT:'europe',
    PL:'europe', UA:'europe', RO:'europe', CZ:'europe',
    HU:'europe', FI:'europe', BA:'europe', AL:'europe',
    XK:'europe', MK:'europe', TM:'asia', UZ:'asia',
    KZ:'asia', AZ:'asia', TJ:'asia', KG:'asia',
    AM:'asia', GE:'asia', CY:'europe', MT:'europe',
    IS:'europe', LU:'europe', MC:'europe', LI:'europe',
    SM:'europe', AD:'europe', MD:'europe', BY:'europe',
    LT:'europe', LV:'europe', EE:'europe', SK:'europe',
    SI:'europe', HR:'europe', RS:'europe', ME:'europe',
    BG:'europe', SO:'africa', DJ:'africa', KM:'africa',
    JP:'asia', KR:'asia',
};

const COUNTRY_METHODS: Record<string, { method: number; name: string; school?: number; adjustH?: number }> = {
    SA: { method: 4, name: 'أم القرى' },
    EG: { method: 5, name: 'المصرية العامة', adjustH: 1 },
    SY: { method: 3, name: 'رابطة العالم الإسلامي' },
    LB: { method: 3, name: 'رابطة العالم الإسلامي' },
    JO: { method: 3, name: 'رابطة العالم الإسلامي' },
    PS: { method: 3, name: 'رابطة العالم الإسلامي' },
    IQ: { method: 3, name: 'رابطة العالم الإسلامي' },
    AE: { method: 8, name: 'دبي - الخليج' },
    KW: { method: 9, name: 'الكويت' },
    QA: { method: 10, name: 'قطر' },
    BH: { method: 4, name: 'أم القرى' },
    OM: { method: 8, name: 'الخليج' },
    YE: { method: 3, name: 'رابطة العالم الإسلامي' },
    SD: { method: 5, name: 'المصرية العامة' },
    LY: { method: 5, name: 'المصرية العامة' },
    TN: { method: 3, name: 'رابطة العالم الإسلامي' },
    DZ: { method: 3, name: 'رابطة العالم الإسلامي' },
    MA: { method: 3, name: 'رابطة العالم الإسلامي' },
    MR: { method: 3, name: 'رابطة العالم الإسلامي' },
    TR: { method: 13, name: 'ديانيت التركية' },
    IR: { method: 7, name: 'طهران' },
    PK: { method: 1, name: 'كراتشي' },
    IN: { method: 1, name: 'كراتشي' },
    BD: { method: 1, name: 'كراتشي' },
    AF: { method: 1, name: 'كراتشي' },
    ID: { method: 3, name: 'رابطة العالم الإسلامي' },
    MY: { method: 3, name: 'رابطة العالم الإسلامي' },
    RU: { method: 14, name: 'روسيا' },
    CN: { method: 3, name: 'رابطة العالم الإسلامي' },
};

const getMethodForCountry = (code: string) => COUNTRY_METHODS[code] || { method: 3, name: 'رابطة العالم الإسلامي' };

const adjustTimes = (timings: Record<string, string>, h: number) => {
    if (!h) return timings;
    const r: Record<string, string> = {};
    for (const [k, v] of Object.entries(timings)) {
        const [hh, mm] = v.split(':').map(Number);
        const total = hh + h;
        r[k] = `${total >= 24 ? total - 24 : total < 0 ? total + 24 : total}:${mm.toString().padStart(2, '0')}`;
    }
    return r;
};

const to12h = (t: string) => {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'م' : 'ص';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
};

const geocodeCity = async (city: string, countryCode: string) => {
    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&countrycodes=${countryCode.toLowerCase()}&format=json&limit=1&accept-language=en`
    );
    const data = await res.json();
    if (data?.[0]) return { lat: data[0].lat, lon: data[0].lon };
    return null;
};

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
    const [activeMethod, setActiveMethod] = useState<string>('رابطة العالم الإسلامي');
    const [currentTime, setCurrentTime] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);
    const isFetching = useRef(false);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (isAutoLocation) {
            handleAutoLocation();
        } else if (city && country) {
            fetchByCityCountry(city, country);
        }
    }, [isAutoLocation, city, country]);

    const handleAutoLocation = () => {
        if (isFetching.current) return;
        setIsAutoLocation(true);
        if (!navigator.geolocation) {
            setLocation('المتصفح لا يدعم تحديد الموقع');
            return;
        }
        setLoading(true);
        isFetching.current = true;
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`);
                const geoData = await geoRes.json();
                const detectedLoc = geoData.address.city || geoData.address.town || geoData.address.state || 'موقع غير معروف';
                setLocation(detectedLoc);

                const date = new Date().toISOString().split('T')[0];
                const countryCode = (geoData.address?.country_code || '').toUpperCase();
                const methodInfo = getMethodForCountry(countryCode);
                let url = `https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=${methodInfo.method}`;
                if (methodInfo.school) url += `&school=${methodInfo.school}`;
                setActiveMethod(methodInfo.name);

                const prayerRes = await fetch(url);
                const prayerData = await prayerRes.json();
                setPrayerTimes(adjustTimes(prayerData.data.timings, methodInfo.adjustH || 0));
            } catch (error) {
                console.error('Error fetching data:', error);
                setLocation('خطأ في جلب البيانات');
                setNotificationToast({ message: 'تعذر الاتصال بالخادم، حاول مرة أخرى', type: 'info' });
            } finally {
                setLoading(false);
                isFetching.current = false;
            }
        }, (error) => {
            setLoading(false);
            isFetching.current = false;
            const msg = error.code === error.PERMISSION_DENIED
                ? 'يرجى السماح بالوصول إلى الموقع من إعدادات المتصفح'
                : 'تعذر تحديد الموقع، اختر المدينة يدوياً';
            setLocation(msg);
            setNotificationToast({ message: msg, type: 'info' });
        }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
    };

    const fetchByCityCountry = async (cityName: string, countryCode: string) => {
        if (!cityName || !countryCode) return;
        setLoading(true);
        try {
            const date = new Date().toISOString().split('T')[0];
            const methodInfo = getMethodForCountry(countryCode);
            setActiveMethod(methodInfo.name);

            const continent = CONTINENTS[countryCode] || 'asia';

            if (continent === 'asia') {
                let url = `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(countryCode)}&method=${methodInfo.method}`;
                if (methodInfo.school) url += `&school=${methodInfo.school}`;
                const prayerRes = await fetch(url);
                const prayerData = await prayerRes.json();
                if (prayerData.data && prayerData.data.timings) {
                    setPrayerTimes(adjustTimes(prayerData.data.timings, methodInfo.adjustH || 0));
                    setLocation(`${cityName}، ${countryCode}`);
                    return;
                }
            }

            const coords = await geocodeCity(cityName, countryCode);
            if (!coords) throw new Error('لم نتمكن من تحديد إحداثيات المدينة');

            let url = `https://api.aladhan.com/v1/timings/${date}?latitude=${coords.lat}&longitude=${coords.lon}&method=${methodInfo.method}`;
            if (methodInfo.school) url += `&school=${methodInfo.school}`;
            const prayerRes = await fetch(url);
            const prayerData = await prayerRes.json();
            if (prayerData.data && prayerData.data.timings) {
                setPrayerTimes(adjustTimes(prayerData.data.timings, methodInfo.adjustH || 0));
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
                        icon: "/logo.webp",
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
                        icon: "/logo.webp"
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
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[100px]"></div>
            </div>

            {notificationToast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-500">
                    <div className={`px-5 py-3 rounded-2xl border backdrop-blur-3xl shadow-2xl flex items-center gap-3 ${notificationToast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white'}`}>
                        <Bell size={16} />
                        <span className="text-sm font-bold">{notificationToast.message}</span>
                    </div>
                </div>
            )}

            <div className="w-full max-w-4xl mx-auto px-3 md:px-4 pb-32 space-y-4 md:space-y-6">

                <div className="glass-panel rounded-2xl md:rounded-2xl border border-white/10">
                    <div className="p-4 md:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isSettingsOpen ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:text-emerald-400'}`}
                                >
                                    <Settings2 size={16} />
                                </button>
                                <button
                                    onClick={handleAutoLocation}
                                    className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-teal-400 hover:bg-teal-500/20 transition-all"
                                >
                                    <LocateFixed size={16} className={loading && isAutoLocation ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            <div className="text-center flex-1 min-w-0">
                                <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-[9px] uppercase mb-0.5">
                                    <Sparkles size={10} />
                                    مواقيت الصلاة
                                </div>
                                <h2 className="text-lg md:text-2xl font-black text-white premium-text-gradient leading-tight">
                                    {nextPrayer ? nextPrayer.name : '--'}
                                </h2>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[9px] font-bold flex items-center gap-1.5">
                                    <MapPin size={10} />
                                    <span className="truncate max-w-[80px] md:max-w-[120px]">{location}</span>
                                </div>
                            </div>
                        </div>

                        {nextPrayer && (
                            <div className="mt-3 flex items-center gap-3 bg-emerald-500/5 rounded-xl px-4 py-2.5 border border-emerald-500/10">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-[10px] text-emerald-400/70 font-bold mb-0.5">
                                        <Clock size={10} />
                                        <span>{currentTime.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                        <span className="w-px h-3 bg-emerald-500/20"></span>
                                        <span dir="ltr" className="tabular-nums">
                                            {(() => { const h = currentTime.getHours(); const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h; return `${h12}:${currentTime.getMinutes().toString().padStart(2, '0')}`; })()}
                                        </span>
                                        <span className="text-[8px]">{currentTime.getHours() >= 12 ? 'م' : 'ص'}</span>
                                        <span className="w-px h-3 bg-emerald-500/20"></span>
                                        <span className="text-[8px] text-gray-500" dir="ltr">
                                            UTC{currentTime.getTimezoneOffset() === 0 ? '' : (currentTime.getTimezoneOffset() > 0 ? '-' : '+')}{Math.abs(currentTime.getTimezoneOffset() / 60)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-500">المتبقي</span>
                                        <span className="text-sm md:text-base font-black text-white tabular-nums tracking-tight">
                                            {nextPrayer.remaining.h}<span className="text-[9px] text-emerald-400/60 mx-0.5">س</span>
                                            {nextPrayer.remaining.m}<span className="text-[9px] text-emerald-400/60 mx-0.5">د</span>
                                        </span>
                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[100px]">
                                            <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${nextPrayer.percent}%` }}></div>
                                        </div>
                                        <span className="text-[9px] text-emerald-400/70 font-bold">{to12h(nextPrayer.time)}</span>
                                        <span className="text-[9px] text-gray-500">| {activeMethod}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleNotifications}
                                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isAlertActive ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:text-emerald-400'}`}
                                >
                                    <Bell size={15} className={isAlertActive ? 'animate-bounce' : ''} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={`transition-all duration-500 ${isSettingsOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="border-t border-white/5 p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] text-gray-500 font-bold mb-1.5 block">الدولة</label>
                                <CountrySelector value={country} onChange={(code) => { setCountry(code); setIsAutoLocation(false); }} />
                            </div>
                            <div>
                                <label className="text-[9px] text-gray-500 font-bold mb-1.5 block">المدينة</label>
                                <CitySelector countryCode={country} value={city} onChange={(name) => { setCity(name); setIsAutoLocation(false); }} />
                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <button onClick={() => { handleAutoLocation(); setIsSettingsOpen(false); }}
                                    className={`text-[10px] font-bold px-5 py-2 rounded-xl transition-all ${isAutoLocation ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                                    <Navigation size={14} className="inline ml-1" />
                                    الموقع التلقائي
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                        <div className="w-12 h-12 border-[5px] border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-gray-400">جاري التحديث</p>
                    </div>
                ) : nextPrayer && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                        {prayerOrder.map((prayer, idx) => {
                            const isNext = nextPrayer?.name === prayer.name;
                            return (
                                <div key={prayer.id}
                                    className={`rounded-2xl border transition-all duration-500 p-3 md:p-4 flex flex-col items-center justify-center gap-2 text-center
                                    ${isNext ? 'bg-emerald-500/15 border-emerald-500/40 scale-[1.03] shadow-lg shadow-emerald-500/10' : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/20'}`}>
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${isNext ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                                        {React.cloneElement(prayer.icon as any, { size: 16 })}
                                    </div>
                                    <p className={`text-[9px] md:text-[10px] font-black uppercase ${isNext ? 'text-emerald-300' : 'text-gray-600'}`}>
                                        {prayer.name}
                                    </p>
                                    <p className={`text-xs md:text-sm font-black tabular-nums tracking-tight ${isNext ? 'text-white' : 'text-gray-300'}`}>
                                        {to12h(prayerTimes[prayer.id])}
                                    </p>
                                    {isNext && <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
