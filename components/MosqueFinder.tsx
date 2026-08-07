
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Search, Target, MapPinned, Compass, LocateFixed, ZoomIn, Info, Copy, Check, X, Car, Footprints, Share2 } from 'lucide-react';

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
    `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="mg-dome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fde68a" />
                <stop offset="100%" stop-color="#f59e0b" />
            </linearGradient>
            <linearGradient id="mg-build" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#34d399" />
                <stop offset="100%" stop-color="#059669" />
            </linearGradient>
            <linearGradient id="mg-min" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" />
                <stop offset="100%" stop-color="#047857" />
            </linearGradient>
            <linearGradient id="mg-door" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#065f46" />
                <stop offset="100%" stop-color="#022c22" />
            </linearGradient>
        </defs>
        <rect x="6" y="12.5" width="12" height="7.5" rx="1" fill="url(#mg-build)" stroke="${s ? '#fff' : 'rgba(255,255,255,0.25)'}" stroke-width="0.6" />
        <path d="M8.5 12.5 C8.5 7 15.5 7 15.5 12.5 Z" fill="url(#mg-dome)" stroke="${s ? '#fff' : 'rgba(255,255,255,0.3)'}" stroke-width="0.5" />
        <path d="M10 12.5 C10.2 8.7 13.2 7.5 14.4 7.6" stroke="rgba(255,255,255,0.55)" stroke-width="0.5" fill="none" stroke-linecap="round" />
        <path fill-rule="evenodd" d="M12 3.2 a2 2 0 1 0 0 4 a2 2 0 1 0 0 -4 Z M12.7 3.6 a1.5 1.5 0 1 0 0 3 a1.5 1.5 0 1 0 0 -3 Z" fill="#fbbf24" />
        <path d="M10.5 20 L10.5 15.5 A1.5 1.5 0 0 1 13.5 15.5 L13.5 20 Z" fill="url(#mg-door)" stroke="rgba(255,255,255,0.35)" stroke-width="0.5" />
        <rect x="3.2" y="10.5" width="1.6" height="9.5" rx="0.8" fill="url(#mg-min)" stroke="${s ? '#fff' : 'rgba(255,255,255,0.25)'}" stroke-width="0.5" />
        <path d="M4 10.5 L3.4 8 L5.6 8 L5 10.5 Z" fill="url(#mg-dome)" stroke="${s ? '#fff' : 'rgba(255,255,255,0.3)'}" stroke-width="0.4" />
        <rect x="2.8" y="8.4" width="2.4" height="1" rx="0.4" fill="#065f46" stroke="rgba(255,255,255,0.3)" stroke-width="0.4" />
        <rect x="19.2" y="10.5" width="1.6" height="9.5" rx="0.8" fill="url(#mg-min)" stroke="${s ? '#fff' : 'rgba(255,255,255,0.25)'}" stroke-width="0.5" />
        <path d="M20 10.5 L19.4 8 L21.6 8 L21 10.5 Z" fill="url(#mg-dome)" stroke="${s ? '#fff' : 'rgba(255,255,255,0.3)'}" stroke-width="0.4" />
        <rect x="18.8" y="8.4" width="2.4" height="1" rx="0.4" fill="#065f46" stroke="rgba(255,255,255,0.3)" stroke-width="0.4" />
    </svg>`;

