
import React, { useState, useMemo } from 'react';
import { FATAWA_DATA, Fatwa } from '../data/fatawaData';
import { Search, ChevronDown, HelpCircle, BookOpen, X, Sparkles, Share2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FatwaLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(FATAWA_DATA.map(f => f.category));
    return Array.from(cats);
  }, []);

  const filteredFatawa = useMemo(() => {
    return FATAWA_DATA.filter(f => {
      const matchesSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           f.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || f.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCopy = (fatwa: Fatwa) => {
    navigator.clipboard.writeText(`${fatwa.question}\n\nالجواب: ${fatwa.answer}`);
    setCopiedId(fatwa.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-20 space-y-6 md:space-y-20 overflow-x-hidden">
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
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mx-auto mb-6 shadow-lg"
        >
          <Sparkles size={14} className="animate-pulse text-emerald-300" />
          <span>موسوعة الأحكام الموثقة</span>
        </motion.div>

        <h2 className="text-3xl md:text-8xl font-black leading-tight mb-6 tracking-tighter">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="block bg-gradient-to-b from-white via-white to-emerald-100 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            موسوعة الأحكام
          </motion.span>
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="block text-emerald-500/80 text-sm md:text-4xl mt-1 font-bold tracking-normal"
          >
            دليلك الفقهي الميسر والموثق
          </motion.span>
        </h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
          className="text-gray-300 max-w-2xl mx-auto text-xs md:text-xl leading-relaxed px-4 font-medium"
        >
          أكثر من 200 سؤال وجواب في أحكام الصيام والعبادات، موثقة ومبسطة بأسلوب عصري يجمع بين الأصالة والمعاصرة.
        </motion.p>
      </motion.div>

      {/* Search and Filter Bar - Ultra Premium */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-30"
      >
        <div className="glass-panel p-4 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 shadow-2xl space-y-6 md:space-y-10">
          <div className="relative group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500/30 group-focus-within:text-emerald-400 transition-all duration-300" size={22} />
            <input
              type="text"
              placeholder="ابحث عن حكم شرعي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl md:rounded-3xl py-4 md:py-8 pr-14 pl-6 text-white text-sm md:text-2xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-500 text-right shadow-inner"
            />
          </div>
          
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 touch-pan-x">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-3 rounded-xl md:rounded-2xl font-black whitespace-nowrap transition-all duration-500 text-[10px] md:text-lg border shadow-lg ${!selectedCategory ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/5 text-gray-600 hover:bg-white/10 hover:text-gray-400'}`}
            >
              جميع الأقسام
            </motion.button>
            {categories.map(cat => (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-xl md:rounded-2xl font-black whitespace-nowrap transition-all duration-500 text-[10px] md:text-lg border shadow-lg ${selectedCategory === cat ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/5 text-gray-600 hover:bg-white/10 hover:text-gray-400'}`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-[9px] md:text-xs text-gray-600 px-4 font-black uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          <span>{filteredFatawa.length} حكماً</span>
        </div>
        {selectedCategory && <span className="text-emerald-500/60">{selectedCategory}</span>}
      </div>

      {/* Fatawa List - Ultra Premium Cards */}
      <div className="grid grid-cols-1 gap-4 md:gap-10">
        <AnimatePresence mode="popLayout">
          {filteredFatawa.length > 0 ? (
            filteredFatawa.map((fatwa, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: (index % 20) * 0.03 }}
                whileHover={{ y: -5, scale: 1.01 }}
                key={fatwa.id}
                className={`group relative glass-panel rounded-[2rem] md:rounded-[3.5rem] border transition-all duration-500 ${expandedId === fatwa.id ? 'border-emerald-500/40 bg-emerald-500/5 shadow-2xl' : 'border-white/5 hover:border-white/20 shadow-xl'}`}
              >
                <button 
                  onClick={() => toggleExpand(fatwa.id)}
                  className="w-full p-6 md:p-16 text-right flex items-start gap-4 md:gap-12"
                >
                  <div className={`mt-1 p-3 md:p-8 rounded-2xl md:rounded-[2.5rem] transition-all duration-500 shadow-lg ${expandedId === fatwa.id ? 'bg-emerald-500 text-white rotate-6' : 'bg-white/5 text-emerald-500 group-hover:bg-emerald-500/20'}`}>
                    <HelpCircle size={20} className="md:w-10 md:h-10" />
                  </div>
                  <div className="flex-1 space-y-2 md:space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[8px] md:text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                        {fatwa.category}
                      </span>
                      <span className="text-[10px] md:text-sm font-mono text-gray-700 font-bold">#{fatwa.id.toString().padStart(3, '0')}</span>
                    </div>
                    <h3 className={`text-sm md:text-4xl font-black leading-tight transition-colors duration-500 ${expandedId === fatwa.id ? 'text-emerald-300' : 'text-white'}`}>
                      {fatwa.question}
                    </h3>
                  </div>
                  <div className={`mt-3 p-2 md:p-5 rounded-full bg-white/5 transition-all duration-500 shadow-lg ${expandedId === fatwa.id ? 'rotate-180 bg-emerald-500/20 text-emerald-400' : 'text-gray-700 group-hover:text-gray-400'}`}>
                    <ChevronDown size={16} className="md:w-10 md:h-10" />
                  </div>
                </button>
                
                <AnimatePresence>
                  {expandedId === fatwa.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-16 pb-10 md:pb-20 pt-0">
                        <div className="bg-black/40 rounded-[2rem] md:rounded-[4rem] p-6 md:p-16 border border-white/5 relative overflow-hidden shadow-inner">
                          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-emerald-600 to-teal-600"></div>
                          <div className="flex flex-col md:flex-row items-start gap-6 md:gap-16">
                            <div className="hidden md:flex p-8 bg-emerald-500/10 rounded-[2.5rem] text-emerald-400 shrink-0 shadow-2xl border border-emerald-500/20">
                              <BookOpen size={40} />
                            </div>
                            <div className="space-y-6 md:space-y-12 flex-1">
                              <div className="flex items-center gap-3 text-emerald-500/60 md:hidden">
                                <BookOpen size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">الجواب الشرعي المعتمد</span>
                              </div>
                              <p className="text-gray-200 leading-relaxed text-xs md:text-3xl font-medium font-sans">
                                {fatwa.answer}
                              </p>
                              <div className="pt-6 md:pt-12 flex flex-wrap items-center gap-4 border-t border-white/5">
                                 <motion.button 
                                   whileHover={{ scale: 1.05 }}
                                   whileTap={{ scale: 0.95 }}
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleCopy(fatwa);
                                   }}
                                   className={`flex items-center gap-2 px-6 py-3 md:px-10 md:py-5 rounded-xl md:rounded-2xl transition-all duration-500 text-[10px] md:text-xl font-black shadow-lg ${copiedId === fatwa.id ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                                 >
                                   {copiedId === fatwa.id ? <Check size={16} className="md:w-6 md:h-6" /> : <Copy size={16} className="md:w-6 md:h-6" />}
                                   {copiedId === fatwa.id ? 'تم النسخ' : 'نسخ الفتوى'}
                                 </motion.button>
                                 <motion.button 
                                   whileHover={{ scale: 1.05 }}
                                   whileTap={{ scale: 0.95 }}
                                   className="flex items-center gap-2 px-6 py-3 md:px-10 md:py-5 rounded-xl md:rounded-2xl bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white transition-all duration-500 text-[10px] md:text-xl font-black shadow-lg"
                                 >
                                   <Share2 size={16} className="md:w-6 md:h-6" />
                                   مشاركة
                                 </motion.button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-40 glass-panel rounded-[3rem] md:rounded-[5rem] border border-white/5 shadow-2xl"
            >
              <div className="inline-flex p-12 bg-white/5 rounded-full text-gray-700 mb-8 shadow-inner">
                <Search size={80} />
              </div>
              <h3 className="text-2xl md:text-5xl font-black text-white mb-6">لا توجد نتائج مطابقة</h3>
              <p className="text-gray-500 text-xs md:text-2xl font-bold max-w-md mx-auto">جرب البحث بكلمات أخرى أو تغيير التصنيف للوصول إلى الحكم المطلوب</p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {setSearchQuery(''); setSelectedCategory(null);}}
                className="mt-12 px-10 py-5 bg-emerald-600 text-white rounded-2xl md:rounded-3xl font-black hover:bg-emerald-500 transition-all duration-500 shadow-2xl shadow-emerald-900/40 text-sm md:text-xl uppercase tracking-widest"
              >
                إعادة ضبط البحث
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="text-center py-20 border-t border-white/5"
      >
        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          هذه الأحكام مستمدة من المصادر الفقهية المعتمدة وتراعي التيسير في الفتوى. نرجو دائماً مراجعة أهل العلم في المسائل الخاصة.
        </p>
      </motion.div>
    </div>
  );
};
