
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Book, Share2, Copy, Loader2, Library, ChevronLeft, Check, Filter, BookOpen, Globe, Languages } from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

// --- API CONFIGURATION ---
const API_KEY = '$2y$10$Zb4gkUNhrmM0FYINPze6eslRXArEQA9j4sCNxTuPEtonHuLqhPu';
const BASE_URL = 'https://hadithapi.com/api';

// --- ARABIC BOOK NAMES MAPPING ---
const BOOK_NAMES_AR: Record<string, string> = {
    'sahih-bukhari': 'صحيح البخاري',
    'sahih-muslim': 'صحيح مسلم',
    'al-tirmidhi': 'جامع الترمذي',
    'sunan-nasai': 'سنن النسائي',
    'sunan-abu-dawud': 'سنن أبي داود',
    'sunan-ibn-majah': 'سنن ابن ماجه',
    'muwatta-malik': 'موطأ مالك',
    'musnad-ahmad': 'مسند أحمد',
    'sunan-darimi': 'سنن الدارمي',
    'mishkat-al-masabih': 'مشكاة المصابيح',
    'riyad-as-salihin': 'رياض الصالحين',
    'bulugh-al-maram': 'بلوغ المرام',
    'shamail-muhammadiyah': 'الشمائل المحمدية',
    'adab-al-mufrad': 'الأدب المفرد'
};

// --- TYPES ---
interface BookData {
    id: number;
    bookName: string;
    bookSlug: string;
    hadiths_count: string;
    writerName: string;
    writerDeath: string;
    chapters_count: string;
}

interface HadithData {
    id: number;
    hadithNumber: string;
    englishNarrator: string;
    hadithArabic: string;
    hadithEnglish: string;
    chapterId: string;
    bookSlug: string;
    volume: string;
    status: string; // Grade
    headingArabic: string;
    headingEnglish: string;
}