const MosqueIcon = ({ selected = false, size = 28 }: { selected?: boolean; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="mi-dome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fde68a" />
                <stop offset="100%" stop-color="#f59e0b" />
            </linearGradient>
            <linearGradient id="mi-build" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#34d399" />
                <stop offset="100%" stop-color="#059669" />
            </linearGradient>
            <linearGradient id="mi-min" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" />
                <stop offset="100%" stop-color="#047857" />
            </linearGradient>
            <linearGradient id="mi-door" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#065f46" />
                <stop offset="100%" stop-color="#022c22" />
            </linearGradient>
        </defs>
        <rect x="6" y="12.5" width="12" height="7.5" rx="1" fill="url(#mi-build)" stroke={selected ? '#fff' : 'rgba(255,255,255,0.25)'} strokeWidth="0.6" />
        <path d="M8.5 12.5 C8.5 7 15.5 7 15.5 12.5 Z" fill="url(#mi-dome)" stroke={selected ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="0.5" />
        <path d="M10 12.5 C10.2 8.7 13.2 7.5 14.4 7.6" stroke="rgba(255,255,255,0.55)" strokeWidth="0.5" fill="none" strokeLinecap="round" />
        <path fillRule="evenodd" d="M12 3.2 a2 2 0 1 0 0 4 a2 2 0 1 0 0 -4 Z M12.7 3.6 a1.5 1.5 0 1 0 0 3 a1.5 1.5 0 1 0 0 -3 Z" fill="#fbbf24" />
        <path d="M10.5 20 L10.5 15.5 A1.5 1.5 0 0 1 13.5 15.5 L13.5 20 Z" fill="url(#mi-door)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
        <rect x="3.2" y="10.5" width="1.6" height="9.5" rx="0.8" fill="url(#mi-min)" stroke={selected ? '#fff' : 'rgba(255,255,255,0.25)'} strokeWidth="0.5" />
        <path d="M4 10.5 L3.4 8 L5.6 8 L5 10.5 Z" fill="url(#mi-dome)" stroke={selected ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="0.4" />
        <rect x="2.8" y="8.4" width="2.4" height="1" rx="0.4" fill="#065f46" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
        <rect x="19.2" y="10.5" width="1.6" height="9.5" rx="0.8" fill="url(#mi-min)" stroke={selected ? '#fff' : 'rgba(255,255,255,0.25)'} strokeWidth="0.5" />
        <path d="M20 10.5 L19.4 8 L21.6 8 L21 10.5 Z" fill="url(#mi-dome)" stroke={selected ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth="0.4" />
        <rect x="18.8" y="8.4" width="2.4" height="1" rx="0.4" fill="#065f46" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
    </svg>
);

export const MosqueFinder: React.FC = () => {
    const formatDistance = (km: number) => (km >= 1 ? `${km.toFixed(1)} كم` : `${Math.round(km * 1000)} م`);
    const walkTime = (km: number) => Math.max(1, Math.round((km / 4.8) * 60));
    const getDirectionsUrl = (m: any) => {
        const dest = `${m.lat},${m.lon}`;
        const origin = !usingIpLocation && userPos ? `&origin=${userPos[0]},${userPos[1]}` : '';
        return `https://www.google.com/maps/dir/?api=1${origin}&destination=${dest}&travelmode=walking`;
    };
    const [mosques, setMosques] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [radius, setRadius] = useState(2);
    const [userPos, setUserPos] = useState<[number, number] | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [infoId, setInfoId] = useState<string | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [locating, setLocating] = useState(false);
    const [usingIpLocation, setUsingIpLocation] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [route, setRoute] = useState<{ coords: any[]; distKm: number; walkMin: number; driveMin: number } | null>(null);
    const [routing, setRouting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
    const routePolylineRef = useRef<any[]>([]);
    const fetchTokenRef = useRef(0);

    const clearRoute = () => {
        routePolylineRef.current.forEach((l) => leafletMap.current?.removeLayer(l));
        routePolylineRef.current = [];
    };

    const loadRoute = async (m: any) => {
        if (!userPos || !leafletMap.current) return;
        setRouting(true);
        clearRoute();
        const L = (window as any).L;
        const o = `${userPos[1]},${userPos[0]}`;
        const d = `${m.lon},${m.lat}`;
        const results = await Promise.allSettled(
            ['walking', 'driving'].map((profile) =>
                fetch(`https://router.project-osrm.org/route/v1/${profile}/${o};${d}?overview=full&geometries=geojson`)
                    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
                    .then((j) => ({ profile, route: j.routes?.[0] }))
            )
        );
        const walkRes = results.find((r) => r.status === 'fulfilled' && (r.value as any).profile === 'walking');
        const driveRes = results.find((r) => r.status === 'fulfilled' && (r.value as any).profile === 'driving');
        const walkRoute = walkRes?.status === 'fulfilled' ? (walkRes.value as any).route : null;
        const driveRoute = driveRes?.status === 'fulfilled' ? (driveRes.value as any).route : null;
        const primary = walkRoute || driveRoute;
        if (!primary) {
            if (leafletMap.current) leafletMap.current.setView([m.lat, m.lon], 16, { animate: true });
            setRouting(false);
            return;
        }
        const pts = primary.geometry.coordinates.map((c: number[]) => ({ lat: c[1], lng: c[0] }));
        const bounds = L.latLngBounds(pts.map((p: any) => L.latLng(p.lat, p.lng)));
        const glow = L.polyline(pts, { color: '#34d399', weight: 9, opacity: 0.22, lineCap: 'round', lineJoin: 'round', className: 'mosque-route-glow' }).addTo(leafletMap.current);
        const line = L.polyline(pts, { color: '#10b981', weight: 3.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round', className: 'mosque-route-flow' }).addTo(leafletMap.current);
        routePolylineRef.current = [glow, line];
        if (bounds.isValid()) {
            leafletMap.current.fitBounds(bounds.pad(0.25), { animate: true, duration: 1, maxZoom: 15, padding: [40, 40] });
        }
        const distKm = primary.distance / 1000;
        const WALK_SPEED = 4.8;
        const DRIVE_SPEED = 28;
        const walkDistKm = walkRoute ? walkRoute.distance / 1000 : distKm;
        const driveDistKm = driveRoute ? driveRoute.distance / 1000 : distKm;
        const walkMin = walkRoute
            ? Math.max(1, Math.round(Math.max(walkRoute.duration / 60, (walkDistKm / WALK_SPEED) * 60)))
            : Math.max(1, Math.round((walkDistKm / WALK_SPEED) * 60));
        const driveMin = driveRoute
            ? Math.max(1, Math.round(Math.max(driveRoute.duration / 60, (driveDistKm / DRIVE_SPEED) * 60)))
            : Math.max(1, Math.round((driveDistKm / DRIVE_SPEED) * 60));
        setRoute({
            coords: pts,
            distKm,
            walkMin,
            driveMin
        });
        setRouting(false);
    };

    const copyName = async (m: any) => {
        const name = m.tags?.name || 'مسجد';
        try { await navigator.clipboard.writeText(name); } catch {
            const ta = document.createElement('textarea');
            ta.value = name; document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch { /* noop */ }
            document.body.removeChild(ta);
        }
        setCopiedId(String(m.id));
        setTimeout(() => setCopiedId((c) => (c === String(m.id) ? null : c)), 1500);
    };

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
        setLocating(true);
        setLoading(true);
        setErrorMsg(null);

        const fetchAt = (coords: [number, number], accurate: boolean) => {
            setUserPos(coords);
            setUsingIpLocation(!accurate);
            if (leafletMap.current) {
                leafletMap.current.flyTo(coords, accurate ? 15 : 13, { duration: 1 });
            }
            fetchNearbyMosques(coords, radius);
            setLocating(false);
        };

        const fallbackToIp = () => {
            fetch('https://ipwho.is/')
                .then((r) => (r.ok ? r.json() : Promise.reject()))
                .then((ip) => {
                    const lat = parseFloat(ip.latitude);
                    const lon = parseFloat(ip.longitude);
                    if (!isNaN(lat) && !isNaN(lon)) fetchAt([lat, lon], false);
                    else fetchAt([24.7136, 46.6753], false);
                })
                .catch(() => fetchAt([24.7136, 46.6753], false));
        };

        if (!navigator.geolocation) { fallbackToIp(); return; }
        // Fast + battery friendly: WiFi/cell accuracy (~50m) instead of GPS high-accuracy
        // which takes 5-15s and freezes phones.
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchAt([pos.coords.latitude, pos.coords.longitude], true),
            () => { fallbackToIp(); },
            { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
        );
    };

    useEffect(() => {
        if (!userPos) return;
        const t = setTimeout(() => fetchNearbyMosques(userPos, radius), 400);
        return () => clearTimeout(t);
    }, [radius]);

    const OVERPASS_MIRRORS = [
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
        'https://overpass-api.de/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.openstreetmap.ru/api/interpreter',
        'https://overpass.osm.ch/api/interpreter'
    ];

    const firstSuccess = <T,>(promises: Promise<T>[]) =>
        new Promise<T>((resolve, reject) => {
            let pending = promises.length;
            if (pending === 0) return reject(new Error('no mirrors'));
            promises.forEach((p) => p.then(
                (v) => resolve(v),
                () => { pending -= 1; if (pending === 0) reject(new Error('all mirrors failed')); }
            ));
        });

    const fetchNearbyMosques = async (coords: [number, number], r: number) => {
        setLoading(true);
        setErrorMsg(null);
        clearRoute();
        setRoute(null);
        setSelectedId(null);
        const token = ++fetchTokenRef.current;
        const [lat, lon] = coords;
        const dist = r * 1000;
        const queryMeters = Math.min(dist, 15000);
        const query = `[out:json][timeout:30];(
            nwr["religion"="muslim"](around:${queryMeters},${lat},${lon});
            nwr["building"="mosque"](around:${queryMeters},${lat},${lon});
            nwr["amenity"="mosque"](around:${queryMeters},${lat},${lon});
        );out center tags;`;

        const timers: ReturnType<typeof setTimeout>[] = [];
        const makeAbortable = (ms: number) => {
            const controller = new AbortController();
            timers.push(setTimeout(() => controller.abort(), ms));
            return controller;
        };

        const fromOverpass = firstSuccess(OVERPASS_MIRRORS.map(async (mirror): Promise<{ source: 'overpass'; data: any }> => {
            const res = await fetch(`${mirror}?data=${encodeURIComponent(query)}`, { signal: makeAbortable(30000).signal });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const data = await res.json();
            if (!data?.elements || data.elements.length === 0) throw new Error('empty result');
            return { source: 'overpass', data };
        }));

        const photonQuery = (q: string) =>
            fetch(`https://photon.komoot.io/api/?q=${q}&lat=${lat}&lon=${lon}&limit=100`, { signal: makeAbortable(10000).signal })
                .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`status ${res.status}`))));
        const fromPhoton = Promise.all([photonQuery('mosque'), photonQuery(encodeURIComponent('مسجد'))])
            .then(([a, b]) => {
                const seen = new Set<string>();
                const merged = [...(a.features || []), ...(b.features || [])].filter((f: any) => {
                    const id = f.properties?.osm_id;
                    if (id == null) return true;
                    if (seen.has(String(id))) return false;
                    seen.add(String(id));
                    return true;
                });
                return { source: 'photon' as const, data: { features: merged } };
            });

        const mapOverpass = (els: any[]) => {
            const seen = new Set<string>();
            return els.map((m: any) => ({
                ...m,
                lat: m.lat || m.center?.lat,
                lon: m.lon || m.center?.lon,
                distance: getDistance(lat, lon, m.lat || m.center?.lat, m.lon || m.center?.lon)
            })).filter((m: any) => m.distance <= r)
                .filter((m: any) => {
                    const key = `${(m.tags?.['name:ar'] || m.tags?.name || '').trim()}|${Math.round((m.lat + 0.0004) * 2500)}|${Math.round((m.lon + 0.0004) * 2500)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .map((m: any) => ({
                    ...m,
                    tags: { ...m.tags, name: m.tags?.['name:ar'] || m.tags?.name || 'مسجد' }
                }))
                .sort((a: any, b: any) => a.distance - b.distance);
        };

        const mapPhoton = (feats: any[]) =>
            feats
                .filter((f: any) => ['place_of_worship', 'mosque'].includes(f.properties?.osm_value))
                .map((f: any) => {
                    const p = f.properties || {};
                    return {
                        id: `p-${p.osm_id}`,
                        lat: f.geometry.coordinates[1],
                        lon: f.geometry.coordinates[0],
                        distance: getDistance(lat, lon, f.geometry.coordinates[1], f.geometry.coordinates[0]),
                        tags: {
                            name: p.name && p.name.toLowerCase() !== 'mosque' ? p.name : 'مسجد',
                            'addr:street': p.street,
                            'addr:city': p.city,
                            'addr:district': p.district,
                            'addr:postcode': p.postcode,
                            'addr:country': p.countrycode
                        }
                    };
                })
                .filter((m: any) => m.distance <= r)
                .sort((a: any, b: any) => a.distance - b.distance);

        let failures = 0;
        const onFailure = () => {
            failures += 1;
            if (failures === 2 && token === fetchTokenRef.current) {
                setErrorMsg('تعذر الاتصال بخدمة المساجد حالياً، حاول مرة أخرى بعد قليل');
            }
        };

        // Fast show with Photon (reliable but sparse) — ends the loading quickly.
        fromPhoton
            .then((ph) => {
                if (token !== fetchTokenRef.current) return;
                const els = mapPhoton(ph.data.features);
                if (els.length > 0) setMosques(els);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
                onFailure();
            });

        // Dense enrichment with Overpass — replaces Photon's result when it arrives.
        fromOverpass
            .then((op) => {
                if (token !== fetchTokenRef.current) return;
                const els = mapOverpass(op.data.elements);
                if (els.length > 0) setMosques(els);
                setLoading(false);
            })
            .catch(() => {
                if (token === fetchTokenRef.current) setLoading(false);
                onFailure();
            });
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
        const visible = route && mosques.some((m: any) => m.id === selectedId) ? mosques.filter((m: any) => m.id === selectedId) : mosques;
        visible.forEach((m) => {
            const isSelected = selectedId === m.id;
            const mosqueIcon = L.divIcon({
                className: '',
                html: `<div class="relative transition-all duration-500 ${isSelected ? 'z-[999]' : ''}">
                    <div class="relative ${isSelected ? 'scale-125' : 'scale-100 hover:scale-110'} transition-transform duration-300">
                        <div class="w-14 h-14 ${isSelected ? 'bg-emerald-500/15 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.5)]' : 'bg-slate-900/80 border-white/10 hover:border-emerald-500/30'} rounded-2xl border flex items-center justify-center shadow-lg transition-all duration-300">
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
                loadRoute(m);
                setTimeout(() => {
                    document.getElementById(`mosque-${m.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
            markersRef.current.push(marker);
        });
    }, [mosques, userPos, radius, selectedId, mapReady, route]);

    const filtered = mosques.filter(m => (m.tags?.name || 'مسجد').toLowerCase().includes(searchQuery.toLowerCase()));
    const selectedMosque = mosques.find((m: any) => m.id === selectedId) || null;

    return (
        <div className="w-full max-w-7xl mx-auto px-3 md:px-6 pb-40 space-y-6 md:space-y-10 animate-fade-in">
            <style>{`
                @keyframes mosque-route-flow { to { stroke-dashoffset: -22; } }
                .mosque-route-flow { stroke-dasharray: 7 9; animation: mosque-route-flow 0.8s linear infinite; }
                .mosque-route-glow { animation: mosque-route-pulse 1.6s ease-in-out infinite; }
                @keyframes mosque-route-pulse { 0%, 100% { opacity: 0.18; } 50% { opacity: 0.38; } }
            `}</style>
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

            {usingIpLocation && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] md:text-xs font-bold max-w-2xl mx-auto">
                    <LocateFixed size={14} className="shrink-0" />
                    <span>لم نتمكن من تحديد موقعك بدقة، نعرض لك المساجد حول موقعك التقريبي. اضغط زر الموقع 🔍 للمحاولة مجدداً.</span>
                </div>
            )}

            {errorMsg && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] md:text-xs font-bold max-w-2xl mx-auto">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                    <span>{errorMsg}</span>
                    <button onClick={locateUser} className="mr-auto shrink-0 px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-all">إعادة المحاولة</button>
                </div>
            )}

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

                        {(route || routing) && (
                            <div className="absolute top-3 md:top-6 left-1/2 -translate-x-1/2 z-[400] w-[calc(100%-24px)] max-w-sm md:max-w-md">
                                <div className="bg-black/70 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-2xl px-3 md:px-4 py-2.5 md:py-3">
                                    {routing ? (
                                        <div className="flex items-center gap-2 text-[10px] md:text-xs font-black text-emerald-300">
                                            <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
                                            <span>جاري حساب المسار...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 shrink-0"></div>
                                                <span className="text-[10px] md:text-xs font-black text-emerald-300 flex-1 truncate">المسار إلى {selectedMosque?.tags?.name || 'المسجد'}</span>
                                                <button onClick={() => { clearRoute(); setRoute(null); }} className="shrink-0 w-6 h-6 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 flex items-center justify-center transition-all">
                                                    <X size={13} />
                                                </button>
                                            </div>
                                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-300 text-[9px] md:text-[10px] font-black inline-flex items-center gap-1"><Footprints size={10} /> ~{route?.walkMin} د مشي</span>
                                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[9px] md:text-[10px] font-black inline-flex items-center gap-1"><Car size={10} /> ~{route?.driveMin} د سيارة</span>
                                                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-[9px] md:text-[10px] font-black">{(route?.distKm ?? 0) >= 1 ? `${(route.distKm ?? 0).toFixed(1)} كم` : `${Math.round((route?.distKm ?? 0) * 1000)} م`}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {userPos && (
                            <div className="hidden md:flex absolute top-3 md:top-6 right-3 md:right-6 z-[400] bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-lg">
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
                            onClick={() => { setSelectedId(m.id); loadRoute(m); }}
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
                                        ? 'bg-slate-900 ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-500/25 scale-110'
                                        : 'bg-black/30 border border-white/5'}`}>
                                        <MosqueIcon selected={selectedId === m.id} size={selectedId === m.id ? 26 : 24} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`font-black text-sm md:text-lg truncate ${selectedId === m.id ? 'text-white' : 'text-gray-200'}`}>{m.tags?.name || 'مسجد'}</h3>
                                            {idx === 0 && (
                                                <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/20 text-amber-400 text-[7px] md:text-[8px] font-black">الأقرب</span>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyName(m); }}
                                                className={`shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-all border ${copiedId === String(m.id)
                                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-emerald-300 hover:border-emerald-500/40'}`}
                                                title={copiedId === String(m.id) ? 'تم النسخ' : 'نسخ اسم المسجد'}
                                            >
                                                {copiedId === String(m.id) ? <Check size={12} /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500 text-[9px] md:text-[10px] font-bold mt-0.5 md:mt-1">
                                            <MapPin size={10} />
                                            <span className="truncate">{m.tags['addr:street'] || m.tags['addr:city'] || m.tags['addr:place'] || 'موقع محدد'}</span>
                                        </div>
                                        <div className="mt-1.5 md:mt-2 flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-black border transition-all ${selectedId === m.id
                                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                                                : 'bg-white/5 border-white/5 text-emerald-400'}`}>
                                                {formatDistance(m.distance)}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[8px] md:text-[9px] font-black">
                                                ~ {walkTime(m.distance)} د مشي
                                            </span>
                                            {m.tags?.['wheelchair'] === 'yes' && (
                                                <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[8px] md:text-[9px] font-black">
                                                    <span className="inline-flex items-center gap-1"><svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="2"/><path d="M5 8l-2 3 2 1 2-3-2-1zm9 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-1.4 2.2L15 15l1.6-1.6a3.6 3.6 0 1 1-2.6 2.6l1.6-1.6-1.6-1.2z"/></svg>متاح</span>
                                                </span>
                                            )}
                                            {(m.tags?.['opening_hours']?.toLowerCase().includes('24') || m.tags?.['opening_hours']?.toLowerCase().includes('24/7')) && (
                                                <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] md:text-[9px] font-black">24 ساعة</span>
                                            )}
                                            {m.tags?.['capacity'] && (
                                                <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] md:text-[9px] font-black">يتسع لـ {m.tags.capacity}</span>
                                            )}
                                        </div>
                                        {selectedId === m.id && routing && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
                                                <span className="text-[9px] md:text-[10px] font-bold text-emerald-400">جاري حساب المسار...</span>
                                            </div>
                                        )}
                                        {selectedId === m.id && route && (
                                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[8px] md:text-[9px] font-black inline-flex items-center gap-1"><Footprints size={9} /> ~{route.walkMin} د مشي</span>
                                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] md:text-[9px] font-black inline-flex items-center gap-1"><Car size={9} /> ~{route.driveMin} د سيارة</span>
                                                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-[8px] md:text-[9px] font-black">{route.distKm >= 1 ? `${route.distKm.toFixed(1)} كم` : `${Math.round(route.distKm * 1000)} م`}</span>
                                            </div>
                                        )}
                                        {(m.tags?.phone || m.tags?.website) && (
                                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                {m.tags?.phone && (
                                                    <a href={`tel:${m.tags.phone}`} onClick={(e) => e.stopPropagation()} className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/5 hover:border-emerald-500/40 text-gray-400 hover:text-emerald-300 text-[8px] md:text-[9px] font-bold flex items-center gap-1 transition-all">
                                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2z"/></svg>
                                                        اتصال
                                                    </a>
                                                )}
                                                {m.tags?.website && (
                                                    <a href={m.tags.website.startsWith('http') ? m.tags.website : `https://${m.tags.website}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/5 hover:border-emerald-500/40 text-gray-400 hover:text-emerald-300 text-[8px] md:text-[9px] font-bold flex items-center gap-1 transition-all">
                                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>
                                                        الموقع
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setInfoId(infoId === m.id ? null : String(m.id)); }}
                                        className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center transition-all border shadow-lg ${infoId === m.id
                                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-sky-500/20 hover:text-sky-300 hover:border-sky-500/40'}`}
                                        title="معلومات المسجد"
                                    >
                                        <Info size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); window.open(getDirectionsUrl(m), '_blank'); }}
                                        className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center transition-all border shadow-lg ${selectedId === m.id
                                            ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-emerald-600 hover:text-white hover:border-emerald-500'}`}
                                        title="الطرق إلى المسجد"
                                    >
                                        <Navigation size={16} />
                                    </button>
                                </div>
                            </div>

                            {infoId === m.id && (
                                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10 relative z-10 space-y-2.5 md:space-y-3 animate-fade-in">
                                    <div className="flex items-start gap-2 text-gray-400 text-[10px] md:text-xs font-bold">
                                        <MapPin size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{[m.tags['addr:street'], m.tags['addr:district'], m.tags['addr:city'], m.tags['addr:postcode']].filter(Boolean).join('، ') || 'عنوان غير محدد'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] md:text-[10px] font-black">{formatDistance(m.distance)}</span>
                                        <span className="px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] md:text-[10px] font-black">~ {walkTime(m.distance)} د مشي</span>
                                        {m.tags?.['wheelchair'] === 'yes' && <span className="px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[9px] font-black">مجهز لذوي الاحتياجات</span>}
                                        {m.tags?.['capacity'] && <span className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black">يتسع لـ {m.tags.capacity}</span>}
                                        {m.tags?.['opening_hours'] && <span className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black">{m.tags['opening_hours']}</span>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <a
                                            href={getDirectionsUrl(m)}
                                            target="_blank" rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] md:text-xs font-black shadow-lg transition-all active:scale-95"
                                        >
                                            <Navigation size={15} /> الطرق الآن من موقعك
                                        </a>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}`}
                                            target="_blank" rel="noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[10px] md:text-xs font-black transition-all active:scale-95"
                                        >
                                            <MapPin size={15} /> عرض في خرائط قوقل
                                        </a>
                                    </div>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const shareData = {
                                                title: m.tags?.name || 'مسجد',
                                                text: `${m.tags?.name || 'مسجد'} — ${formatDistance(m.distance)} من موقعك`,
                                                url: `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}`
                                            };
                                            try {
                                                if (navigator.share) await navigator.share(shareData);
                                                else {
                                                    await navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
                                                    setCopiedId(String(m.id));
                                                    setTimeout(() => setCopiedId(null), 1500);
                                                }
                                            } catch { /* user cancelled */ }
                                        }}
                                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 text-gray-400 hover:text-emerald-300 text-[10px] md:text-xs font-black transition-all active:scale-95"
                                    >
                                        <Share2 size={14} /> مشاركة المسجد
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-16 md:py-20 text-center space-y-3 md:space-y-4 bg-white/[0.02] rounded-[1.5rem] md:rounded-[2rem] border border-dashed border-white/5"
                        >
                            {loading ? (
                                <>
                                    <div className="mx-auto w-10 h-10 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
                                    <p className="text-gray-400 font-bold text-sm">جاري البحث عن أقرب المساجد...</p>
                                    <p className="text-gray-700 text-xs font-medium">جاري مسح المنطقة المحيطة بك</p>
                                </>
                            ) : errorMsg ? (
                                <>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-red-500/50"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                                    <p className="text-gray-400 font-bold text-sm">{errorMsg}</p>
                                    <button onClick={locateUser} className="mx-auto px-5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black hover:bg-emerald-500/25 transition-all">إعادة المحاولة</button>
                                </>
                            ) : (
                                <>
                                    <Compass size={40} className="mx-auto text-gray-700 animate-spin-slow" />
                                    <p className="text-gray-500 font-bold text-sm">لا توجد مساجد قريبة في هذا النطاق</p>
                                    <p className="text-gray-700 text-xs font-medium">جرب زيادة نطاق البحث أو تأكد من تفعيل الموقع</p>
                                </>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
