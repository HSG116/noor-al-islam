
import React, { useState, useRef, useEffect } from 'react';
import { COUNTRIES } from '../data/countries';
import { Search, ChevronDown, MapPin, X, Check } from 'lucide-react';

interface CitySelectorProps {
    countryCode: string;
    value: string;
    onChange: (city: string) => void;
}

export const CitySelector: React.FC<CitySelectorProps> = ({ countryCode, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedCountry = COUNTRIES.find(c => c.code === countryCode);
    const cities = selectedCountry ? selectedCountry.cities : [];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (value && !cities.includes(value)) {
            onChange('');
        }
    }, [countryCode]);

    const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!countryCode) return (
        <div className="w-full h-12 md:h-14 px-3 md:px-5 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 font-bold opacity-50 cursor-not-allowed text-xs md:text-sm">
            اختر الدولة أولاً
        </div>
    );

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-12 md:h-14 px-3 md:px-5 rounded-xl md:rounded-2xl flex items-center justify-between transition-all duration-300 border relative overflow-hidden active:scale-95 text-right
                    ${isOpen ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'}`}
            >
                <div className="flex items-center gap-2 md:gap-3 relative z-10 min-w-0 flex-1 ml-2 md:ml-0">
                    <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all duration-300 shrink-0 ${isOpen ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                        <MapPin size={16} />
                    </div>
                    <div className="flex flex-col items-end min-w-0">
                        <span className="text-[8px] md:text-[9px] font-black text-gray-500 leading-none mb-0.5">المدينة</span>
                        {value ? (
                            <span className="text-xs md:text-sm font-bold text-white truncate max-w-[90px] md:max-w-[180px]">{value}</span>
                        ) : (
                            <span className="text-xs md:text-sm font-bold text-gray-400">اختر مدينتك</span>
                        )}
                    </div>
                </div>
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[110%] left-0 right-0 bg-[#0f172a] rounded-2xl md:rounded-[2.5rem] border border-white/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
                    <div className="absolute inset-0 backdrop-blur-[100px] opacity-50 pointer-events-none"></div>

                    <div className="p-3 md:p-6 border-b border-white/10 bg-[#1e293b]/80 backdrop-blur-[40px] sticky top-0 z-10">
                        <div className="relative">
                            <Search className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-emerald-400/50 transition-colors" size={14} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="بحث عن مدينة..."
                                className="w-full bg-[#0f172a]/60 border border-white/10 rounded-none py-2 md:py-3 pr-9 md:pr-14 pl-3 md:pl-6 text-white text-xs md:text-lg focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[240px] md:max-h-[300px] overflow-y-auto p-2 md:p-3 space-y-1">
                        {filteredCities.length > 0 ? (
                            filteredCities.map((city) => (
                                <button
                                    key={city}
                                    type="button"
                                    onClick={() => {
                                        onChange(city);
                                        setIsOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className={`w-full p-2 md:p-3.5 rounded-xl md:rounded-2xl flex items-center justify-between transition-all duration-200
                                        ${value === city ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-white/5 text-gray-400'}`}
                                >
                                    <span className={`text-xs md:text-base transition-colors truncate ${value === city ? 'font-black' : 'font-bold'}`}>{city}</span>
                                    {value === city && (
                                        <div className="bg-emerald-500 p-1 md:p-1.5 rounded-full shadow-lg shadow-emerald-500/40 shrink-0">
                                            <Check size={10} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="py-12 md:py-16 text-center space-y-3">
                                <div className="mx-auto w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-full flex items-center justify-center text-gray-700">
                                    <MapPin size={18} />
                                </div>
                                <p className="text-gray-600 font-bold text-xs md:text-sm">لا توجد نتائج مطابقة</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
