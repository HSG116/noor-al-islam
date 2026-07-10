
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Book, Share2, Copy, Loader2, Library, ChevronLeft, Check, Filter, BookOpen, Globe, Languages, Sparkles, Star, Award, Scroll, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_KEY = '$2y$10$Zb4gkUNhrmM0FYINPze6eslRXArEQA9j4sCNxTuPEtonHuLqhPu';
const BASE_URL = 'https://hadithapi.com/api';

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
    status: string;
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
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [loadingHadiths, setLoadingHadiths] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [showEnglish, setShowEnglish] = useState(false);
    const [expandedHadith, setExpandedHadith] = useState<number | null>(null);

    const observer = useRef<IntersectionObserver | null>(null);

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

    const normalizeArabic = (text: string) => {
        if (!text) return '';
        let clean = text.replace(/<[^>]*>?/gm, '');
        clean = clean
            .replace(/[\u064B-\u065F\u0670]/g, '')
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي');
        return clean.toLowerCase();
    };

    const processHadiths = (list: HadithData[]) => {
        let lastHeadingArabic = '';
        let lastHeadingEnglish = '';
        return list.map(item => {
            if (item.headingArabic && item.headingArabic.trim().length > 0) {
                lastHeadingArabic = item.headingArabic;
                lastHeadingEnglish = item.headingEnglish || '';
                return item;
            } else {
                return { ...item, headingArabic: lastHeadingArabic, headingEnglish: lastHeadingEnglish };
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

    const getStatusColor = (status: string) => {
        if (!status) return 'bg-gray-800/50 text-gray-500 border-white/5';
        if (status.toLowerCase().includes('sahih')) return 'bg-blue-500/10 text-blue-400 border-blue-500/10';
        if (status.toLowerCase().includes('hasan')) return 'bg-green-500/10 text-green-400 border-green-500/10';
        if (status.toLowerCase().includes('daif')) return 'bg-orange-500/10 text-orange-400 border-orange-500/10';
        if (status.toLowerCase().includes('mawdu')) return 'bg-red-500/10 text-red-400 border-red-500/10';
        return 'bg-gray-800/50 text-gray-500 border-white/5';
    };

    if (!selectedBook) {
        return (
            <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-20 space-y-8 md:space-y-16 overflow-x-hidden">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center relative"
                >
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/5 blur-[150px] rounded-full -z-10"></div>

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/10 text-emerald-400 text-[10px] md:text-xs font-black uppercase mb-6 shadow-lg"
                    >
                        <Scroll size={14} className="text-emerald-300" />
                        <span>الموسوعة الشاملة للسنة النبوية</span>
                    </motion.div>

                    <h2 className="text-4xl md:text-8xl font-black leading-tight mb-4 tracking-tighter">
                        <motion.span 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="block bg-gradient-to-b from-white via-white to-emerald-100 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                        >
                            المكتبة الحديثية
                        </motion.span>
                        <motion.span 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="block text-emerald-500/80 text-sm md:text-3xl mt-2 font-bold tracking-normal"
                        >
                            منبع الهدي والرحمة والسنن المطهرة
                        </motion.span>
                    </h2>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        transition={{ delay: 0.8 }}
                        className="text-emerald-50/70 max-w-2xl mx-auto text-xs md:text-lg leading-relaxed px-6 font-medium"
                    >
                        تصفح أمهات كتب الحديث النبوي الشريف، موثقة ومحققة لتكون مرجعك في كل وقت وحين
                    </motion.p>
                </motion.div>

                {loadingBooks ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="h-48 md:h-72 rounded-3xl bg-white/5 animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {books.map((book, index) => {
                            const nameAr = BOOK_NAMES_AR[book.bookSlug] || book.bookName;
                            const initials = nameAr.split(' ').slice(0, 2).map(w => w[0]).join('');
                            return (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: index * 0.04, type: "spring", stiffness: 150 }}
                                    whileHover={{ y: -8, scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    key={book.id}
                                    onClick={() => handleBookSelect(book)}
                                    className="group relative overflow-hidden glass-panel border border-white/5 hover:border-emerald-500/40 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] text-right transition-all duration-500 flex flex-col justify-between h-full shadow-xl"
                                >
                                    <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/15 group-hover:scale-150 transition-all duration-700"></div>
                                    <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/15 transition-all duration-700"></div>
                                    
                                    <div className="relative z-10 space-y-4 md:space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:text-white transition-all duration-500 shadow-lg border border-emerald-500/10 group-hover:border-transparent">
                                                <BookOpen size={22} className="md:w-8 md:h-8" />
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-[8px] md:text-[10px] font-black text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                                                    {parseInt(book.hadiths_count).toLocaleString()} حديث
                                                </span>
                                                {book.chapters_count && (
                                                    <span className="text-[7px] md:text-[9px] text-gray-600 font-bold">
                                                        {book.chapters_count} باب
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-base md:text-xl font-black text-white mb-1 group-hover:text-emerald-400 transition-colors leading-tight">
                                                {nameAr}
                                            </h3>
                                            <p className="text-[9px] md:text-xs text-gray-500 font-bold truncate opacity-70">
                                                {book.writerName}
                                            </p>
                                            {book.writerDeath && (
                                                <p className="text-[7px] md:text-[10px] text-gray-700 font-medium mt-0.5">
                                                    توفي {book.writerDeath}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[8px] md:text-[10px] text-gray-600 font-bold">اضغط للتصفح</span>
                                        <div className="w-7 h-7 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all group-hover:rotate-[-10deg]">
                                            <ChevronLeft size={14} className="md:w-5 md:h-5" />
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-6 md:space-y-10 overflow-x-hidden">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-4 z-40 space-y-4"
            >
                <div className="glass-panel p-3 md:p-5 rounded-2xl md:rounded-[2rem] border border-white/5 flex items-center gap-3 md:gap-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
                    <button 
                        onClick={handleBack}
                        className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 hover:bg-emerald-500 hover:text-white flex items-center justify-center text-gray-400 transition-all duration-500 shadow-lg relative z-10"
                    >
                        <ChevronLeft size={20} className="md:w-7 md:h-7" />
                    </button>
                    <div className="flex-1 min-w-0 relative z-10">
                        <h3 className="text-sm md:text-2xl font-black text-white truncate leading-tight">
                            {BOOK_NAMES_AR[selectedBook.bookSlug] || selectedBook.bookName}
                        </h3>
                        <div className="flex items-center gap-3 mt-0.5 md:mt-1">
                            <div className="w-1.5 md:w-2.5 h-1.5 md:h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <p className="text-[8px] md:text-xs text-emerald-500/60 font-black uppercase">{selectedBook.hadiths_count} حديث · {selectedBook.chapters_count} باب</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowEnglish(!showEnglish)}
                        className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg relative z-10 ${showEnglish ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <Languages size={20} className="md:w-7 md:h-7" />
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/30 group-focus-within:text-emerald-400 transition-all duration-300" size={18} />
                    <input
                        type="text"
                        placeholder="ابحث في متن الحديث أو العنوان..."
                        className="w-full bg-black/40 border border-white/5 rounded-2xl md:rounded-3xl py-3 md:py-5 pr-12 pl-4 text-white text-xs md:text-lg font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-500 text-right shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </motion.div>

            <div className="space-y-4 md:space-y-6">
                {loadingHadiths ? (
                    <div className="py-20 text-center space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <Loader2 className="animate-spin text-emerald-500 mx-auto" size={48} />
                        </div>
                        <p className="text-emerald-500/60 font-black text-xs md:text-lg uppercase animate-pulse">جاري تحميل الأحاديث...</p>
                    </div>
                ) : displayHadiths.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-20 text-center glass-panel rounded-3xl border border-white/5 border-dashed"
                    >
                        <div className="inline-flex p-8 bg-white/5 rounded-full text-gray-700 mb-6 shadow-inner">
                            <Filter size={48} />
                        </div>
                        <p className="text-gray-500 font-black text-sm md:text-xl">لا توجد نتائج مطابقة لبحثك</p>
                        <p className="text-gray-700 text-xs md:text-sm mt-2 font-bold">جرب كلمات بحث أخرى</p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {displayHadiths.map((hadith, index) => {
                            const isLastElement = index === displayHadiths.length - 1;
                            const isExpanded = expandedHadith === hadith.id;
                            const gradeColor = getStatusColor(hadith.status);
                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (index % 10) * 0.04 }}
                                    key={hadith.id} 
                                    ref={isLastElement ? lastHadithElementRef : null}
                                    className="group glass-panel border border-white/5 hover:border-emerald-500/20 rounded-2xl md:rounded-[2.5rem] p-5 md:p-10 transition-all duration-500 relative overflow-hidden shadow-xl"
                                >
                                    <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    <div className="flex items-center justify-between mb-4 md:mb-6">
                                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                            <span className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 px-3 py-1 rounded-lg text-[10px] md:text-sm font-black border border-emerald-500/10 shadow-sm">
                                                #{hadith.hadithNumber}
                                            </span>
                                            {hadith.status && (
                                                <span className={`px-3 py-1 rounded-lg text-[10px] md:text-sm font-black border ${gradeColor}`}>
                                                    {hadith.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Quote size={14} className="text-emerald-500/20" />
                                            <span className="text-[9px] font-mono text-gray-700 font-bold">ID: {hadith.id}</span>
                                        </div>
                                    </div>

                                    {hadith.headingArabic && (
                                        <div className="mb-4 md:mb-6 p-4 md:p-6 bg-gradient-to-l from-emerald-500/5 to-transparent rounded-xl md:rounded-2xl border-r-4 border-emerald-500/30 text-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-emerald-500/5 blur-3xl"></div>
                                            <p className="text-emerald-400 font-black text-xs md:text-xl leading-relaxed relative z-10">
                                                {hadith.headingArabic}
                                            </p>
                                            {showEnglish && hadith.headingEnglish && (
                                                <p className="text-gray-500 text-[10px] md:text-base mt-2 pt-2 border-t border-white/5 border-dashed font-sans ltr relative z-10">
                                                    {hadith.headingEnglish}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div 
                                        onClick={() => setExpandedHadith(isExpanded ? null : hadith.id)}
                                        className="cursor-pointer"
                                    >
                                        <div className={`space-y-4 md:space-y-6 transition-all duration-500 ${!isExpanded ? 'max-h-[200px] md:max-h-[280px] overflow-hidden relative' : ''}`}>
                                            {!isExpanded && (
                                                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#0f172a] to-transparent z-10 pointer-events-none"></div>
                                            )}
                                            <p className="text-base md:text-3xl text-white font-amiri leading-[2.2] md:leading-[2] text-justify selection:bg-emerald-500/30 dir-rtl font-medium">
                                                {hadith.hadithArabic.replace(/<[^>]*>?/gm, '')}
                                            </p>

                                            {showEnglish && (
                                                <motion.div 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="pt-4 md:pt-8 border-t border-white/5 ltr text-left bg-black/20 -mx-5 md:-mx-10 px-5 md:px-10 pb-3 md:pb-6 mt-3 rounded-2xl"
                                                >
                                                    {hadith.englishNarrator && (
                                                        <p className="text-[10px] md:text-sm text-emerald-500 font-black mb-2 md:mb-4 uppercase tracking-widest">
                                                            Narrated {hadith.englishNarrator}:
                                                        </p>
                                                    )}
                                                    <p className="text-xs md:text-xl text-gray-400 leading-relaxed font-sans font-medium">
                                                        {hadith.hadithEnglish.replace(/<[^>]*>?/gm, '')}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 md:gap-3 justify-end mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/5">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleCopy(hadith.hadithArabic, hadith.id); }}
                                            className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-base font-black transition-all duration-500 shadow-lg ${copiedId === hadith.id ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-emerald-500 hover:text-white'}`}
                                        >
                                            {copiedId === hadith.id ? <Check size={14} className="md:w-5 md:h-5" /> : <Copy size={14} className="md:w-5 md:h-5" />}
                                            {copiedId === hadith.id ? 'تم النسخ' : 'نسخ الحديث'}
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleShare(hadith.hadithArabic, hadith.id); }}
                                            className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-500 shadow-lg"
                                        >
                                            <Share2 size={16} className="md:w-5 md:h-5" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setExpandedHadith(isExpanded ? null : hadith.id); }}
                                            className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all duration-500 shadow-lg ${isExpanded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                        >
                                            <span className="text-[10px] md:text-sm font-black">{isExpanded ? 'إخفاء' : 'عرض الكل'}</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}

                {loadingMore && (
                    <div className="flex justify-center py-6">
                        <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 shadow-lg">
                            <Loader2 className="animate-spin text-emerald-500" size={20} />
                            <span className="text-[10px] font-black text-gray-400 uppercase">جاري تحميل المزيد...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
