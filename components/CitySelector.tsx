
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

    // Get cities for the selected country
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

    // Reset value if country changes and city is not in the new list
    useEffect(() => {
        if (value && !cities.includes(value)) {
            onChange('');
        }
    }, [countryCode]);

    const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!countryCode) return (
        <div className="w-full h-20 px-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 font-bold opacity-50 cursor-not-allowed">
            اختر الدولة أولاً
        </div>
    );

    return (
        <div className="relative w-full group" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-20 px-8 rounded-3xl flex items-center justify-between transition-all duration-500 border relative overflow-hidden active:scale-95 text-right
                    ${isOpen ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'}`}
            >
                <div className="flex items-center gap-5 relative z-10 overflow-hidden">
                    <div className={`p-3 rounded-2xl transition-all duration-500 ${isOpen ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                        <MapPin size={24} />
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">المدينة</span>
                        {value ? (
                            <span className="text-xl font-bold text-white truncate">{value}</span>
                        ) : (
                            <span className="text-xl font-bold text-gray-400">اختر مدينتك</span>
                        )}
                    </div>
                </div>
                <ChevronDown size={20} className={`text-gray-500 transition-transform duration-500 relative z-10 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
            </button>

            {/* Dropdown Modal */}
            {isOpen && (
                <div className="absolute top-[110%] left-0 right-0 bg-[#0f172a] rounded-[2.5rem] border border-white/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
                    {/* High-Intensity Blur Layer */}
                    <div className="absolute inset-0 backdrop-blur-[100px] opacity-50 pointer-events-none"></div>

                    {/* Search Bar Container */}
                    <div className="p-8 border-b border-white/10 bg-[#1e293b]/80 backdrop-blur-[40px] sticky top-0 z-10">
                        <div className="relative group/search">
                            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-400/50 group-focus-within/search:text-emerald-400 transition-colors" size={22} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="بحث عن مدينة..."
                                className="w-full bg-[#0f172a]/60 border border-white/10 rounded-2xl py-5 pr-16 pl-8 text-white text-xl focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-500 shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 transition-colors">
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent p-3 space-y-2">
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
                                    className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-300 group
                                        ${value === city ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-white/5 text-gray-400'}`}
                                >
                                    <span className={`text-lg transition-colors ${value === city ? 'font-black' : 'font-bold group-hover:text-white'}`}>{city}</span>
                                    {value === city && (
                                        <div className="bg-emerald-500 p-1.5 rounded-full shadow-lg shadow-emerald-500/40 animate-in zoom-in duration-300">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-4">
                                <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-700">
                                    <MapPin size={32} />
                                </div>
                                <p className="text-gray-600 font-bold">لا توجد نتائج مطابقة</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