interface ApiResponse<T> {
    status: number;
    message: string;
    books?: T[];
    hadiths?: {
        data: T[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

export const HadithLibrary: React.FC = () => {
    const [books, setBooks] = useState<BookData[]>([]);
    const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
    const [hadiths, setHadiths] = useState<HadithData[]>([]);
    
    // Loading States
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [loadingHadiths, setLoadingHadiths] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Pagination & Search & UI
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [showEnglish, setShowEnglish] = useState(false); // Toggle for English

    // Observer for infinite scroll
    const observer = useRef<IntersectionObserver | null>(null);

    // --- INITIAL FETCH: BOOKS ---
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await fetch(`${BASE_URL}/books?apiKey=${API_KEY}`);
                const data: ApiResponse<BookData> = await res.json();
                if (data.status === 200 && data.books) {
                    setBooks(data.books);
                }
            } catch (err) {
                console.error("Failed to fetch books:", err);
            } finally {
                setLoadingBooks(false);
            }
        };
        fetchBooks();
    }, []);

    // --- FETCH HADITHS (Reset or Load More) ---
    const fetchHadiths = async (bookSlug: string, page: number, isLoadMore: boolean = false) => {
        if (!isLoadMore) setLoadingHadiths(true);
        else setLoadingMore(true);

        try {
            const res = await fetch(`${BASE_URL}/hadiths?apiKey=${API_KEY}&book=${bookSlug}&page=${page}`);
            const data: ApiResponse<HadithData> = await res.json();
            
            if (data.status === 200 && data.hadiths) {
                if (isLoadMore) {
                    setHadiths(prev => [...prev, ...data.hadiths!.data]);
                } else {
                    setHadiths(data.hadiths.data);
                }
                setCurrentPage(data.hadiths.current_page);
                setLastPage(data.hadiths.last_page);
            }
        } catch (err) {
            console.error("Failed to fetch hadiths:", err);
        } finally {
            setLoadingHadiths(false);
            setLoadingMore(false);
        }
    };

    const handleBookSelect = (book: BookData) => {
        setSelectedBook(book);
        setSearchQuery('');
        setHadiths([]);
        setCurrentPage(1);
        fetchHadiths(book.bookSlug, 1);
    };

    const handleBack = () => {
        setSelectedBook(null);
        setHadiths([]);
        setSearchQuery('');
    };

    // --- INFINITE SCROLL LOGIC ---
    const lastHadithElementRef = useCallback((node: HTMLDivElement) => {
        if (loadingHadiths || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && currentPage < lastPage && selectedBook) {
                fetchHadiths(selectedBook.bookSlug, currentPage + 1, true);
            }
        });
        
        if (node) observer.current.observe(node);
    }, [loadingHadiths, loadingMore, currentPage, lastPage, selectedBook]);

    // --- UTILS ---
    const handleCopy = (text: string, id: number) => {
        const bookName = selectedBook ? (BOOK_NAMES_AR[selectedBook.bookSlug] || selectedBook.bookName) : 'الحديث';
        const fullText = `${text}\n\n[${bookName} - حديث رقم ${id}]`;
        navigator.clipboard.writeText(fullText);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleShare = async (text: string, id: number) => {
        const bookName = selectedBook ? (BOOK_NAMES_AR[selectedBook.bookSlug] || selectedBook.bookName) : 'الحديث';
        const fullText = `${text}\n\n[${bookName} - حديث رقم ${id}]\nعبر تطبيق نور الإسلام`;
        if (navigator.share) {
            try { await navigator.share({ title: 'حديث نبوي', text: fullText }); } catch (err) { console.error(err); }
        } else {
            handleCopy(text, id);
        }
    };

    // --- SEARCH NORMALIZATION ---
    // Helper to strip diacritics and normalize Arabic characters for better search
    const normalizeArabic = (text: string) => {
        if (!text) return '';
        let clean = text.replace(/<[^>]*>?/gm, ''); // Remove HTML tags if any
        
        clean = clean
            // Remove Tashkeel (Fatha, Damma, Kasra, Sukun, Shadda, etc.)
            .replace(/[\u064B-\u065F\u0670]/g, '')
            // Normalize Alef (أ, إ, آ -> ا)
            .replace(/[أإآ]/g, 'ا')
            // Normalize Taa Marbuta (ة -> ه) - Common in search
            .replace(/ة/g, 'ه')
            // Normalize Alif Maqsura (ى -> ي)
            .replace(/ى/g, 'ي');
            
        return clean.toLowerCase();
    };

    // --- PROCESS & FILTER LOGIC ---
    // Fill missing headings with the last seen heading
    const processHadiths = (list: HadithData[]) => {
        let lastHeadingArabic = '';
        let lastHeadingEnglish = '';
        
        return list.map(item => {
            if (item.headingArabic && item.headingArabic.trim().length > 0) {
                lastHeadingArabic = item.headingArabic;
                lastHeadingEnglish = item.headingEnglish || '';
                return item;
            } else {
                return {
                    ...item,
                    headingArabic: lastHeadingArabic,
                    headingEnglish: lastHeadingEnglish
                };
            }
        });
    };

    const processedHadiths = processHadiths(hadiths);

    const displayHadiths = processedHadiths.filter(h => {
        const q = normalizeArabic(searchQuery);
        return (
            normalizeArabic(h.hadithArabic).includes(q) || 
            (h.headingArabic && normalizeArabic(h.headingArabic).includes(q)) ||
            (h.hadithNumber && h.hadithNumber.includes(q)) ||
            (h.englishNarrator && h.englishNarrator.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    });

    // --- RENDER: BOOKS LIST ---
    if (!selectedBook) {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-20 space-y-8 md:space-y-20 overflow-x-hidden">
                {/* Header - Ultra Premium */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center relative"
                >
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -z-10 animate-pulse"></div>
                    
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[9px] md:text-xs font-black uppercase tracking-[0.3em] mb-6"
                    >
                        <Library size={12} className="text-emerald-300" />
                        <span>الموسوعة الشاملة للسنة</span>
                    </motion.div>

                    <h2 className="text-3xl md:text-8xl font-black leading-tight mb-4 tracking-tighter">
                        <motion.span 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="block bg-gradient-to-b from-white via-white to-emerald-100 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                        >
                            كتب السنة النبوية
                        </motion.span>
                        <motion.span 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="block text-emerald-500/80 text-sm md:text-4xl mt-1 font-bold tracking-normal"
                        >
                            منبع الهدي والرحمة
                        </motion.span>
                    </h2>
                    
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 0.8 }}
                        className="text-emerald-50 max-w-2xl mx-auto text-xs md:text-xl leading-relaxed px-6 font-medium"
                    >
                        تصفح أمهات كتب الحديث النبوي الشريف، موثقة ومحققة لتكون مرجعك في كل وقت.
                    </motion.p>
                </motion.div>

                {loadingBooks ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="h-40 md:h-64 rounded-3xl bg-white/5 animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {books.map((book, index) => (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -5, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                key={book.id}
                                onClick={() => handleBookSelect(book)}
                                className="group relative overflow-hidden glass-panel border border-white/5 hover:border-emerald-500/40 p-5 md:p-10 rounded-2xl md:rounded-[3rem] text-right transition-all duration-500 flex flex-col justify-between h-full shadow-xl"
                            >
                                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>
                                
                                <div className="relative z-10 space-y-4 md:space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 md:p-4 bg-emerald-500/10 rounded-xl md:rounded-2xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-lg">
                                            <BookOpen size={20} className="md:w-8 md:h-8" />
                                        </div>
                                        <span className="bg-emerald-500/10 text-[8px] md:text-[10px] font-black text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/10 uppercase tracking-widest">
                                            {book.hadiths_count} حديث
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm md:text-2xl font-black text-white mb-1 md:mb-2 group-hover:text-emerald-400 transition-colors leading-tight">
                                            {BOOK_NAMES_AR[book.bookSlug] || book.bookName}
                                        </h3>
                                        <p className="text-[9px] md:text-xs text-gray-500 font-bold truncate opacity-60">
                                            {book.writerName}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- RENDER: HADITHS LIST ---
    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-6 md:space-y-10 overflow-x-hidden">
            
            {/* Sticky Header - Premium Glass */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-4 z-40 space-y-4"
            >
                <div className="glass-panel p-3 md:p-6 rounded-2xl md:rounded-[3rem] border border-white/5 flex items-center gap-3 md:gap-6 shadow-2xl">
                    <button 
                        onClick={handleBack}
                        className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl bg-white/5 hover:bg-emerald-500 hover:text-white flex items-center justify-center text-gray-400 transition-all duration-500 shadow-lg"
                    >
                        <ChevronLeft size={20} className="md:w-8 md:h-8" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-3xl font-black text-white truncate leading-tight">
                            {BOOK_NAMES_AR[selectedBook.bookSlug] || selectedBook.bookName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                            <div className="w-1 md:w-2 h-1 md:h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="text-[8px] md:text-xs text-emerald-500/60 font-black uppercase tracking-widest">{selectedBook.hadiths_count} حديث</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowEnglish(!showEnglish)}
                        className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl flex items-center justify-center transition-all duration-500 shadow-lg ${showEnglish ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <Languages size={20} className="md:w-8 md:h-8" />
                    </button>
                </div>

                {/* Search Bar - Modern */}
                <div className="relative group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/30 group-focus-within:text-emerald-400 transition-all duration-300" size={18} />
                    <input
                        type="text"
                        placeholder={`بحث في العنوان أو النص...`}
                        className="w-full bg-black/40 border border-white/5 rounded-xl md:rounded-3xl py-3 md:py-6 pr-11 pl-4 text-white text-xs md:text-xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-500 text-right shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </motion.div>

            {/* List */}
            <div className="space-y-4 md:space-y-8">
                {loadingHadiths ? (
                    <div className="py-20 text-center space-y-6">
                        <Loader2 className="animate-spin text-emerald-500 mx-auto" size={48} />
                        <p className="text-emerald-500/60 font-black text-xs md:text-lg uppercase tracking-widest animate-pulse">جاري تحميل الأحاديث...</p>
                    </div>
                ) : displayHadiths.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-20 text-center glass-panel rounded-3xl border border-white/5 border-dashed"
                    >
                        <Filter size={40} className="mx-auto text-gray-700 mb-4" />
                        <p className="text-gray-500 font-black text-sm md:text-xl">لا توجد نتائج مطابقة لبحثك</p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {displayHadiths.map((hadith, index) => {
                            const isLastElement = index === displayHadiths.length - 1;
                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (index % 10) * 0.05 }}
                                    key={hadith.id} 
                                    ref={isLastElement ? lastHadithElementRef : null}
                                    className="group glass-panel border border-white/5 hover:border-emerald-500/20 rounded-2xl md:rounded-[3rem] p-5 md:p-12 transition-all duration-500 relative overflow-hidden shadow-xl"
                                >
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    {/* Header Info */}
                                    <div className="flex items-center justify-between mb-6 md:mb-10">
                                        <div className="flex items-center gap-2 md:gap-4">
                                            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-[10px] md:text-sm font-black border border-emerald-500/10 uppercase tracking-widest shadow-sm">
                                                #{hadith.hadithNumber}
                                            </span>
                                            {hadith.status && (
                                                <span className={`px-3 py-1 rounded-lg text-[10px] md:text-sm font-black border transition-colors duration-500 ${hadith.status.toLowerCase().includes('sahih') ? 'bg-blue-500/10 text-blue-400 border-blue-500/10' : 'bg-gray-800/50 text-gray-500 border-white/5'}`}>
                                                    {hadith.status}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-700 font-bold">ID: {hadith.id}</span>
                                    </div>

                                    {/* Chapter Title */}
                                    {hadith.headingArabic && (
                                        <div className="mb-6 md:mb-10 p-4 md:p-8 bg-black/40 rounded-xl md:rounded-3xl border border-white/5 text-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-emerald-500/5 blur-3xl"></div>
                                            <p className="text-emerald-400 font-black text-xs md:text-2xl leading-relaxed relative z-10">
                                                {hadith.headingArabic}
                                            </p>
                                            {showEnglish && hadith.headingEnglish && (
                                                <p className="text-gray-500 text-[10px] md:text-lg mt-3 pt-3 border-t border-white/5 border-dashed font-sans ltr relative z-10">
                                                    {hadith.headingEnglish}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="space-y-6 md:space-y-12">
                                        <p className="text-base md:text-4xl text-white font-amiri leading-[2.2] md:leading-[1.8] text-justify selection:bg-emerald-500/30 dir-rtl font-medium">
                                            {hadith.hadithArabic.replace(/<[^>]*>?/gm, '')}
                                        </p>

                                        {showEnglish && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="pt-6 md:pt-12 border-t border-white/5 ltr text-left bg-black/20 -mx-5 md:-mx-12 px-5 md:px-12 pb-4 md:pb-8 mt-4"
                                            >
                                                {hadith.englishNarrator && (
                                                    <p className="text-[10px] md:text-base text-emerald-500 font-black mb-3 md:mb-6 uppercase tracking-widest">
                                                        Narrated {hadith.englishNarrator}:
                                                    </p>
                                                )}
                                                <p className="text-xs md:text-2xl text-gray-400 leading-relaxed font-sans font-medium">
                                                    {hadith.hadithEnglish.replace(/<[^>]*>?/gm, '')}
                                                </p>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex gap-3 justify-end mt-8 md:mt-12 pt-6 md:pt-10 border-t border-white/5">
                                        <button 
                                            onClick={() => handleCopy(hadith.hadithArabic, hadith.id)}
                                            className={`flex items-center gap-2 px-5 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-lg font-black transition-all duration-500 shadow-lg ${copiedId === hadith.id ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-emerald-500 hover:text-white'}`}
                                        >
                                            {copiedId === hadith.id ? <Check size={16} /> : <Copy size={16} />}
                                            {copiedId === hadith.id ? 'تم النسخ' : 'نسخ الحديث'}
                                        </button>
                                        <button 
                                            onClick={() => handleShare(hadith.hadithArabic, hadith.id)}
                                            className="p-2.5 md:p-5 rounded-xl md:rounded-2xl bg-white/5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-500 shadow-lg"
                                        >
                                            <Share2 size={18} className="md:w-6 md:h-6" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}

                {loadingMore && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-emerald-500" size={24} />
                    </div>
                )}
            </div>
        </div>
    );
};
