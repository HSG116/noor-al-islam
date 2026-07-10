
import React, { useState, useRef, useEffect } from 'react';
import { COUNTRIES, Country } from '../data/countries';
import { Search, ChevronDown, Globe, X, Check } from 'lucide-react';

interface CountrySelectorProps {
    value: string;
    onChange: (code: string) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedCountry = COUNTRIES.find(c => c.code === value);

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

    const filteredCountries = COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getFlagUrl = (code: string) => `https://flagcdn.com/w80/${code.toLowerCase()}.png`;

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
                        <Globe size={16} />
                    </div>
                    <div className="flex flex-col items-end min-w-0">
                        <span className="text-[8px] md:text-[9px] font-black text-gray-500 leading-none mb-0.5">الدولة</span>
                        {selectedCountry ? (
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-xs md:text-sm font-bold text-white truncate max-w-[90px] md:max-w-[180px]">{selectedCountry.name}</span>
                                <img
                                    src={getFlagUrl(selectedCountry.code)}
                                    alt={selectedCountry.code}
                                    className="w-5 h-4 md:w-7 md:h-4 object-cover rounded shadow border border-white/10 shrink-0"
                                />
                            </div>
                        ) : (
                            <span className="text-xs md:text-sm font-bold text-gray-400">اختر دولتك</span>
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
                            <Search className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-emerald-400/50 group-focus-within/search:text-emerald-400 transition-colors" size={14} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="ابحث عن دولة..."
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

                    <div className="max-h-[240px] md:max-h-[320px] overflow-y-auto p-2 md:p-3 space-y-1">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => {
                                        onChange(country.code);
                                        setIsOpen(false);
                                        setSearchQuery('');
                                    }}
                                    className={`w-full p-2 md:p-3.5 rounded-xl md:rounded-2xl flex items-center justify-between transition-all duration-200
                                        ${value === country.code ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-white/5 text-gray-400'}`}
                                >
                                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                        <img
                                            src={getFlagUrl(country.code)}
                                            alt={country.code}
                                            className="w-5 h-4 md:w-8 md:h-5 object-cover rounded shadow opacity-80 group-hover:opacity-100 transition-opacity border border-white/5 shrink-0"
                                            loading="lazy"
                                        />
                                        <span className={`text-xs md:text-base transition-colors truncate ${value === country.code ? 'font-black' : 'font-bold'}`}>{country.name}</span>
                                    </div>
                                    {value === country.code && (
                                        <div className="bg-emerald-500 p-1 md:p-1.5 rounded-full shadow-lg shadow-emerald-500/40 shrink-0">
                                            <Check size={10} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="py-12 md:py-16 text-center space-y-3">
                                <div className="mx-auto w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-full flex items-center justify-center text-gray-700">
                                    <Globe size={18} />
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
