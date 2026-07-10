
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Info, Locate, Minimize } from 'lucide-react';

const KAABA_COORDS = { lat: 21.422487, lng: 39.826206 };

export const Qibla: React.FC = () => {
    const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [bearing, setBearing] = useState<number>(0);
    const [distance, setDistance] = useState<string>('0');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);
    const lineRef = useRef<any>(null);
    const mapInitialized = useRef(false);

    // Initial script load
    useEffect(() => {
        const scriptId = 'leaflet-script';
        
        const init = () => {
            if ((window as any).L && !mapInitialized.current) {
                initMap();
            }
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
            const checkL = setInterval(() => {
                if ((window as any).L && !mapInitialized.current) {
                    clearInterval(checkL);
                    init();
                }
            }, 100);
        }

        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
                mapInitialized.current = false;
            }
        };
    }, []);

    const initMap = () => {
        if (!mapContainerRef.current || leafletMap.current || !(window as any).L) return;
        const L = (window as any).L;

        try {
            // Initialize map centered on Kaaba initially
            leafletMap.current = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView([KAABA_COORDS.lat, KAABA_COORDS.lng], 5);

            // Light/Clean Map Style
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                maxZoom: 20,
                subdomains: 'abcd'
            }).addTo(leafletMap.current);

            // Add Kaaba Marker (Custom CSS Icon)
            const kaabaIcon = L.divIcon({
                className: 'kaaba-marker',
                html: `
                    <div class="relative w-12 h-12 flex items-center justify-center">
                        <div class="w-8 h-8 bg-black rounded-sm relative shadow-2xl z-10 border border-gray-800">
                            <div class="absolute top-2 w-full h-1 bg-yellow-400 opacity-90"></div>
                        </div>
                        <div class="absolute -bottom-1 w-10 h-2 bg-black/20 blur-sm rounded-full"></div>
                        <div class="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">الكعبة المشرفة</div>
                    </div>
                `,
                iconSize: [48, 48],
                iconAnchor: [24, 40]
            });

            L.marker([KAABA_COORDS.lat, KAABA_COORDS.lng], { icon: kaabaIcon, zIndexOffset: 1000 }).addTo(leafletMap.current);

            mapInitialized.current = true;
            locateUser();
        } catch (e) {
            console.error("Map init error:", e);
        }
    };

    const locateUser = () => {
        if (!navigator.geolocation) {
            setError("المتصفح لا يدعم تحديد الموقع");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLat = pos.coords.latitude;
                const userLng = pos.coords.longitude;
                setUserLoc({ lat: userLat, lng: userLng });
                calculateQibla(userLat, userLng);
                drawPath(userLat, userLng);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                setError("يرجى تفعيل خدمة الموقع لرؤية اتجاه القبلة");
                setLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const calculateQibla = (lat: number, lng: number) => {
        const phi1 = lat * Math.PI / 180;
        const phi2 = KAABA_COORDS.lat * Math.PI / 180;
        const L1 = lng * Math.PI / 180;
        const L2 = KAABA_COORDS.lng * Math.PI / 180;

        // Bearing Calculation
        const y = Math.sin(L2 - L1) * Math.cos(phi2);
        const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(L2 - L1);
        const qibla = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        setBearing(qibla);

        // Distance Calculation (Haversine)
        const R = 6371; // km
        const dLat = phi2 - phi1;
        const dLon = L2 - L1;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        setDistance((R * c).toFixed(0));
    };

    const drawPath = (lat: number, lng: number) => {
        if (!leafletMap.current || !(window as any).L) return;
        const L = (window as any).L;

        // Clear existing line
        if (lineRef.current) lineRef.current.remove();

        // 1. Add User Marker
        const userIcon = L.divIcon({
            className: 'user-qibla-marker',
            html: `
                <div class="relative w-6 h-6 flex items-center justify-center">
                    <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-50"></div>
                    <div class="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg relative z-10"></div>
                </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        L.marker([lat, lng], { icon: userIcon, zIndexOffset: 999 }).addTo(leafletMap.current);

        // 2. Draw Geodesic Line (Visual straight line on Mercator)
        const latlngs = [
            [lat, lng],
            [KAABA_COORDS.lat, KAABA_COORDS.lng]
        ];

        // Draw the main line
        lineRef.current = L.polyline(latlngs, {
            color: '#10b981', // Emerald 500
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10',
            className: 'qibla-line-anim' // We can add CSS animation here
        }).addTo(leafletMap.current);

        // 3. Fit Bounds to show both points with padding
        const bounds = L.latLngBounds(latlngs);
        leafletMap.current.fitBounds(bounds, { padding: [50, 50], animate: true });
    };

    const flyToUser = () => {
        if (userLoc && leafletMap.current) {
            leafletMap.current.flyTo([userLoc.lat, userLoc.lng], 15);
        }
    };

    const flyToKaaba = () => {
        if (leafletMap.current) {
            leafletMap.current.flyTo([KAABA_COORDS.lat, KAABA_COORDS.lng], 18);
        }
    };

    const showFullView = () => {
        if (userLoc && leafletMap.current && (window as any).L) {
            const L = (window as any).L;
            const bounds = L.latLngBounds([
                [userLoc.lat, userLoc.lng],
                [KAABA_COORDS.lat, KAABA_COORDS.lng]
            ]);
            leafletMap.current.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto px-4 pb-32 animate-fade-in space-y-6">
            
            {/* Header / Info Panel */}
            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 shadow-premium flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Navigation size={28} style={{ transform: `rotate(${bearing}deg)` }} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">اتجاه القبلة</h2>
                        <p className="text-gray-400 text-sm font-bold mt-1">المسافة: <span className="text-emerald-400 text-lg mx-1">{distance}</span> كم</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={flyToUser}
                        className="bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors"
                    >
                        <Locate size={16} />
                        موقعي
                    </button>
                    <button 
                        onClick={flyToKaaba}
                        className="bg-black text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 border border-gray-700 hover:bg-gray-900 transition-colors shadow-lg"
                    >
                        <div className="w-3 h-3 border border-gray-500 bg-black"></div>
                        الكعبة
                    </button>
                    <button 
                        onClick={showFullView}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors shadow-lg"
                    >
                        <Minimize size={16} />
                        المسار
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative h-[65vh] w-full rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-2xl bg-white">
                {loading && (
                    <div className="absolute inset-0 z-[500] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-bold text-sm">جاري تحديد المسار...</p>
                    </div>
                )}
                
                {error && (
                    <div className="absolute inset-0 z-[500] bg-white/90 flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <Info size={48} className="text-red-400" />
                        <p className="text-gray-800 font-bold text-lg">{error}</p>
                        <button onClick={locateUser} className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold">إعادة المحاولة</button>
                    </div>
                )}

                <div ref={mapContainerRef} className="w-full h-full z-0" />
                
                {/* CSS for custom map elements */}
                <style>{`
                    .qibla-line-anim {
                        animation: dash 30s linear infinite;
                    }
                    @keyframes dash {
                        to {
                            stroke-dashoffset: -1000;
                        }
                    }
                `}</style>
            </div>

            <div className="text-center text-gray-400 text-xs font-medium opacity-60">
                الخط الأخضر يوضح الاتجاه المباشر من موقعك إلى الكعبة المشرفة
            </div>
        </div>
    );
};
