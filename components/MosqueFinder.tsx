
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Search, Target, MapPinned, Compass, LocateFixed, ZoomIn } from 'lucide-react';

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const mosqueSVG = (s: boolean) =>
    `<svg width="26" height="26" viewBox="0 0 48 48" fill="none">
        <path d="M24 2 C26 4 26 8 24 10 C22 8 22 4 24 2Z" fill="${s ? '#fff' : '#fbbf24'}" />
        <path d="M14 12 Q14 8 18 6 Q20 4 24 4 Q28 4 30 6 Q34 8 34 12 Z" fill="${s ? '#10b981' : '#1e293b'}" stroke="${s ? '#fff' : '#10b981'}" stroke-width="1.5" />
        <path d="M18 12 Q20 8 24 7 Q28 8 30 12" stroke="${s ? 'rgba(255,255,255,0.3)' : 'rgba(16,185,129,0.2)'}" stroke-width="0.8" fill="none" />
        <path d="M20 10 Q22 8 24 7.5 Q26 8 28 10" stroke="${s ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.15)'}" stroke-width="0.6" fill="none" />
        <rect x="10" y="14" width="2.5" height="18" rx="1" fill="${s ? '#fff' : '#0f172a'}" stroke="${s ? '#fff' : '#10b981'}" stroke-width="0.8" />
        <path d="M10 14 L12.5 14 L12.5 12 L10 12 Z" fill="${s ? '#10b981' : '#1e293b'}" stroke="${s ? '#fff' : '#10b981'}" stroke-width="0.5" />
        <circle cx="11.25" cy="11.5" r="1" fill="#fbbf24" />
        <rect x="35.5" y="14" width="2.5" height="18" rx="1" fill="${s ? '#fff' : '#0f172a'}" stroke="${s ? '#fff' : '#10b981'}" stroke-width="0.8" />
        <path d="M35.5 14 L38 14 L38 12 L35.5 12 Z" fill="${s ? '#10b981' : '#1e293b'}" stroke="${s ? '#fff' : '#10b981'}" stroke-width="0.5" />
        <circle cx="36.75" cy="11.5" r="1" fill="#fbbf24" />
        <path d="M14 14 L34 14 L34 34 L14 34 Z" fill="${s ? '#10b981' : '#0f172a'}" stroke="${s ? '#fff' : '#10b981'}" stroke-width="1.2" />
        <path d="M20 34 L20 24 Q20 20 24 20 Q28 20 28 24 L28 34" fill="${s ? '#065f46' : '#1e293b'}" stroke="${s ? 'rgba(255,255,255,0.4)' : 'rgba(16,185,129,0.4)'}" stroke-width="1" />
        <path d="M22 34 L22 25 Q22 22 24 22 Q26 22 26 25 L26 34" fill="${s ? '#047857' : '#0f172a'}" />
        <rect x="7" y="34" width="34" height="3" rx="1" fill="${s ? '#10b981' : '#1e293b'}" stroke="${s ? '#fff' : '#10b981'}" stroke-width="0.8" />
        <path d="M15 22 L15 28 L17 28 L17 22 Q16 20 15 22Z" fill="${s ? 'rgba(255,255,255,0.15)' : 'rgba(16,185,129,0.1)'}" />
        <path d="M31 22 L31 28 L33 28 L33 22 Q32 20 31 22Z" fill="${s ? 'rgba(255,255,255,0.15)' : 'rgba(16,185,129,0.1)'}" />
    </svg>`;

