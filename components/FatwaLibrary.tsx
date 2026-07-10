
import React, { useState, useMemo } from 'react';
import { FATAWA_DATA, Fatwa } from '../data/fatawaData';
import { Search, ChevronDown, HelpCircle, BookOpen, X, Sparkles, Share2, Copy, Check, Scale, Gavel, Quote } from 'lucide-react';
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
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-20 space-y-6 md:space-y-16 overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-center relative"
      >
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/5 blur-[120px] rounded-full -z-10"></div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-black uppercase mx-auto mb-6 shadow-lg"
        >
          <Scale size={14} className="animate-pulse text-emerald-300" />
          <span>موسوعة الأحكام والفتاوى الموثقة</span>
        </motion.div>

        <h2 className="text-3xl md:text-8xl font-black leading-tight mb-4 tracking-tighter">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="block bg-gradient-to-b from-white via-white to-emerald-100 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            الأحكام الشائعة
          </motion.span>
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="block text-emerald-500/80 text-sm md:text-3xl mt-2 font-bold tracking-normal"
          >
            دليلك الفقهي الميسر والموثق
          </motion.span>
        </h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
          className="text-gray-300 max-w-2xl mx-auto text-xs md:text-lg leading-relaxed px-4 font-medium"
        >
          أكثر من 200 سؤال وجواب في الأحكام الشرعية، موثقة ومبسطة بأسلوب عصري يجمع بين الأصالة والمعاصرة
        </motion.p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-30"
      >
        <div className="glass-panel p-4 md:p-10 rounded-2xl md:rounded-[2.5rem] border border-white/5 shadow-2xl space-y-5 md:space-y-8">
          <div className="relative group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500/30 group-focus-within:text-emerald-400 transition-all duration-300" size={20} />
            <input
              type="text"
              placeholder="ابحث عن حكم شرعي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl md:rounded-3xl py-4 md:py-6 pr-14 pl-6 text-white text-sm md:text-xl font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-500 text-right shadow-inner"
            />
          </div>
          
          <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1 touch-pan-x">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(null)}
              className={`px-5 py-2.5 rounded-xl md:rounded-2xl font-black whitespace-nowrap transition-all duration-500 text-[10px] md:text-base border shadow-lg ${!selectedCategory ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'}`}
            >
              جميع الأقسام
            </motion.button>
            {categories.map(cat => (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl md:rounded-2xl font-black whitespace-nowrap transition-all duration-500 text-[10px] md:text-base border shadow-lg ${selectedCategory === cat ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'}`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="flex items-center justify-between text-[9px] md:text-xs text-gray-600 px-2 font-black uppercase">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          <span>{filteredFatawa.length} حكماً شرعياً</span>
        </div>
        {selectedCategory && (
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-500/60">{selectedCategory}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredFatawa.length > 0 ? (
            filteredFatawa.map((fatwa, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: (index % 20) * 0.03 }}
                whileHover={{ y: -3, scale: 1.005 }}
                key={fatwa.id}
                className={`group relative glass-panel rounded-[2rem] md:rounded-[3rem] border transition-all duration-500 ${expandedId === fatwa.id ? 'border-emerald-500/40 bg-emerald-500/5 shadow-2xl shadow-emerald-500/5' : 'border-white/5 hover:border-white/20 shadow-xl'}`}
              >
                <button 
                  onClick={() => toggleExpand(fatwa.id)}
                  className="w-full p-5 md:p-14 text-right flex items-start gap-3 md:gap-10"
                >
                  <div className={`mt-1 p-3 md:p-6 rounded-2xl md:rounded-[2rem] transition-all duration-500 shadow-lg shrink-0 ${expandedId === fatwa.id ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rotate-6 scale-110' : 'bg-white/5 text-emerald-500 group-hover:bg-emerald-500/20'}`}>
                    <HelpCircle size={18} className="md:w-8 md:h-8" />
                  </div>
                  <div className="flex-1 space-y-2 md:space-y-4">
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                      <span className="text-[8px] md:text-xs font-black text-emerald-400 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase">
                        {fatwa.category}
                      </span>
                      <span className="text-[9px] md:text-sm font-mono text-gray-700 font-bold">#{fatwa.id.toString().padStart(3, '0')}</span>
                    </div>
                    <h3 className={`text-sm md:text-3xl font-black leading-tight transition-colors duration-500 ${expandedId === fatwa.id ? 'text-emerald-300' : 'text-white'}`}>
                      {fatwa.question}
                    </h3>
                  </div>
                  <div className={`mt-2 p-2 md:p-4 rounded-full bg-white/5 transition-all duration-500 shadow-lg shrink-0 ${expandedId === fatwa.id ? 'rotate-180 bg-emerald-500/20 text-emerald-400' : 'text-gray-700 group-hover:text-gray-400'}`}>
                    <ChevronDown size={14} className="md:w-8 md:h-8" />
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
                      <div className="px-5 md:px-14 pb-8 md:pb-16 pt-0">
                        <div className="bg-gradient-to-br from-black/40 to-black/20 rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-14 border border-white/5 relative overflow-hidden shadow-inner">
                          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-emerald-600 to-teal-600"></div>
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full"></div>
                          <div className="flex flex-col md:flex-row items-start gap-5 md:gap-14">
                            <div className="hidden md:flex p-6 md:p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-[2.5rem] text-emerald-400 shrink-0 shadow-2xl border border-emerald-500/20">
                              <Gavel size={36} />
                            </div>
                            <div className="space-y-5 md:space-y-10 flex-1 relative z-10">
                              <div className="flex items-center gap-3 text-emerald-500/60 md:hidden">
                                <BookOpen size={16} />
                                <span className="text-[10px] font-black uppercase">الجواب الشرعي المعتمد</span>
                              </div>
                              <div className="relative pr-4 md:pr-8">
                                <Quote size={20} className="absolute top-0 right-0 text-emerald-500/10" />
                                <p className="text-gray-200 leading-relaxed text-xs md:text-2xl font-medium font-sans pt-4">
                                  {fatwa.answer}
                                </p>
                              </div>
                              <div className="pt-5 md:pt-10 flex flex-wrap items-center gap-3 md:gap-4 border-t border-white/5">
                                 <motion.button 
                                   whileHover={{ scale: 1.05 }}
                                   whileTap={{ scale: 0.95 }}
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleCopy(fatwa);
                                   }}
                                   className={`flex items-center gap-2 px-5 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl transition-all duration-500 text-[10px] md:text-lg font-black shadow-lg ${copiedId === fatwa.id ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 hover:from-emerald-500 hover:to-teal-500 hover:text-white'}`}
                                 >
                                   {copiedId === fatwa.id ? <Check size={16} className="md:w-5 md:h-5" /> : <Copy size={16} className="md:w-5 md:h-5" />}
                                   {copiedId === fatwa.id ? 'تم النسخ' : 'نسخ الفتوى'}
                                 </motion.button>
                                 <motion.button 
                                   whileHover={{ scale: 1.05 }}
                                   whileTap={{ scale: 0.95 }}
                                   className="flex items-center gap-2 px-5 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white transition-all duration-500 text-[10px] md:text-lg font-black shadow-lg"
                                 >
                                   <Share2 size={16} className="md:w-5 md:h-5" />
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
              className="text-center py-32 glass-panel rounded-[3rem] md:rounded-[5rem] border border-white/5 shadow-2xl"
            >
              <div className="inline-flex p-10 bg-white/5 rounded-full text-gray-700 mb-6 shadow-inner">
                <Search size={64} />
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-white mb-4">لا توجد نتائج مطابقة</h3>
              <p className="text-gray-500 text-xs md:text-xl font-bold max-w-md mx-auto">جرب البحث بكلمات أخرى أو تغيير التصنيف للوصول إلى الحكم المطلوب</p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {setSearchQuery(''); setSelectedCategory(null);}}
                className="mt-10 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl md:rounded-3xl font-black hover:from-emerald-500 hover:to-teal-500 transition-all duration-500 shadow-2xl shadow-emerald-900/40 text-sm md:text-xl uppercase"
              >
                إعادة ضبط البحث
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="text-center py-16 border-t border-white/5"
      >
        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          هذه الأحكام مستمدة من المصادر الفقهية المعتمدة وتراعي التيسير في الفتوى. نرجو دائماً مراجعة أهل العلم في المسائل الخاصة.
        </p>
      </motion.div>
    </div>
  );
};
