
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio as RadioIcon, Search, Heart, Wifi, AlertCircle, ListFilter, BookOpen, Star, Headphones, Mic2, Sparkles, Globe } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { syncService } from '../services/syncService';

interface RadioStation {
    id: string;
    name: string;
    url: string;
    category: string;
}

const CATEGORIES = [
    { id: 'all', label: 'الكل', icon: ListFilter },
    { id: 'fav', label: 'المفضلة', icon: Heart },
    { id: 'reciters', label: 'تلاوات القراء', icon: Mic2 },
    { id: 'quran', label: 'إذاعات القرآن', icon: BookOpen },
    { id: 'translation', label: 'ترجمة المعاني', icon: Globe },
    { id: 'sunnah', label: 'السنة والحديث', icon: Star },
    { id: 'others', label: 'علمية ومنوعة', icon: Headphones }
];

interface RadioProps {
    session?: Session | null;
}

export const Radio: React.FC<RadioProps> = ({ session }) => {
    const [stations, setStations] = useState<RadioStation[]>([]);
    const [filteredStations, setFilteredStations] = useState<RadioStation[]>([]);
    const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(80);
    const [isMuted, setIsMuted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');

    const audioRef = useRef<HTMLAudioElement>(null);
    const isPlayingRef = useRef(false);

    // Load Favorites (local + server) & Fetch API
    useEffect(() => {
        const storedFavs = localStorage.getItem('radio_favorites');
        if (storedFavs) {
            try { setFavorites(JSON.parse(storedFavs)); }
            catch (e) { console.error("Failed to parse favorites", e); }
        }
        if (session?.user) {
            syncService.loadFromServer(session.user.id).then(server => {
                if (server?.radio_favorites?.length) {
                    setFavorites(server.radio_favorites);
                    localStorage.setItem('radio_favorites', JSON.stringify(server.radio_favorites));
                }
            });
        }
        fetchRadioStations();
    }, []);

    // Handle Station Change
    useEffect(() => {
        if (currentStation && audioRef.current) {
            if (isPlaying) {
                playStream(currentStation.url);
            } else {
                audioRef.current.src = currentStation.url;
            }
        }
    }, [currentStation]);

    // Handle Volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume / 100;
        }
    }, [volume, isMuted]);

    // Handle Filtering
    useEffect(() => {
        let result = stations;

        if (activeCategory === 'fav') {
            result = result.filter(s => favorites.includes(s.id));
        } else if (activeCategory !== 'all') {
            result = result.filter(s => s.category === activeCategory);
        }

        if (searchQuery) {
            result = result.filter(s => s.name.includes(searchQuery));
        }

        setFilteredStations(result);
    }, [searchQuery, stations, activeCategory, favorites]);

    const categorizeStation = (name: string) => {
        const n = name.toLowerCase();
        
        // Translation check (Priority)
        if (n.includes('ترجمة') || n.includes('translation') || n.includes('meaning') || n.includes('translate') || n.includes('interpretation')) return 'translation';
        
        // Reciters
        if (n.includes('القارئ') || n.includes('الشيخ') || n.includes('تلاوة') || n.includes('reciter')) return 'reciters';
        
        // Sunnah & Hadith (Expanded Keywords)
        if (n.includes('سنة') || n.includes('حديث') || n.includes('sunnah') || n.includes('hadith') || n.includes('سيرة') || n.includes('شمائل') || n.includes('sahih')) return 'sunnah';
        
        // Quran General
        if (n.includes('قرآن') || n.includes('مصحف') || n.includes('quran') || n.includes('kuran')) return 'quran';
        
        // Others (Fatwa, Tafseer, etc)
        if (n.includes('فتوى') || n.includes('فتاوى') || n.includes('تفسير') || n.includes('tafseer') || n.includes('علم')) return 'others';
        
        // Default heuristics
        if (name.split(' ').length <= 3 && !n.includes('إذاعة')) return 'reciters';

        return 'others';
    };

    const fetchRadioStations = async () => {
        setLoading(true);
        try {
            // Fetch from multiple endpoints to get Arabic + English (Translations) content
            const urls = [
                'https://api.mp3quran.net/radios/radio_arabic.json',
                'https://api.mp3quran.net/radios/radio_english.json', // Often contains translations
                'https://data-rosy.vercel.app/radio.json'
            ];
            
            const requests = urls.map(url => 
                fetch(url).then(res => res.ok ? res.json() : { radios: [] }).catch(() => ({ radios: [] }))
            );

            const results = await Promise.all(requests);
            
            // Flatten all results
            const combinedStations = results.flatMap(result => result.radios || []);

            if (combinedStations.length > 0) {
                const uniqueStationsMap = new Map();
                
                combinedStations.forEach((s: any) => {
                    // Check if properties exist before accessing
                    if (s && s.radio_url) {
                        const cleanUrl = s.radio_url.trim();
                        if (cleanUrl && !uniqueStationsMap.has(cleanUrl)) {
                            uniqueStationsMap.set(cleanUrl, s);
                        }
                    }
                });

                const finalStations: RadioStation[] = Array.from(uniqueStationsMap.values()).map((s: any) => {
                    let url = s.radio_url ? s.radio_url.trim() : '';
                    let name = s.name ? s.name.trim() : 'إذاعة غير معروفة';
                    
                    return {
                        id: url, // URL as unique ID
                        name: name,
                        url: url,
                        category: categorizeStation(name)
                    };
                }).filter(s => s.url !== ''); // Remove any empty URLs

                // Sort: General radios first, then Alphabetical
                finalStations.sort((a, b) => {
                    const isGeneralA = a.name.includes('إذاعة');
                    const isGeneralB = b.name.includes('إذاعة');
                    if (isGeneralA && !isGeneralB) return -1;
                    if (!isGeneralA && isGeneralB) return 1;
                    return a.name.localeCompare(b.name, 'ar');
                });

                setStations(finalStations);
                setFilteredStations(finalStations);
                
                // Set default station if none selected
                if (!currentStation && finalStations.length > 0) {
                    // Try to find "Makkah" or first one
                    const defaultStation = finalStations.find(s => s.name.includes('مكة')) || finalStations[0];
                    setCurrentStation(defaultStation);
                }
            } else {
                throw new Error("No stations found");
            }
        } catch (error) {
            console.error('Radio fetch error:', error);
            setError('حدث خطأ في تحميل القائمة، يرجى المحاولة لاحقاً.');
            // Fallback
            const fallbackUrl = 'https://stream.radiojar.com/0tpy1h0kxtzuv';
            const fallback: RadioStation = { 
                id: fallbackUrl, 
                name: 'إذاعة القرآن الكريم - مكة المكرمة', 
                url: fallbackUrl,
                category: 'quran'
            };
            setStations([fallback]);
            setCurrentStation(fallback);
        } finally {
            setLoading(false);
        }
    };

    const playStream = async (url: string) => {
        if (!audioRef.current) return;
        setError(null);
        try {
            audioRef.current.src = url;
            audioRef.current.load();
            
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                await playPromise;
                setIsPlaying(true);
                isPlayingRef.current = true;
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            // Prevent logging full error object if it contains circular refs (mostly browser dependent)
            console.error("Playback failed for URL:", url);
            setError('البث غير متاح حالياً لهذا المصدر');
            setIsPlaying(false);
            isPlayingRef.current = false;
        }
    };

    const togglePlay = () => {
        if (!currentStation || !audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            isPlayingRef.current = false;
        } else {
            setIsPlaying(true); 
            isPlayingRef.current = true;
            playStream(currentStation.url);
        }
    };

    const playStation = (station: RadioStation) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (currentStation?.id === station.id) {
            togglePlay();
            return;
        }

        setIsPlaying(true);
        isPlayingRef.current = true;
        setCurrentStation(station);
    };

    const toggleFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        let newFavs;
        if (favorites.includes(id)) {
            newFavs = favorites.filter(favId => favId !== id);
        } else {
            newFavs = [...favorites, id];
        }
        setFavorites(newFavs);
        localStorage.setItem('radio_favorites', JSON.stringify(newFavs));
        if (session?.user) {
            syncService.saveToServer(session.user.id, { radio_favorites: newFavs });
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 pb-32 space-y-5 md:space-y-8">

            {/* ===== HERO PLAYER ===== */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-emerald-600/5 to-transparent rounded-2xl md:rounded-[2.5rem] blur-2xl scale-95"></div>

                <div className="relative bg-[#0f172a]/70 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-10 lg:p-12 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-[200px] md:w-[350px] h-[200px] md:h-[350px] bg-emerald-500/8 rounded-full blur-[60px] md:blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-10 lg:gap-16">

                        {/* --- Disc --- */}
                        <div className="relative shrink-0">
                            <div className={`absolute inset-0 rounded-full transition-all duration-[2s] ${isPlaying ? 'border-2 border-emerald-400/30 scale-110 opacity-0 animate-ping' : 'opacity-0'}`}></div>
                            <div className={`w-28 h-28 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-[3px] md:border-[5px] border-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden transition-all duration-[20s] ease-linear ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
                                <div className="absolute inset-0 bg-[repeating-radial-gradient(#ffffff08_0px,#ffffff08_1px,transparent_1px,transparent_3px)] opacity-20"></div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-45"></div>
                                <div className="w-12 h-12 md:w-20 md:h-20 bg-emerald-500/20 backdrop-blur rounded-full flex items-center justify-center border border-emerald-500/30 shadow-inner relative z-10">
                                    <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-white/40 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                    <RadioIcon size={20} className={`text-emerald-400 md:w-9 md:h-9 ${isPlaying ? 'animate-pulse' : ''}`} />
                                </div>
                            </div>
                            <div className="absolute -bottom-2 md:-bottom-4 left-1/2 -translate-x-1/2 bg-black/60 border border-white/5 px-2.5 py-1 md:px-4 md:py-1.5 rounded-full flex items-center gap-1.5 shadow-lg whitespace-nowrap z-20 backdrop-blur">
                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></div>
                                <span className={`text-[7px] md:text-[9px] font-bold uppercase ${isPlaying ? 'text-emerald-300' : 'text-gray-400'}`}>
                                    {isPlaying ? 'Live' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        {/* --- Controls --- */}
                        <div className="flex-1 w-full text-center md:text-right space-y-3 md:space-y-5">
                            <div className="space-y-1.5 md:space-y-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] md:text-[10px] text-emerald-400 font-bold w-fit mx-auto md:mx-0">
                                    <Wifi size={8} className="md:w-3 md:h-3" />
                                    <span>{currentStation ? currentStation.category : 'الراديو'}</span>
                                </div>
                                <h2 className="text-base md:text-4xl lg:text-5xl font-black text-white leading-tight line-clamp-2">
                                    {currentStation?.name || 'اختر إذاعة...'}
                                </h2>
                                <p className="text-gray-500 text-[10px] md:text-sm font-medium">
                                    استمع لأعذب التلاوات والبرامج الإسلامية على مدار الساعة
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-3 py-1.5 md:px-4 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold inline-flex items-center gap-1.5">
                                    <AlertCircle size={12} className="md:w-4 md:h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col items-center md:items-start gap-2 md:gap-4">
                                <div className="flex items-center justify-center md:justify-start gap-2.5 md:gap-4">
                                    <button
                                        onClick={togglePlay}
                                        disabled={loading || !currentStation}
                                        className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed
                                            ${isPlaying
                                                ? 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-400'
                                                : 'bg-white text-emerald-900 hover:bg-gray-100'}`}
                                    >
                                        {isPlaying ? <Pause size={20} className="md:w-7 md:h-7" fill="currentColor" /> : <Play size={20} className="md:w-7 md:h-7 mr-0.5" fill="currentColor" />}
                                    </button>
                                    {currentStation && (
                                        <button
                                            onClick={(e) => toggleFavorite(e, currentStation.id)}
                                            className={`w-10 h-10 md:w-13 md:h-13 rounded-xl md:rounded-2xl flex items-center justify-center border transition-all active:scale-90
                                                ${favorites.includes(currentStation.id)
                                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                                    : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                                        >
                                            <Heart size={16} className="md:w-5 md:h-5" fill={favorites.includes(currentStation.id) ? "currentColor" : "none"} />
                                        </button>
                                    )}
                                    {currentStation && (
                                        <button
                                            onClick={() => window.open(currentStation.url, '_blank')}
                                            className="w-10 h-10 md:w-13 md:h-13 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/5 bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                            title="فتح الرابط"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-5 md:h-5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                        </button>
                                    )}
                                </div>

                                {/* Volume */}
                                <div className="bg-white/5 border border-white/5 rounded-xl md:rounded-2xl p-1.5 md:p-3 flex items-center gap-2 md:gap-3 max-w-[220px] md:max-w-sm w-full mx-auto md:mx-0" dir="ltr">
                                    <button onClick={() => setIsMuted(!isMuted)} className="text-gray-500 hover:text-white transition-colors shrink-0">
                                        {isMuted || volume === 0 ? <VolumeX size={14} className="md:w-4 md:h-4" /> : <Volume2 size={14} className="text-emerald-400 md:w-4 md:h-4" />}
                                    </button>
                                    <div className="flex-1 relative h-1 bg-gray-700/50 rounded-full cursor-pointer group">
                                        <div className="absolute top-0 left-0 h-full bg-emerald-500/80 rounded-full transition-all group-hover:bg-emerald-400" style={{ width: isMuted ? '0%' : `${volume}%` }}></div>
                                        <input type="range" min="0" max="100" value={isMuted ? 0 : volume}
                                            onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow pointer-events-none transition-all z-20 scale-0 group-hover:scale-100" style={{ left: isMuted ? '0%' : `${volume}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== STICKY SEARCH & CATEGORIES ===== */}
            <div className="sticky top-4 z-40 space-y-2.5 md:space-y-4">
                {/* Search */}
                <div className="bg-[#1e293b]/95 backdrop-blur-xl border border-white/5 rounded-xl md:rounded-2xl p-1.5 md:p-2 flex items-center shadow-lg">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                        <input type="text" placeholder="ابحث عن قارئ أو إذاعة..."
                            className="w-full bg-transparent border-none py-2 md:py-3.5 pr-9 md:pr-11 pl-3 md:pl-5 text-white text-xs md:text-base focus:outline-none placeholder:text-gray-600"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    {filteredStations.length > 0 && (
                        <div className="hidden md:flex px-4 items-center gap-1.5 text-emerald-400 text-[10px] md:text-xs font-bold border-r border-white/5 shrink-0">
                            <Sparkles size={13} />
                            <span>{filteredStations.length} إذاعة</span>
                        </div>
                    )}
                </div>

                {/* Categories */}
                <div className="flex gap-1.5 md:gap-2 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(cat => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                                className={`whitespace-nowrap px-3 py-1.5 md:px-4 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs transition-all border flex items-center gap-1.5 md:gap-2 active:scale-95 shrink-0
                                    ${isActive
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-900/20'
                                        : 'bg-[#1e293b]/70 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                {React.createElement(cat.icon, { size: 12, className: isActive ? 'text-white' : 'text-gray-500' })}
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ===== STATIONS GRID ===== */}
            {loading ? (
                <div className="py-20 md:py-28 text-center space-y-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 font-bold text-xs md:text-base">جاري جلب القائمة الكاملة...</p>
                </div>
            ) : filteredStations.length === 0 ? (
                <div className="py-20 md:py-28 text-center text-gray-500 bg-white/[0.02] rounded-2xl md:rounded-[2.5rem] border border-white/5 border-dashed mx-1 md:mx-2">
                    <Headphones size={36} className="mx-auto mb-3 md:mb-5 opacity-20 md:w-14 md:h-14" />
                    <p className="text-base md:text-2xl font-bold mb-1">لا توجد نتائج</p>
                    <p className="text-[10px] md:text-sm opacity-60">جرب البحث بكلمات أخرى</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                    {filteredStations.map((station) => {
                        const isCurrent = currentStation?.id === station.id;
                        return (
                            <button key={station.id} onClick={() => playStation(station)}
                                className={`group relative p-2.5 md:p-5 rounded-xl md:rounded-2xl border text-right transition-all duration-200 flex items-center gap-2.5 md:gap-4 overflow-hidden
                                    ${isCurrent
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/20'}`}>

                                {/* Left accent bar for current */}
                                {isCurrent && <div className="absolute right-0 top-2 bottom-2 w-0.5 bg-emerald-400 rounded-full"></div>}

                                {/* Icon */}
                                <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 transition-all duration-300
                                    ${isCurrent ? 'bg-emerald-500 text-white' : 'bg-[#0f172a] text-gray-500 group-hover:text-emerald-400'}`}>
                                    {isCurrent && isPlaying ? (
                                        <div className="flex items-end gap-0.5 md:gap-0.5 h-2.5 md:h-4">
                                            <span className="w-0.5 md:w-0.5 bg-white rounded-full animate-[visualizer_0.6s_ease-in-out_infinite]"></span>
                                            <span className="w-0.5 md:w-0.5 bg-white rounded-full animate-[visualizer_0.8s_ease-in-out_infinite] h-1.5 md:h-2.5"></span>
                                            <span className="w-0.5 md:w-0.5 bg-white rounded-full animate-[visualizer_0.5s_ease-in-out_infinite] h-1 md:h-1.5"></span>
                                        </div>
                                    ) : (
                                        <RadioIcon size={15} className="md:w-5 md:h-5" />
                                    )}
                                </div>

                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-xs md:text-sm truncate ${isCurrent ? 'text-emerald-300' : 'text-gray-300 group-hover:text-white'}`}>
                                        {station.name}
                                    </h3>
                                    {isCurrent && isPlaying && (
                                        <span className="text-[8px] md:text-[9px] text-emerald-500 font-bold">جاري الاستماع...</span>
                                    )}
                                </div>

                                {/* Favorites */}
                                <div onClick={(e) => toggleFavorite(e, station.id)}
                                    className={`p-1.5 md:p-2.5 rounded-lg transition-all hover:bg-white/5 ${favorites.includes(station.id) ? 'text-red-400' : 'text-gray-600 hover:text-gray-300'}`}>
                                    <Heart size={13} className="md:w-[16px] md:h-[16px]" fill={favorites.includes(station.id) ? "currentColor" : "none"} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ===== AUDIO ===== */}
            <audio ref={audioRef} preload="none"
                onEnded={() => { setIsPlaying(false); isPlayingRef.current = false; }}
                onPause={() => { setIsPlaying(false); isPlayingRef.current = false; }}
                onPlay={() => { setIsPlaying(true); isPlayingRef.current = true; }}
                onError={(e) => {
                    console.error("Audio playback error event. NetworkState:", e.currentTarget.networkState);
                    setIsPlaying(false); isPlayingRef.current = false; setError('حدث خطأ في التشغيل');
                }} />
        </div>
    );
};