const MosqueIcon = ({ selected = false, size = 28 }: { selected?: boolean; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M24 2 C26 4 26 8 24 10 C22 8 22 4 24 2Z" fill={selected ? '#fff' : '#fbbf24'} />
        <path d="M14 12 Q14 8 18 6 Q20 4 24 4 Q28 4 30 6 Q34 8 34 12 Z" fill={selected ? '#10b981' : '#1e293b'} stroke={selected ? '#fff' : '#10b981'} strokeWidth="1.5" />
        <path d="M18 12 Q20 8 24 7 Q28 8 30 12" stroke={selected ? 'rgba(255,255,255,0.3)' : 'rgba(16,185,129,0.2)'} strokeWidth="0.8" fill="none" />
        <path d="M20 10 Q22 8 24 7.5 Q26 8 28 10" stroke={selected ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.15)'} strokeWidth="0.6" fill="none" />
        <rect x="10" y="14" width="2.5" height="18" rx="1" fill={selected ? '#fff' : '#0f172a'} stroke={selected ? '#fff' : '#10b981'} strokeWidth="0.8" />
        <path d="M10 14 L12.5 14 L12.5 12 L10 12 Z" fill={selected ? '#10b981' : '#1e293b'} stroke={selected ? '#fff' : '#10b981'} strokeWidth="0.5" />
        <circle cx="11.25" cy="11.5" r="1" fill="#fbbf24" />
        <rect x="35.5" y="14" width="2.5" height="18" rx="1" fill={selected ? '#fff' : '#0f172a'} stroke={selected ? '#fff' : '#10b981'} strokeWidth="0.8" />
        <path d="M35.5 14 L38 14 L38 12 L35.5 12 Z" fill={selected ? '#10b981' : '#1e293b'} stroke={selected ? '#fff' : '#10b981'} strokeWidth="0.5" />
        <circle cx="36.75" cy="11.5" r="1" fill="#fbbf24" />
        <path d="M14 14 L34 14 L34 34 L14 34 Z" fill={selected ? '#10b981' : '#0f172a'} stroke={selected ? '#fff' : '#10b981'} strokeWidth="1.2" />
        <path d="M20 34 L20 24 Q20 20 24 20 Q28 20 28 24 L28 34" fill={selected ? '#065f46' : '#1e293b'} stroke={selected ? 'rgba(255,255,255,0.4)' : 'rgba(16,185,129,0.4)'} strokeWidth="1" />
        <path d="M22 34 L22 25 Q22 22 24 22 Q26 22 26 25 L26 34" fill={selected ? '#047857' : '#0f172a'} />
        <rect x="7" y="34" width="34" height="3" rx="1" fill={selected ? '#10b981' : '#1e293b'} stroke={selected ? '#fff' : '#10b981'} strokeWidth="0.8" />
        <path d="M15 22 L15 28 L17 28 L17 22 Q16 20 15 22Z" fill={selected ? 'rgba(255,255,255,0.15)' : 'rgba(16,185,129,0.1)'} />
        <path d="M31 22 L31 28 L33 28 L33 22 Q32 20 31 22Z" fill={selected ? 'rgba(255,255,255,0.15)' : 'rgba(16,185,129,0.1)'} />
    </svg>
);

export const MosqueFinder: React.FC = () => {
    const [mosques, setMosques] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [radius, setRadius] = useState(1.5);
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [locating, setLocating] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);

    useEffect(() => {
        const scriptId = 'leaflet-script';
        const init = () => {
            if ((window as any).L && mapContainerRef.current && !leafletMap.current) initMap();
        };
        if (!document.getElementById(scriptId)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = init;
            document.head.appendChild(script);
        } else {
            const check = setInterval(() => {
                if ((window as any).L) { clearInterval(check); init(); }
            }, 100);
        }
        return () => {
            if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
        };
    }, []);

    const initMap = () => {
        if (!mapContainerRef.current || leafletMap.current) return;
        const L = (window as any).L;
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            zoomSnap: 0.5,
            wheelPxPerZoomLevel: 60
        }).setView([24.7136, 46.6753], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
        leafletMap.current = map;
        setTimeout(() => map.invalidateSize(), 200);
        setMapReady(true);
        locateUser();
    };

    const locateUser = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setUserPos(coords);
                if (leafletMap.current) {
                    leafletMap.current.flyTo(coords, 16, { duration: 1.5 });
                }
                fetchNearbyMosques(coords, radius);
                setLocating(false);
            },
            () => {
                setLoading(false);
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
    };

    useEffect(() => {
        if (userPos) fetchNearbyMosques(userPos, radius);
    }, [radius]);

    const fetchNearbyMosques = async (coords: [number, number], r: number) => {
        setLoading(true);
        const [lat, lon] = coords;
        const dist = r * 1000;
        const query = `[out:json][timeout:25];(
            node["amenity"="place_of_worship"]["religion"="muslim"](around:${dist},${lat},${lon});
            way["amenity"="place_of_worship"]["religion"="muslim"](around:${dist},${lat},${lon});
        );out center qt;`;
        try {
            const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
            const data = await res.json();
            const elements = (data.elements || []).map((m: any) => ({
                ...m,
                lat: m.lat || m.center?.lat,
                lon: m.lon || m.center?.lon,
                distance: getDistance(lat, lon, m.lat || m.center?.lat, m.lon || m.center?.lon)
            })).sort((a: any, b: any) => a.distance - b.distance);
            setMosques(elements);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!leafletMap.current || !mapReady) return;
        const L = (window as any).L;
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        if (userMarkerRef.current) userMarkerRef.current.remove();
        if (circleRef.current) circleRef.current.remove();
        if (userPos) {
            circleRef.current = L.circle(userPos, {
                radius: radius * 1000,
                color: '#10b981',
                weight: 1,
                fillColor: '#10b981',
                fillOpacity: 0.04,
                dashArray: '5, 10'
            }).addTo(leafletMap.current);
            const userIcon = L.divIcon({
                className: '',
                html: `<div class="relative">
                    <div class="w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.6)]"></div>
                    <div class="absolute -inset-2 bg-emerald-500/20 rounded-full animate-ping" style="animation-duration:2s"></div>
                </div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            userMarkerRef.current = L.marker(userPos, { icon: userIcon, zIndexOffset: 1000 }).addTo(leafletMap.current);
        }
        mosques.forEach((m) => {
            const isSelected = selectedId === m.id;
            const mosqueIcon = L.divIcon({
                className: '',
                html: `<div class="relative transition-all duration-500 ${isSelected ? 'z-[999]' : ''}">
                    <div class="relative ${isSelected ? 'scale-125' : 'scale-100 hover:scale-110'} transition-transform duration-300">
                        <div class="w-14 h-14 ${isSelected ? 'bg-emerald-500/15 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)]' : 'bg-black/40 border-white/10 hover:border-emerald-500/30'} backdrop-blur-xl rounded-2xl border flex items-center justify-center shadow-2xl transition-all duration-300">
                            <div class="w-11 h-11 ${isSelected ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-slate-900/90'} rounded-xl flex items-center justify-center shadow-inner">
                                ${mosqueSVG(isSelected)}
                            </div>
                        </div>
                        ${isSelected ? '<div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2"><div class="w-3 h-3 bg-emerald-500 rotate-45 shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div></div>' : ''}
                    </div>
                </div>`,
                iconSize: [56, 62],
                iconAnchor: [28, 62]
            });
            const marker = L.marker([m.lat, m.lon], { icon: mosqueIcon }).addTo(leafletMap.current).on('click', () => {
                setSelectedId(m.id);
                leafletMap.current.setView([m.lat, m.lon], 17, { animate: true });
                setTimeout(() => {
                    document.getElementById(`mosque-${m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
            markersRef.current.push(marker);
        });
    }, [mosques, userPos, radius, selectedId, mapReady]);

    const filtered = mosques.filter(m => (m.tags?.name || 'مسجد').toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="w-full max-w-7xl mx-auto px-3 md:px-6 pb-40 space-y-6 md:space-y-10 animate-fade-in">
            {/* Hero */}
            <div className="relative text-center space-y-3 md:space-y-4 pt-4">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full -z-10"></div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] md:text-[10px] font-black uppercase mx-auto shadow-lg"
                >
                    <MapPinned size={12} />
                    <span>اعثر على أقرب مسجد</span>
                </motion.div>

                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl md:text-7xl font-black premium-text-gradient tracking-tighter"
                >
                    بيوت الله
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-400 text-sm md:text-lg max-w-lg mx-auto font-medium px-4"
                >
                    اعثر على أقرب مسجد لتأدية صلاتك في وقتها بدقة عالية
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-panel p-2.5 md:p-3 rounded-2xl md:rounded-[2rem] border border-white/10 max-w-2xl mx-auto mt-4 md:mt-8 flex flex-col md:flex-row items-center gap-2 md:gap-3 shadow-2xl"
                >
                    <div className="relative flex-1 w-full">
                        <Search className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-emerald-500/40" size={16} />
                        <input type="text" placeholder="ابحث باسم المسجد..." className="w-full bg-black/20 border border-white/5 rounded-xl py-3 md:py-4 pr-10 md:pr-12 pl-3 md:pl-4 text-white font-bold text-sm outline-none focus:bg-black/40 focus:border-emerald-500/30 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 bg-white/5 px-4 md:px-5 py-2.5 md:py-3 rounded-xl border border-white/5 w-full md:w-auto">
                        <span className="text-[10px] font-black text-emerald-400 whitespace-nowrap">{radius} كم</span>
                        <input type="range" min="0.5" max="10" step="0.5" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full md:w-28 accent-emerald-500" />
                    </div>
                </motion.div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
                {/* Map */}
                <div className="lg:col-span-7 sticky top-20 md:top-24 z-30">
                    <div className="relative h-[50vh] md:h-[600px] rounded-[1.5rem] md:rounded-[3rem] border-[4px] md:border-8 border-white/[0.03] overflow-hidden shadow-2xl bg-[#0a0f1a] group">
                        <div ref={mapContainerRef} className="w-full h-full z-0" />
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.5)] z-10 rounded-[inherit]"></div>
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a0f1a]/40 via-transparent to-transparent z-[5]"></div>

                        <button onClick={locateUser} disabled={locating} className="absolute bottom-4 md:bottom-6 left-4 md:left-6 z-[400] w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white rounded-xl md:rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-90">
                            <Target size={22} className={locating ? 'animate-spin' : ''} />
                        </button>

                        <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 z-[400] flex flex-col gap-1.5">
                            <button onClick={() => leafletMap.current?.zoomIn()} className="w-10 h-10 md:w-11 md:h-11 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-xl border border-white/10 flex items-center justify-center transition-all active:scale-90 shadow-lg">
                                <ZoomIn size={18} />
                            </button>
                            <button onClick={() => leafletMap.current?.zoomOut()} className="w-10 h-10 md:w-11 md:h-11 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-xl border border-white/10 flex items-center justify-center transition-all active:scale-90 shadow-lg">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/></svg>
                            </button>
                        </div>

                        <div className="absolute top-3 md:top-6 left-3 md:left-6 z-[400] bg-black/60 backdrop-blur-md px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-white/10 flex items-center gap-2 shadow-lg">
                            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}></div>
                            <span className="text-[9px] md:text-[10px] font-bold text-gray-300">{loading ? 'جاري المسح...' : `${filtered.length} مسجد`}</span>
                        </div>

                        {userPos && (
                            <div className="absolute top-3 md:top-6 right-3 md:right-6 z-[400] bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-lg">
                                <div className="flex items-center gap-1.5">
                                    <LocateFixed size={12} className="text-emerald-400" />
                                    <span className="text-[8px] md:text-[9px] font-bold text-gray-400">{userPos[0].toFixed(4)}, {userPos[1].toFixed(4)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mosque list */}
                <div className="lg:col-span-5 space-y-2.5 max-h-[55vh] md:max-h-[700px] overflow-y-auto pr-1 md:pr-2 no-scrollbar">
                    {filtered.length > 0 ? filtered.map((m, idx) => (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.025 }}
                            key={idx} id={`mosque-${m.id}`}
                            onClick={() => { setSelectedId(m.id); leafletMap.current?.setView([m.lat, m.lon], 17, { animate: true }); }}
                            className={`group relative p-3 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden
                                ${selectedId === m.id
                                    ? 'bg-gradient-to-r from-emerald-500/12 to-teal-500/12 border-emerald-500/50 shadow-emerald-500/10 shadow-xl'
                                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06]'}`}
                        >
                            {selectedId === m.id && (
                                <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-500"></div>
                            )}
                            <div className="flex items-start justify-between gap-3 relative z-10">
                                <div className="flex gap-3 md:gap-4 min-w-0 flex-1">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${selectedId === m.id
                                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 scale-110'
                                        : 'bg-black/30 border border-white/5'}`}>
                                        <MosqueIcon selected={selectedId === m.id} size={selectedId === m.id ? 24 : 22} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-black text-sm md:text-lg truncate ${selectedId === m.id ? 'text-white' : 'text-gray-200'}`}>{m.tags?.name || 'مسجد'}</h3>
                                            {idx === 0 && (
                                                <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/20 text-amber-400 text-[7px] md:text-[8px] font-black">الأقرب</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500 text-[9px] md:text-[10px] font-bold mt-0.5 md:mt-1">
                                            <MapPin size={10} />
                                            <span className="truncate">{m.tags['addr:street'] || m.tags['addr:city'] || m.tags['addr:place'] || 'موقع محدد'}</span>
                                        </div>
                                        <div className="mt-1.5 md:mt-2 flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-black border transition-all ${selectedId === m.id
                                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                                : 'bg-white/5 border-white/5 text-emerald-400'}`}>
                                                {(m.distance * 1000).toFixed(0)} م
                                            </span>
                                            {(m.tags?.['opening_hours']?.toLowerCase().includes('24') || m.tags?.['opening_hours']?.toLowerCase().includes('24/7')) && (
                                                <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] md:text-[9px] font-black">24 ساعة</span>
                                            )}
                                            {m.tags?.['capacity'] && (
                                                <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] md:text-[9px] font-black">{m.tags.capacity}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`, '_blank'); }}
                                    className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center transition-all border shadow-lg shrink-0 ${selectedId === m.id
                                        ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-emerald-600 hover:text-white hover:border-emerald-500'}`}
                                >
                                    <Navigation size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-16 md:py-20 text-center space-y-3 md:space-y-4 bg-white/[0.02] rounded-[1.5rem] md:rounded-[2rem] border border-dashed border-white/5"
                        >
                            <Compass size={40} className="mx-auto text-gray-700 animate-spin-slow" />
                            <p className="text-gray-500 font-bold text-sm">لا توجد مساجد قريبة في هذا النطاق</p>
                            <p className="text-gray-700 text-xs font-medium">جرب زيادة نطاق البحث أو تأكد من تفعيل الموقع</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
