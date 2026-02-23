
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio as RadioIcon, Search, Heart, Wifi, AlertCircle, ListFilter, BookOpen, Star, Headphones, Mic2, Sparkles, Globe } from 'lucide-react';

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

export const Radio: React.FC = () => {
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

    // Load Favorites & Fetch API
    useEffect(() => {
        const storedFavs = localStorage.getItem('radio_favorites');
        if (storedFavs) {
            try {
                setFavorites(JSON.parse(storedFavs));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
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
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 pb-32 animate-fade-in space-y-6 md:space-y-8">
            
            {/* --- HERO PLAYER --- */}
            <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/10 rounded-[2.5rem] md:rounded-[3rem] blur-3xl scale-95 group-hover:scale-100 transition-all duration-1000"></div>
                
                <div className="glass-card p-5 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 relative overflow-hidden shadow-2xl backdrop-blur-3xl">
                    
                    {/* Background Detail */}
                    <div className="absolute top-0 right-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-emerald-500/5 rounded-full blur-[60px] md:blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-16">
                        
                        {/* Visualizer Disc - Responsive Size */}
                        <div className="relative shrink-0 group/disc">
                            <div className={`absolute inset-0 rounded-full border-2 border-emerald-500/30 transition-all duration-[3s] ease-linear ${isPlaying ? 'scale-125 opacity-0 animate-ping-slow' : 'scale-100 opacity-20'}`}></div>
                            <div className={`absolute inset-0 rounded-full border border-emerald-500/20 transition-all duration-[4s] ease-linear delay-700 ${isPlaying ? 'scale-110 opacity-0 animate-ping-slow' : 'scale-100 opacity-20'}`}></div>

                            <div className={`w-40 h-40 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 border-[4px] md:border-[6px] border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-center relative overflow-hidden transition-all duration-[20s] ease-linear ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
                                {/* Vinyl Details */}
                                <div className="absolute inset-0 bg-[repeating-radial-gradient(#ffffff05_0px,#ffffff05_2px,transparent_2px,transparent_4px)] opacity-30"></div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45"></div>
                                
                                <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-emerald-500/30 shadow-inner relative z-10">
                                    <div className="w-2 h-2 md:w-3 md:h-3 bg-white/50 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                                    <RadioIcon size={24} className={`text-emerald-400 md:w-10 md:h-10 ${isPlaying ? 'animate-pulse' : ''}`} />
                                </div>
                            </div>

                            <div className="absolute -bottom-3 md:-bottom-5 left-1/2 -translate-x-1/2 bg-[#0f172a] border border-white/10 px-3 py-1.5 md:px-5 md:py-2 rounded-full flex items-center gap-2 shadow-xl whitespace-nowrap z-20">
                                <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                <span className="text-[8px] md:text-[10px] font-bold text-gray-300 tracking-wider uppercase">
                                    {isPlaying ? 'Live Stream' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex-1 w-full text-center lg:text-right space-y-6 md:space-y-8">
                            <div className="space-y-2 md:space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] md:text-[10px] text-emerald-400 font-bold w-fit mx-auto lg:mx-0">
                                    <Wifi size={10} className="md:w-3 md:h-3" />
                                    <span>{currentStation ? currentStation.category : 'الراديو'}</span>
                                </div>
                                <h2 className="text-xl md:text-5xl font-black text-white leading-tight drop-shadow-lg line-clamp-2">
                                    {currentStation?.name || 'اختر إذاعة...'}
                                </h2>
                                <p className="text-emerald-100/60 text-xs md:text-base font-medium">
                                    استمع لأعذب التلاوات والبرامج الإسلامية على مدار الساعة
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-2 md:py-3 rounded-2xl text-xs md:text-sm font-bold inline-flex items-center gap-2 animate-in zoom-in">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-4 md:gap-6">
                                {/* Buttons */}
                                <div className="flex items-center justify-center lg:justify-start gap-4 md:gap-6">
                                    <button
                                        onClick={togglePlay}
                                        disabled={loading || !currentStation}
                                        className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                                            ${isPlaying 
                                                ? 'bg-emerald-500 text-white shadow-emerald-500/40 hover:bg-emerald-400' 
                                                : 'bg-white text-emerald-900 hover:bg-gray-100'}`}
                                    >
                                        {isPlaying ? <Pause size={24} className="md:w-8 md:h-8" fill="currentColor" /> : <Play size={24} className="md:w-8 md:h-8 ml-1" fill="currentColor" />}
                                    </button>

                                    {currentStation && (
                                        <button 
                                            onClick={(e) => toggleFavorite(e, currentStation.id)}
                                            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-all hover:scale-105 active:scale-95
                                                ${favorites.includes(currentStation.id) 
                                                    ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                        >
                                            <Heart size={20} className="md:w-6 md:h-6" fill={favorites.includes(currentStation.id) ? "currentColor" : "none"} />
                                        </button>
                                    )}
                                </div>

                                {/* Volume Slider */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-2 md:p-3 flex flex-row items-center gap-3 max-w-sm w-full" dir="ltr">
                                    <button 
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {isMuted || volume === 0 ? <VolumeX size={18} className="md:w-5 md:h-5" /> : <Volume2 size={18} className="text-emerald-400 md:w-5 md:h-5" />}
                                    </button>
                                    
                                    <div className="flex-1 relative h-1.5 bg-gray-700 rounded-full cursor-pointer group">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all group-hover:bg-emerald-400"
                                            style={{ width: isMuted ? '0%' : `${volume}%` }}
                                        ></div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={isMuted ? 0 : volume}
                                            onChange={(e) => {
                                                setVolume(Number(e.target.value));
                                                setIsMuted(false);
                                            }}
                                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none transition-all z-20 scale-0 group-hover:scale-100"
                                            style={{ left: isMuted ? '0%' : `${volume}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LIST HEADER & SEARCH --- */}
            <div className="sticky top-4 z-40 space-y-3 md:space-y-4">
                <div className="bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-1.5 md:p-2 flex items-center shadow-2xl">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="ابحث عن قارئ أو إذاعة..."
                            className="w-full bg-transparent border-none rounded-full py-3 md:py-4 pr-10 md:pr-12 pl-4 md:pl-6 text-white text-sm md:text-lg focus:outline-none placeholder:text-gray-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {filteredStations.length > 0 && (
                        <div className="hidden md:flex px-6 items-center gap-2 text-emerald-400 font-bold text-sm border-r border-white/10">
                            <Sparkles size={16} />
                            <span>{filteredStations.length} إذاعة</span>
                        </div>
                    )}
                </div>

                {/* Categories Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
                    {CATEGORIES.map(cat => {
                        const isActive = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`whitespace-nowrap px-4 py-2.5 md:px-5 md:py-3 rounded-full font-bold text-xs md:text-sm transition-all border flex items-center gap-2 active:scale-95
                                    ${isActive 
                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                                        : 'bg-[#1e293b]/80 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}
                            >
                                {React.createElement(cat.icon, { size: 14, className: isActive ? 'text-white' : 'text-gray-500 md:w-4 md:h-4' })}
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- STATIONS GRID --- */}
            {loading ? (
                <div className="py-24 md:py-32 text-center space-y-6 animate-pulse">
                    <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-400 font-bold text-base md:text-lg">جاري جلب القائمة الكاملة...</p>
                </div>
            ) : filteredStations.length === 0 ? (
                <div className="py-24 md:py-32 text-center text-gray-500 bg-white/5 rounded-[2rem] md:rounded-[3rem] border border-white/5 border-dashed mx-2 md:mx-4">
                    <Headphones size={48} className="mx-auto mb-4 md:mb-6 opacity-30 md:w-16 md:h-16" />
                    <p className="text-xl md:text-2xl font-bold mb-2">لا توجد نتائج</p>
                    <p className="text-xs md:text-sm opacity-60">جرب البحث بكلمات أخرى</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {filteredStations.map((station) => {
                        const isCurrent = currentStation?.id === station.id;
                        return (
                            <button
                                key={station.id}
                                onClick={() => playStation(station)}
                                className={`group relative p-3 md:p-5 rounded-2xl md:rounded-[2rem] border text-right transition-all duration-300 flex items-center gap-3 md:gap-5 overflow-hidden
                                    ${isCurrent 
                                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                            >
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 shadow-lg
                                    ${isCurrent ? 'bg-emerald-500 text-white scale-110 rotate-3' : 'bg-[#0f172a] text-gray-500 group-hover:text-emerald-400'}`}>
                                    {isCurrent && isPlaying ? (
                                        <div className="flex items-end gap-0.5 md:gap-1 h-3 md:h-5">
                                            <span className="w-0.5 md:w-1 bg-white rounded-full animate-[visualizer_0.6s_ease-in-out_infinite]"></span>
                                            <span className="w-0.5 md:w-1 bg-white rounded-full animate-[visualizer_0.8s_ease-in-out_infinite] h-2 md:h-3"></span>
                                            <span className="w-0.5 md:w-1 bg-white rounded-full animate-[visualizer_0.5s_ease-in-out_infinite] h-1.5 md:h-2"></span>
                                        </div>
                                    ) : (
                                        <RadioIcon size={18} className="md:w-6 md:h-6" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-sm md:text-base truncate transition-colors ${isCurrent ? 'text-emerald-400' : 'text-gray-200 group-hover:text-white'}`}>
                                        {station.name}
                                    </h3>
                                    {isCurrent && isPlaying && (
                                        <span className="text-[9px] md:text-[10px] text-emerald-500 font-bold animate-pulse">جاري الاستماع...</span>
                                    )}
                                </div>

                                <div 
                                    onClick={(e) => toggleFavorite(e, station.id)}
                                    className={`p-2 md:p-3 rounded-full transition-all hover:bg-white/10 ${favorites.includes(station.id) ? 'text-red-500' : 'text-gray-600 hover:text-gray-300'}`}
                                >
                                    <Heart size={16} className="md:w-[18px] md:h-[18px]" fill={favorites.includes(station.id) ? "currentColor" : "none"} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                preload="none"
                onEnded={() => {
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                }}
                onPause={() => {
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                }}
                onPlay={() => {
                    setIsPlaying(true);
                    isPlayingRef.current = true;
                }}
                onError={(e) => {
                    // Prevent circular reference error by logging minimal info
                    console.error("Audio playback error event. NetworkState:", e.currentTarget.networkState);
                    setIsPlaying(false);
                    isPlayingRef.current = false;
                    setError('حدث خطأ في التشغيل');
                }}
            />
        </div>
    );
};
