
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Landmark, Target, MapPinned, Compass, ArrowUpRight, Share2, Info } from 'lucide-react';

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

export const MosqueFinder: React.FC = () => {
    const [mosques, setMosques] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [radius, setRadius] = useState(1.5); 
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [mapReady, setMapReady] = useState(false);

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
        const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([24.7136, 46.6753], 15);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
        leafletMap.current = map;
        setMapReady(true);
        locateUser();
    };

    const locateUser = () => {
        if (!navigator.geolocation) return;
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setUserPos(coords);
                if (leafletMap.current) leafletMap.current.setView(coords, 15, { animate: true });
                fetchNearbyMosques(coords, radius);
            },
            () => setLoading(false),
            { enableHighAccuracy: true }
        );
    };

    const fetchNearbyMosques = async (coords: [number, number], r: number) => {
        setLoading(true);
        const [lat, lon] = coords;
        const dist = r * 1000;
        const query = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${dist},${lat},${lon});way["amenity"="place_of_worship"]["religion"="muslim"](around:${dist},${lat},${lon}););out center;`;

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
        if (userMarkerRef.current) userMarkerRef.current.remove();
        if (circleRef.current) circleRef.current.remove();

        if (userPos) {
            circleRef.current = L.circle(userPos, { radius: radius * 1000, color: '#10b981', weight: 1, fillOpacity: 0.05 }).addTo(leafletMap.current);
            const userIcon = L.divIcon({ className: 'u-m', html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>', iconSize: [16, 16] });
            userMarkerRef.current = L.marker(userPos, { icon: userIcon }).addTo(leafletMap.current);
        }

        mosques.forEach(m => {
            const isSelected = selectedId === m.id;
            const mosqueIcon = L.divIcon({
                className: 'm-m',
                html: `<div class="relative transition-transform duration-300 ${isSelected ? 'scale-125 z-50' : 'scale-100'}">
                    <div class="w-10 h-10 ${isSelected ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-900 border-white/20'} rounded-xl border flex items-center justify-center shadow-2xl">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#fff' : '#10b981'}" stroke-width="2"><path d="M3 21h18M5 21v-7M19 21v-7M12 4a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3 3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"/></svg>
                    </div>
                </div>`,
                iconSize: [40, 40], iconAnchor: [20, 40]
            });
            const marker = L.marker([m.lat, m.lon], { icon: mosqueIcon }).addTo(leafletMap.current).on('click', () => {
                setSelectedId(m.id);
                leafletMap.current.setView([m.lat, m.lon], 17, { animate: true });
                document.getElementById(`mosque-${m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            markersRef.current.push(marker);
        });
    }, [mosques, userPos, radius, selectedId, mapReady]);

    const filtered = mosques.filter(m => (m.tags?.name || 'مسجد').toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="w-full max-w-6xl mx-auto px-4 pb-40 space-y-10 animate-fade-in">
            {/* --- HERO --- */}
            <div className="relative text-center space-y-4 pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-bounce">
                    <MapPinned size={14} /> قريب منك
                </div>
                <h2 className="text-4xl md:text-7xl font-black premium-text-gradient tracking-tighter">بيوت الله</h2>
                <p className="text-gray-400 text-sm md:text-lg max-w-lg mx-auto">اعثر على أقرب مسجد لتأدية صلاتك في وقتها</p>
                
                {/* Search & Radius */}
                <div className="glass-panel p-2 rounded-3xl border border-white/10 max-w-2xl mx-auto mt-8 flex flex-col md:flex-row items-center gap-2 shadow-2xl">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input type="text" placeholder="ابحث باسم المسجد..." className="w-full bg-black/20 border-none rounded-2xl py-4 pr-11 pl-4 text-white font-bold outline-none focus:bg-black/40 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 w-full md:w-auto">
                        <span className="text-[10px] font-black text-emerald-400 whitespace-nowrap">{radius} كم</span>
                        <input type="range" min="0.5" max="10" step="0.5" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full md:w-32 accent-emerald-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Map Section */}
                <div className="lg:col-span-7 sticky top-24">
                    <div className="relative h-[45vh] md:h-[600px] rounded-[3rem] border-8 border-white/5 overflow-hidden shadow-2xl bg-slate-900 group">
                        <div ref={mapContainerRef} className="w-full h-full z-0" />
                        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.4)] z-10"></div>
                        <button onClick={locateUser} className="absolute bottom-6 left-6 z-[400] w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-90 group/loc">
                            <Target size={28} className={loading ? 'animate-spin' : 'group-hover/loc:rotate-90 transition-transform'} />
                        </button>
                        <div className="absolute top-6 left-6 z-[400] bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-gray-300">{loading ? 'جاري المسح...' : `${filtered.length} نتيجة`}</span>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-5 space-y-4 max-h-[700px] overflow-y-auto pr-2 no-scrollbar">
                    {filtered.length > 0 ? filtered.map((m, idx) => (
                        <div
                            key={idx} id={`mosque-${m.id}`}
                            onClick={() => { setSelectedId(m.id); leafletMap.current?.setView([m.lat, m.lon], 17, { animate: true }); }}
                            className={`group relative p-5 rounded-[2rem] border transition-all duration-500 cursor-pointer overflow-hidden animate-in slide-in-from-bottom-5
                                ${selectedId === m.id ? 'bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/10' : 'bg-[#1e293b]/40 border-white/5 hover:border-white/20'}`}
                        >
                            <div className="flex items-start justify-between gap-4 relative z-10">
                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${selectedId === m.id ? 'bg-emerald-500 text-white' : 'bg-black/20 text-emerald-500'}`}>
                                        <Landmark size={24} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`font-black text-lg truncate ${selectedId === m.id ? 'text-white' : 'text-gray-200'}`}>{m.tags?.name || 'مسجد بدون اسم'}</h3>
                                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold mt-1">
                                            <MapPin size={12} /> <span className="truncate">{m.tags['addr:street'] || 'موقع محدد'}</span>
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest">
                                                {(m.distance * 1000).toFixed(0)} متر
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`, '_blank'); }} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-emerald-600 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-white/5">
                                    <Navigation size={20} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center space-y-4 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                            <Compass size={48} className="mx-auto text-gray-700 animate-spin-slow" />
                            <p className="text-gray-500 font-bold">لا توجد مساجد قريبة في هذا النطاق</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
