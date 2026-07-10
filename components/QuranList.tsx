import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { fetchSurahs, fetchPageContent, getSurahForPage, getAyahAudioUrl, fetchTafseer, RECITERS, TAFSEER_EDITIONS, SURAH_START_PAGES } from '../services/quranService';
import { plannerService } from '../services/plannerService'; 
import { progressService } from '../services/progressService';
import { Surah, UserProgress } from '../types';
import { Search, ChevronLeft, ChevronRight, CheckCircle, Book, Play, Circle, Loader2, Pause, Type, BookOpen, Zap, Settings2, X, Minus, Plus, MoveDown, Repeat, BookOpenCheck, ArrowRight, Copy, Bookmark, BookmarkCheck, List, ArrowUpToLine, Check, Clock, Timer, Trophy, Sparkles, BadgeCheck } from 'lucide-react';
import { syncService } from '../services/syncService';
import { challengeService } from '../services/challengeService';

interface QuranListProps {
  onSelectSurah: (surah: Surah, pageNum?: number) => void;
  session: any;
  onBack: () => void;
}

const LOGO_URL = "https://iili.io/fkA4vvj.png";

export const QuranList: React.FC<QuranListProps> = ({ onSelectSurah, session, onBack }) => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<Surah[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [khatmaProgress, setKhatmaProgress] = useState<any>(null);

  useEffect(() => {
    // Load from cache immediately (synchronous) — no spinner
    let cachedLoaded = false;
    try {
      const cached = localStorage.getItem('quran_surahs');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSurahs(parsed);
          setFilteredSurahs(parsed);
          setLoading(false);
          cachedLoaded = true;
        }
      }
    } catch {}

    let mounted = true;
    const loadData = async () => {
      if (!cachedLoaded) setLoading(true);
      const [data, progress] = await Promise.all([
        fetchSurahs(),
        progressService.getAll(session?.user?.id),
      ]);
      if (!mounted) return;
      setSurahs(data);
      setFilteredSurahs(data);
      setUserProgress(progress);

      if (session?.user) {
        try {
          const active = await challengeService.getUserActiveChallenges(session.user.id);
          if (!mounted) return;
          const khatma = active?.find(c => c.challenge_details?.category === 'khatma');
          if (khatma && khatma.challenge_details) {
            setKhatmaProgress({
              id: khatma.id,
              title: khatma.challenge_details.title,
              done: khatma.pages_completed,
              total: khatma.challenge_details.total_pages,
              days: khatma.challenge_details.days_duration,
              reward: khatma.challenge_details.points_reward,
              start: khatma.start_date,
            });
          } else {
            setKhatmaProgress(null);
          }
        } catch (e) {
          console.error('Failed to load challenge:', e);
          setKhatmaProgress(null);
        }
      }
      setLoading(false);
    };
    loadData();
    return () => { mounted = false; };
  }, [session]);

  const stripDiacritics = (s: string) => s.replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED\u08D0-\u08E3]/g, '');

  const JUZ_START_PAGES = [0, 1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
  const JUZ_NAMES = [
    '', 'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس',
    'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه',
    'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم'
  ];
  const JUZ_FAMOUS_NAMES: Record<string, number> = {
    'الم': 1, 'سيقول': 2, 'تلك الرسل': 3, 'لن تنالوا': 4, 'والمحصنات': 5,
    'لا يحب الله': 6, 'وإذا سمعوا': 7, 'ولو أننا': 8, 'قال الملأ': 9, 'واعلموا': 10,
    'يعتذرون': 11, 'وما من دابة': 12, 'وما أبرئ': 13, 'ربما': 14, 'سبحان': 15,
    'قال ألم': 16, 'اقترب': 17, 'قد أفلح': 18, 'وقال الذين': 19, 'أمن خلق': 20,
    'اتل ما أوحي': 21, 'ومن يقنت': 22, 'وما لي': 23, 'فمن أظلم': 24, 'إليه يرد': 25,
    'حم': 26, 'قال فما خطبكم': 27, 'قد سمع': 28, 'تبارك': 29, 'عم': 30,
  };

  const getSurahPageEnd = (i: number) => (i < 113 ? SURAH_START_PAGES[i + 1] - 1 : 604);

  const getSurahJuz = (i: number) => {
    const s = SURAH_START_PAGES[i], e = getSurahPageEnd(i);
    for (let j = 1; j <= 30; j++) {
      const js = JUZ_START_PAGES[j], je = j < 30 ? JUZ_START_PAGES[j + 1] - 1 : 604;
      if (s <= je && e >= js) return j;
    }
    return 1;
  };

  const [filterLabel, setFilterLabel] = useState<string | null>(null);

  const normalizeTerm = (s: string) => s.normalize('NFC').replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');

  useEffect(() => {
    const raw = searchTerm.trim();
    const term = normalizeTerm(raw);
    const bare = stripDiacritics(term);
    if (!term) { setFilteredSurahs(surahs); setFilterLabel(null); return; }

    let label: string | null = null;
    let filtered = surahs;

    // مكية / مدنية — only if text is a prefix of the actual words
    if (bare.length >= 2 && ('مكية'.startsWith(bare) || 'مكيه'.startsWith(bare) || 'مكى'.startsWith(bare))) {
      filtered = surahs.filter(s => s.revelationType === 'Meccan');
      label = 'السور المكية';
    } else if (bare.length >= 2 && ('مدنية'.startsWith(bare) || 'مدنيه'.startsWith(bare))) {
      filtered = surahs.filter(s => s.revelationType === 'Medinan');
      label = 'السور المدنية';
    }
    // جزء X — search by number or famous name
    else if (bare.length >= 2 && (bare.startsWith('جزء') || Object.keys(JUZ_FAMOUS_NAMES).some(n => bare.includes(n) || n.includes(bare)))) {
      let searchRaw = bare;
      if (bare.startsWith('جزء')) searchRaw = bare.replace('جزء', '').trim();
      const searchClean = searchRaw.replace(/^ال/, '');
      let juzNum = 0;
      const nums = searchRaw.match(/[٠-٩0-9]+/);
      if (nums) {
        juzNum = parseInt(nums[0].replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c).toString()), 10);
      }
      if (!juzNum) {
        for (const [name, num] of Object.entries(JUZ_FAMOUS_NAMES)) {
          const nameClean = name.replace(/\s/g, '');
          if (nameClean.includes(searchClean) || searchClean.includes(nameClean)) {
            juzNum = num;
            break;
          }
        }
      }
      if (juzNum >= 1 && juzNum <= 30) {
        const js = JUZ_START_PAGES[juzNum], je = juzNum < 30 ? JUZ_START_PAGES[juzNum + 1] - 1 : 604;
        filtered = surahs.filter((_, i) => SURAH_START_PAGES[i] <= je && getSurahPageEnd(i) >= js);
        const famousName = Object.entries(JUZ_FAMOUS_NAMES).find(([, n]) => n === juzNum)?.[0] || '';
        label = famousName ? `جزء ${famousName}` : `الجزء ${juzNum}`;
      } else {
        const js = JUZ_START_PAGES[1], je = JUZ_START_PAGES[2] - 1;
        filtered = surahs.filter((_, i) => SURAH_START_PAGES[i] <= je && getSurahPageEnd(i) >= js);
        label = 'الجزء الأول';
      }
    }
    // Pure number or (صفحة|ص) + number
    else if (/^\d+$/.test(term) || /^ص(فحة)?\s*\d+$/i.test(bare)) {
      const num = parseInt((term.match(/\d+/) || ['0'])[0], 10);
      if (num >= 1 && num <= 604) {
        filtered = surahs.filter((_, i) => SURAH_START_PAGES[i] <= num && getSurahPageEnd(i) >= num);
        label = `صفحة ${num}`;
      }
    }
    // سورة + number
    else if (/^س(ورة)?\s*\d+$/i.test(bare)) {
      const num = parseInt(bare.match(/\d+/)?.[0] || '0', 10);
      const surah = surahs.find(s => s.number === num);
      if (surah) {
        filtered = [surah];
        label = `سورة ${surah.number}`;
      }
    }
    // Text search
    else {
      filtered = surahs.filter(s =>
        stripDiacritics(s.name).includes(bare) ||
        s.englishName.toLowerCase().includes(bare) ||
        (s.englishNameTranslation && s.englishNameTranslation.toLowerCase().includes(bare))
      );
    }

    setFilteredSurahs(filtered);
    setFilterLabel(filtered.length > 0 && filtered.length < surahs.length ? label : null);
  }, [searchTerm, surahs]);

  const getStatus = (surahNumber: number) => {
    const p = userProgress.find(up => up.surah_id === surahNumber);
    return p?.status || 'not_started';
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 px-4 md:px-6">
      {/* --- PREMIUM HERO HEADER --- */}
      <div className="relative pt-6 pb-10 text-center animate-in fade-in zoom-in duration-1000">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 to-transparent rounded-full scale-110 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase mx-auto mb-2">
            <span>كتاب الله المسطور</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black premium-text-gradient font-quran leading-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              المصحف الشريف
            </h1>
            <p className="font-quran text-lg md:text-3xl text-emerald-100/40 opacity-80">
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 opacity-60">
             <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-emerald-500/40"></div>
             <p className="text-gray-400 text-[10px] md:text-xs font-bold">
               {surahs.length} سورة • 604 صفحة
             </p>
             <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-emerald-500/40"></div>
          </div>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="sticky top-0 z-40 py-4 bg-[#0f172a]/80 backdrop-blur-xl mb-6 border-b border-white/5 -mx-4 px-4 md:mx-0 md:rounded-b-2xl">
        <div className="relative group max-w-2xl mx-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={20} />
          <input
            type="text"
            placeholder="ابحث: اسم سورة، رقم، صفحة، جزء، مكية/مدنية..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white text-base focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 transition-all text-right shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="max-w-2xl mx-auto mt-2 flex items-center gap-2 flex-wrap">
          {filterLabel && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {filterLabel}
            </span>
          )}
          {!loading && searchTerm.trim() && (
            <span className="text-[10px] text-gray-500 font-bold">
              {filteredSurahs.length} سورة
            </span>
          )}
          {/* Quick-go button — treats number as page */}
          {(() => {
            const t = searchTerm.trim();
            const nums = t.match(/\d+/);
            if (!nums) return null;
            const n = parseInt(nums[0], 10);
            if (n < 1 || n > 604) return null;
            let pageSurahIdx = -1;
            for (let i = SURAH_START_PAGES.length - 1; i >= 0; i--) {
              if (SURAH_START_PAGES[i] <= n) { pageSurahIdx = i; break; }
            }
            const pageSurah = pageSurahIdx >= 0 ? surahs[pageSurahIdx] : null;
            if (pageSurah) {
              return (
                <button
                  onClick={() => onSelectSurah(pageSurah, n)}
                  className="text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/20 transition-all mr-auto whitespace-nowrap"
                >
                  ✦ اذهب إلى الصفحة {n}
                </button>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Challenge Progress Card */}
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className={`glass-panel rounded-2xl md:rounded-3xl p-4 md:p-5 border relative overflow-hidden transition-all duration-500 ${khatmaProgress ? 'border-emerald-500/20 bg-gradient-to-l from-emerald-500/5 to-transparent' : 'border-white/5 bg-white/[0.02]'}`}>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            {khatmaProgress ? (
              <>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/40">
                      <BookOpen size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-black text-white">{khatmaProgress.title}</h3>
                      <p className="text-[8px] md:text-[10px] text-emerald-400/70 font-bold">تحدي نشط • اقرأ لتكسب النقاط</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg md:text-2xl font-black text-emerald-400">{khatmaProgress.done}<span className="text-gray-500 text-sm font-bold">/{khatmaProgress.total}</span></div>
                    <p className="text-[8px] md:text-[10px] text-gray-500 font-bold">صفحة مقروءة</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[8px] md:text-[10px] font-bold">
                    <span className="text-emerald-400/80">التقدم</span>
                    <span className="text-gray-400">{Math.round((khatmaProgress.done / khatmaProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 md:h-2.5 bg-emerald-500/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }}
                      animate={{ width: `${(khatmaProgress.done / khatmaProgress.total) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-3 mt-3">
                  {(() => {
                    const start = new Date(khatmaProgress.start);
                    const end = new Date(start);
                    end.setDate(end.getDate() + khatmaProgress.days);
                    const now = new Date();
                    const remaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                    const daysPassed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                    const pagesPerDay = (khatmaProgress.done / daysPassed).toFixed(1);
                    return (
                      <>
                        <div className="bg-emerald-500/5 rounded-xl p-2 md:p-3 text-center border border-emerald-500/10">
                          <Clock size={12} className="inline text-emerald-400 mb-0.5" />
                          <p className="text-[10px] md:text-xs font-black text-white">{remaining}</p>
                          <p className="text-[7px] md:text-[8px] text-gray-500 font-bold">يوم متبقي</p>
                        </div>
                        <div className="bg-emerald-500/5 rounded-xl p-2 md:p-3 text-center border border-emerald-500/10">
                          <BookOpen size={12} className="inline text-emerald-400 mb-0.5" />
                          <p className="text-[10px] md:text-xs font-black text-white">{pagesPerDay}</p>
                          <p className="text-[7px] md:text-[8px] text-gray-500 font-bold">صفحة/يوم</p>
                        </div>
                        <div className="bg-emerald-500/5 rounded-xl p-2 md:p-3 text-center border border-emerald-500/10">
                          <Zap size={12} className="inline text-emerald-400 mb-0.5" />
                          <p className="text-[10px] md:text-xs font-black text-white">+{khatmaProgress.reward}</p>
                          <p className="text-[7px] md:text-[8px] text-gray-500 font-bold">نقطة عند الإكمال</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Warning if behind schedule */}
                {(() => {
                  const start = new Date(khatmaProgress.start);
                  const end = new Date(start);
                  end.setDate(end.getDate() + khatmaProgress.days);
                  const now = new Date();
                  const remaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                  const daysPassed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                  const expected = Math.min(khatmaProgress.total, Math.round((daysPassed / khatmaProgress.days) * khatmaProgress.total));
                  const behind = expected - khatmaProgress.done;
                  if (behind > 0 && remaining > 0) {
                    return (
                      <div className="mt-2 flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                        <Timer size={10} /> متأخر بـ {behind} صفحة • تحتاج {Math.ceil((khatmaProgress.total - khatmaProgress.done) / remaining)} صفحة/يوم للحاق
                      </div>
                    );
                  }
                  return null;
                })()}
              </>
            ) : session?.user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500/30 to-teal-600/30 rounded-xl md:rounded-2xl flex items-center justify-center opacity-50">
                    <BookOpen size={18} className="text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-black text-white/60">لا يوجد تحدي نشط</p>
                    <p className="text-[8px] md:text-[10px] text-gray-500 font-bold">اذهب إلى المسابقات واشترك في تحدي</p>
                  </div>
                </div>
                <div className="text-gray-500 text-[8px] md:text-[10px] font-bold opacity-40">–</div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500/30 to-teal-600/30 rounded-xl md:rounded-2xl flex items-center justify-center opacity-50">
                    <BookOpen size={18} className="text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-black text-white/60">سجل دخولك لتبدأ التحديات</p>
                    <p className="text-[8px] md:text-[10px] text-gray-500 font-bold">اشترك واربح النقاط</p>
                  </div>
                </div>
                <div className="text-gray-500 text-[8px] md:text-[10px] font-bold opacity-40">–</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-emerald-500" size={48} />
          <p className="text-gray-500 font-bold text-sm">جاري عرض السور...</p>
        </div>
      ) : filteredSurahs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Search size={40} className="text-gray-600" />
          <p className="text-gray-500 font-bold text-sm">لا توجد نتائج للبحث</p>
          <button onClick={() => setSearchTerm('')} className="text-emerald-400 text-xs font-bold hover:underline">مسح البحث</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-2 animate-in slide-in-from-bottom-8 duration-700">
          {filteredSurahs.map((surah) => {
             const status = getStatus(surah.number);
             return (
            <div
              key={surah.number}
              onClick={() => onSelectSurah(surah)}
              className="group glass-panel p-3 lg:p-2 xl:p-3 rounded-[1.5rem] lg:rounded-xl xl:rounded-[1.2rem] cursor-pointer active:scale-[0.98] transition-all border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>

              <div className="flex items-center gap-2 lg:gap-1.5 xl:gap-2 relative z-10">
                <div className="w-9 h-9 lg:w-7 xl:w-9 lg:h-7 xl:h-9 rounded-xl lg:rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs lg:text-[10px] xl:text-sm transition-all group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-900/50 group-hover:rotate-3 shrink-0">
                  {surah.number}
                </div>
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <h3 className="text-sm lg:text-[10px] xl:text-xs font-bold text-white font-quran group-hover:text-emerald-300 transition-colors">{surah.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] lg:text-[7px] xl:text-[8px] text-slate-500 font-bold">{surah.numberOfAyahs} آية</span>
                    <div className="w-0.5 h-0.5 bg-slate-700 rounded-full"></div>
                    <span className="text-[9px] lg:text-[7px] xl:text-[8px] text-slate-500 font-bold">{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 lg:gap-0 shrink-0">
                   {status === 'completed' && <CheckCircle size={12} className="text-emerald-500" />}
                   {status === 'in_progress' && <Circle size={12} className="text-amber-500 animate-pulse" />}
                  <div className="w-7 h-7 lg:w-5 lg:h-5 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
                    <ChevronLeft size={14} className="lg:hidden xl:block" />
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

interface QuranReaderProps { 
    initialPage: number;
    onBack: () => void; 
    session: any;
    taskEndPage?: number | null; 
    taskType?: string | null;
    isAdvance?: boolean;
    onFinishTask?: (type: string) => void;
}

export const QuranReader: React.FC<QuranReaderProps> = ({ initialPage, onBack, session, taskEndPage, taskType, isAdvance, onFinishTask }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [primarySurah, setPrimarySurah] = useState<Surah | null>(null);
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
        return window.innerWidth < 768 ? 18 : 24;
    }
    return 24;
  });

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const scrollRef = useRef<number | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false); 
  const playerRef = useRef<HTMLDivElement>(null);

  const [selectedReciter, setSelectedReciter] = useState('Yasser_Ad-Dussary_128kbps'); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAyahKey, setActiveAyahKey] = useState<string | null>(null); 
  const [repeatCount, setRepeatCount] = useState(1);
  const currentRepeatRef = useRef(0);
  
  const [pageAyahsList, setPageAyahsList] = useState<{key: string}[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [tafseerModal, setTafseerModal] = useState<{title: string, text: string, ayahKey?: string, ayahText?: string} | null>(null);
  const [tafseerLoading, setTafseerLoading] = useState(false);
  const [selectedTafseer, setSelectedTafseer] = useState(() => localStorage.getItem('quran_tafseer') || 'ar.muyassar');
  const clickTimeoutRef = useRef<any>(null);

  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('quran_bookmarks') || '{}'); } catch { return {}; }
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSurahJump, setShowSurahJump] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [surahs, setSurahs] = useState<Surah[]>([]);

  useEffect(() => { fetchSurahs().then(s => setSurahs(s)); }, []);

  useEffect(() => {
    localStorage.setItem('quran_last_page', String(currentPage));
    localStorage.setItem('quran_tafseer', selectedTafseer);
    if (primarySurah) localStorage.setItem('quran_last_surah', primarySurah.name);
    if (session?.user) {
      const timer = setTimeout(() => {
        syncService.saveToServer(session.user.id, {
          quran_last_page: currentPage,
          quran_last_surah: primarySurah?.name || '',
          quran_tafseer: selectedTafseer,
          quran_bookmarks: bookmarkedAyahs,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentPage, primarySurah, selectedTafseer, bookmarkedAyahs, session?.user]);

  // Auto-track page reads for active khatma challenges
  const lastTrackedPage = useRef(0);
  const [trackingFeedback, setTrackingFeedback] = useState<string | null>(null);
  const [manualTracking, setManualTracking] = useState(false);
  const [khatmaChallenges, setKhatmaChallenges] = useState<any[]>([]);
  const [celebration, setCelebration] = useState<{ show: boolean; title: string; reward: number; pointsAdded: number } | null>(null);

  // Load active khatma challenges
  const loadKhatmaChallenges = useCallback(async () => {
    if (!session?.user) return;
    try {
      const challs = await challengeService.getActiveChallengesByCategory(session.user.id, 'khatma');
      setKhatmaChallenges(challs.map((c: any) => ({
        id: c.id,
        title: c.challenge_details?.title || 'تحدي قرآني',
        done: c.pages_completed,
        total: c.challenge_details?.total_pages || 604,
        reward: c.challenge_details?.points_reward || 0,
      })));
    } catch {
      setKhatmaChallenges([]);
    }
  }, [session]);

  useEffect(() => {
    loadKhatmaChallenges();
  }, [loadKhatmaChallenges]);

  const trackPage = async (pageNum: number) => {
    if (!session?.user) return;
    const result = await challengeService.autoTrackPageRead(session.user.id, pageNum, 10);
    if (result?.success) {
      setTrackingFeedback(`✅ سُجّلت الصفحة ${pageNum}`);
      await loadKhatmaChallenges();
      if (result.completedChallenges?.length > 0) {
        const cc = result.completedChallenges[0];
        setCelebration({ show: true, title: cc.title, reward: cc.reward, pointsAdded: result.pointsAdded || 0 });
      }
    } else if (result?.error) {
      setTrackingFeedback(result.error);
    } else {
      setTrackingFeedback('⚠️ فشل التسجيل');
    }
    setTimeout(() => setTrackingFeedback(null), 3000);
    return result;
  };

  const handleManualTrack = async () => {
    if (!session?.user || manualTracking) return;
    setManualTracking(true);
    await trackPage(currentPage);
    setManualTracking(false);
  };

  useEffect(() => {
    if (!session?.user || currentPage === lastTrackedPage.current) return;
    lastTrackedPage.current = currentPage;
    trackPage(currentPage);
  }, [currentPage, session?.user]);

  const stopAutoScroll = () => {
    setIsAutoScrolling(false);
    if (scrollRef.current) {
        cancelAnimationFrame(scrollRef.current);
        scrollRef.current = null;
    }
  };

  const resetAudio = () => {
    setIsPlaying(false);
    setCurrentAudioIndex(-1);
    setActiveAyahKey(null);
    currentRepeatRef.current = 0;
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    loadPage(currentPage);
    getSurahForPage(currentPage).then(surah => {
        setPrimarySurah(surah);
        if (surah) progressService.getSurahStatus(session?.user?.id, surah.number).then(s => setStatus(s));
    });
    stopAutoScroll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    resetAudio();
  }, [currentPage, session]);

  useEffect(() => {
    if (!pageData?.ayahs) return;
    setPageAyahsList(pageData.ayahs.map((ayah: any) => ({ key: `${ayah.surah.number}:${ayah.numberInSurah}` })));
  }, [pageData]);

  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const handleEnded = () => {
          if (currentRepeatRef.current < repeatCount - 1) {
              currentRepeatRef.current++;
              audio.currentTime = 0;
              audio.play();
          } else {
              currentRepeatRef.current = 0;
              if (currentAudioIndex < pageAyahsList.length - 1) playAyahAtIndex(currentAudioIndex + 1);
              else setIsPlaying(false);
          }
      };
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
  }, [currentAudioIndex, pageAyahsList, repeatCount]);

  const playAyahAtIndex = async (index: number) => {
      if (index < 0 || index >= pageAyahsList.length) return;
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      currentRepeatRef.current = 0;
      setCurrentAudioIndex(index);
      const target = pageAyahsList[index];
      setActiveAyahKey(target.key);
      setIsPlaying(true);

      const element = document.getElementById(`ayah-${target.key.replace(':', '-')}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const url = await getAyahAudioUrl(selectedReciter, target.key);
      if (url) {
        audio.src = url;
        audio.play().catch(() => setIsPlaying(false));
      }
  };

  const togglePlay = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
      } else {
          if (currentAudioIndex === -1) playAyahAtIndex(0);
          else audio.play().then(() => setIsPlaying(true));
      }
  };

  const loadPage = async (pageNum: number) => {
      setLoading(true);
      const data = await fetchPageContent(pageNum);
      setPageData(data);
      setLoading(false);
  };

  const toggleAutoScroll = () => {
      if (isAutoScrolling) {
          stopAutoScroll();
      } else {
          setIsAutoScrolling(true);
          const scrollStep = () => {
              const pixelSpeeds = [0.4, 0.8, 1.5, 2.2, 3.5];
              window.scrollBy(0, pixelSpeeds[scrollSpeed - 1] || 1);
              scrollRef.current = requestAnimationFrame(scrollStep);
          };
          scrollRef.current = requestAnimationFrame(scrollStep);
      }
  };

  const toggleBookmark = (ayahKey: string) => {
    setBookmarkedAyahs(prev => {
      const next = { ...prev };
      if (ayahKey in next) delete next[ayahKey];
      else next[ayahKey] = currentPage;
      localStorage.setItem('quran_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const copyAyahText = async (text: string, ayahKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(ayahKey);
      setTimeout(() => setCopyFeedback(null), 1500);
    } catch { setCopyFeedback(null); }
  };

  const jumpToSurah = (surahNumber: number) => {
    const page = SURAH_START_PAGES[surahNumber - 1];
    if (page) setCurrentPage(page);
    setShowSurahJump(false);
  };

  const cleanAyahText = (text: string, surahNumber: number, ayahNumber: number) => {
      if (ayahNumber === 1 && surahNumber !== 9) {
          const words = text.split(' ');
          if (words.length >= 4 && (words[0].includes('بِسْمِ') || words[0].includes('بسم'))) {
              return words.slice(4).join(' ').trim();
          }
      }
      return text;
  };

  const handleAyahClick = (ayahKey: string) => {
      const idx = pageAyahsList.findIndex(a => a.key === ayahKey);
      if (idx === -1) return;
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => {
          playAyahAtIndex(idx);
          clickTimeoutRef.current = null;
      }, 250);
  };

  const handleAyahDoubleClick = async (surahNum: number, ayahNum: number, surahName: string, ayahText: string) => {
      if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
      }
      const ayahKey = `${surahNum}:${ayahNum}`;
      setTafseerLoading(true);
      setTafseerModal({ title: `الآية ${ayahNum} - ${surahName}`, text: '', ayahKey, ayahText });
      const tafseerText = await fetchTafseer(surahNum, ayahNum, selectedTafseer);
      setTafseerModal(prev => prev ? { ...prev, text: tafseerText } : null);
      setTafseerLoading(false);
  };

  const updateStatus = async (newStatus: any) => {
    setStatus(newStatus);
    if (primarySurah) await progressService.updateStatus(session?.user?.id, primarySurah.number, newStatus);
  };

  const renderPageContent = () => {
    if (!pageData || !pageData.ayahs) return null;
    
    const elements: React.ReactNode[] = [];

    pageData.ayahs.forEach((ayah: any) => {
        const ayahKey = `${ayah.surah.number}:${ayah.numberInSurah}`;
        const isActive = activeAyahKey === ayahKey;
        const cleanedText = cleanAyahText(ayah.text, ayah.surah.number, ayah.numberInSurah);

        if (ayah.numberInSurah === 1) {
               elements.push(
                    <div key={`header-${ayah.surah.number}`} className="mt-8 mb-6 text-center select-none animate-in zoom-in w-full block clear-both">
                        <div className="inline-flex items-center justify-center w-full max-w-xs mx-auto border-y-2 border-emerald-500/30 py-2 bg-emerald-500/5 mb-4 rounded-lg">
                            <span className="font-quran text-2xl text-emerald-300 shadow-black drop-shadow-sm">
                                 {ayah.surah.name}
                            </span>
                        </div>
                        {ayah.surah.number !== 9 && (
                            <div className="font-quran text-emerald-400 text-xl mb-6">
                                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                            </div>
                        )}
                    </div>
                );
         }

        if (cleanedText !== "" || ayah.numberInSurah !== 1) {
            const isBookmarked = ayahKey in bookmarkedAyahs;
            elements.push(
                <span 
                    key={ayahKey} 
                    id={`ayah-${ayah.surah.number}-${ayah.numberInSurah}`}
                    className={`inline group cursor-pointer transition-colors px-1 py-0.5 rounded-lg relative ${isActive ? 'text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'hover:text-emerald-100'}`}
                    onClick={() => handleAyahClick(ayahKey)}
                    onDoubleClick={() => handleAyahDoubleClick(ayah.surah.number, ayah.numberInSurah, ayah.surah.name, cleanedText)}
                >
                    {cleanedText} 
                    <span className="inline-flex items-center mx-1 align-middle">
                        {isBookmarked && <BookmarkCheck size={Math.max(8, fontSize * 0.35)} className="text-amber-400 ml-0.5" />}
                        <span 
                            className="inline-flex items-center justify-center rounded-full border border-emerald-500/20 text-emerald-500 font-sans bg-emerald-500/5 select-none"
                            style={{ 
                                width: `${fontSize * 1.3}px`, 
                                height: `${fontSize * 1.3}px`,
                                fontSize: `${fontSize * 0.5}px` 
                            }}
                        >
                            {ayah.numberInSurah}
                        </span>
                    </span>
                </span>
            );
        }
    });

    return elements;
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 px-2 md:px-4 animate-in fade-in duration-500 pt-6 md:pt-10">
      <audio ref={audioRef} className="hidden" />

      {/* Tafseer Modal */}
      {tafseerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setTafseerModal(null)}></div>
              <div className="relative w-full max-w-lg bg-[#1e293b]/95 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 shadow-2xl z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3 text-emerald-400">
                          <BookOpenCheck size={24} />
                          <h3 className="font-bold text-xl text-white">{tafseerModal.title}</h3>
                      </div>
                      <button onClick={() => setTafseerModal(null)} className="p-2 bg-white/5 rounded-full text-gray-400"><X size={20} /></button>
                  </div>
                  {tafseerModal.ayahText && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 mb-4 text-center">
                      <p className="font-quran text-white text-lg leading-relaxed" dir="rtl">{tafseerModal.ayahText}</p>
                    </div>
                  )}
                  <div className="bg-black/20 rounded-2xl p-5 max-h-[35vh] overflow-y-auto font-quran text-lg leading-relaxed text-white" dir="rtl">
                      {tafseerLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" /></div> : tafseerModal.text}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-[10px] text-gray-500">المصدر: {TAFSEER_EDITIONS.find(t => t.id === selectedTafseer)?.name}</p>
                    <div className="flex items-center gap-2">
                      {tafseerModal.ayahKey && (
                        <>
                          <button onClick={() => { if (tafseerModal.ayahKey) toggleBookmark(tafseerModal.ayahKey); }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 ${tafseerModal.ayahKey in bookmarkedAyahs ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 border border-white/10'}`}
                          >
                            {tafseerModal.ayahKey in bookmarkedAyahs ? <><BookmarkCheck size={12} /> تم الحفظ</> : <><Bookmark size={12} /> حفظ الآية</>}
                          </button>
                          <button onClick={() => { if (tafseerModal.ayahText) copyAyahText(tafseerModal.ayahText, 'modal'); }}
                            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-bold transition-all flex items-center gap-1.5"
                          >
                            {copyFeedback === 'modal' ? <><Check size={12} className="text-emerald-400" /> تم النسخ</> : <><Copy size={12} /> نسخ الآية</>}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
              </div>
          </div>
      )}

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowBookmarks(false)}></div>
          <div className="relative w-full max-w-lg max-h-[70vh] bg-[#1e293b]/95 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-5 shadow-2xl z-10 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-emerald-400 font-bold text-lg flex items-center gap-2"><BookmarkCheck size={20} /> العلامات المرجعية ({Object.keys(bookmarkedAyahs).length})</h3>
              <button onClick={() => setShowBookmarks(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2 custom-scrollbar">
              {Object.keys(bookmarkedAyahs).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-10">لا توجد علامات مرجعية بعد</p>
              ) : (
                Object.entries(bookmarkedAyahs).reverse().map(([key, page]) => {
                  const [surahNum, ayahNum] = key.split(':');
                  return (
                    <button key={key} onClick={() => { setCurrentPage(page); setShowBookmarks(false); }}
                      className="w-full text-right p-3 rounded-xl bg-white/5 hover:bg-emerald-500/10 transition-colors border border-white/5 flex items-center justify-between group"
                    >
                      <span className="text-emerald-400 text-xs font-bold">سورة {surahNum} : الآية {ayahNum}</span>
                      <span className="text-[9px] text-gray-500">صفحة {page}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Surah Jump Panel */}
      {showSurahJump && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowSurahJump(false)}></div>
          <div className="relative w-full max-w-sm max-h-[70vh] bg-[#1e293b]/95 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-5 shadow-2xl z-10 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-emerald-400 font-bold text-lg flex items-center gap-2"><List size={20} /> الانتقال إلى سورة</h3>
              <button onClick={() => setShowSurahJump(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-1 custom-scrollbar">
              {surahs.map(s => (
                <button key={s.number} onClick={() => jumpToSurah(s.number)}
                  className="w-full text-right p-2.5 rounded-xl hover:bg-emerald-500/10 transition-colors flex items-center justify-between group"
                >
                  <span className="text-white text-sm font-bold">{s.number}. {s.name}</span>
                  <span className="text-[10px] text-gray-500">صفحة {SURAH_START_PAGES[s.number - 1]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-40"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
      ) : (
        <div className="bg-[#1e293b]/50 border border-white/5 rounded-[2.5rem] p-5 md:p-10 min-h-[80vh] shadow-2xl relative overflow-hidden mb-8">
            {/* Inner Header */}
            <div className="flex items-center justify-between mb-4 md:mb-8 pb-3 md:pb-4 border-b border-white/5">
                <div className="flex items-center gap-2 md:gap-4">
                   <button onClick={onBack}
                      className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all active:scale-90 group">
                      <ArrowRight size={18} className="md:hidden group-hover:translate-x-1 transition-transform" /><ArrowRight size={24} className="hidden md:block group-hover:translate-x-1 transition-transform" />
                   </button>
                   <span className="text-[10px] md:text-xs font-black text-emerald-400 truncate max-w-[100px] md:max-w-[200px]">{primarySurah?.name}</span>
                </div>
                <div className="flex items-center gap-0.5 md:gap-1">
                    <button onClick={() => setShowSurahJump(true)} className="p-1.5 md:p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="الانتقال إلى سورة">
                        <List size={14} className="md:hidden" /><List size={16} className="hidden md:block" />
                    </button>
                    <button onClick={() => setShowBookmarks(true)} className="p-1.5 md:p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors relative" title="العلامات المرجعية">
                        <BookmarkCheck size={14} className="md:hidden" /><BookmarkCheck size={16} className="hidden md:block" />
                        {Object.keys(bookmarkedAyahs).length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full text-[7px] flex items-center justify-center font-black text-white">{Object.keys(bookmarkedAyahs).length}</span>}
                    </button>
                    <button onClick={() => setCurrentPage(1)} className="p-1.5 md:p-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="أول صفحة">
                        <ArrowUpToLine size={14} className="md:hidden" /><ArrowUpToLine size={16} className="hidden md:block" />
                    </button>
                    <div className="bg-white/5 border border-white/5 px-2 md:px-4 py-1.5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-bold text-gray-400 mr-0.5 md:mr-1 flex items-center gap-0.5 md:gap-1 whitespace-nowrap">
                        <span>صفحة</span><span className="text-emerald-400 font-black tabular-nums">{currentPage}</span>
                    </div>
                </div>
            </div>

            {trackingFeedback && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center mb-4 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs md:text-sm font-black">
                {trackingFeedback}
              </motion.div>
            )}
            <div key={currentPage}
                className="font-quran text-white text-justify animate-page-enter" 
                dir="rtl" 
                style={{ 
                    fontSize: `${fontSize}px`,
                    lineHeight: fontSize < 20 ? '2.8' : '3.5'
                }}
            >
                {renderPageContent()}
            </div>
            <div className="mt-12 text-center text-xs text-gray-600 border-t border-white/5 pt-4">نور الإسلام • صفحة {currentPage}</div>
        </div>
      )}

      {/* Challenge Tracking Card */}
      {session?.user && khatmaChallenges.length > 0 && khatmaChallenges.map((kc, idx) => (
        <motion.div key={kc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl md:rounded-3xl p-4 md:p-6 border border-emerald-500/20 bg-gradient-to-l from-emerald-500/5 to-transparent mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${idx > 0 ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600'} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/30`}>
                <BookOpen size={18} className="text-white" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-black text-white">{kc.title}</h4>
                <p className="text-[9px] md:text-[10px] text-emerald-400/70 font-bold">{kc.done}/{kc.total} صفحة</p>
              </div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(kc.done / kc.total) * 100}%` }}
              className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20" />
          </div>
        </motion.div>
      ))}

      {/* Celebration Modal */}
      {celebration?.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setCelebration(null)}></div>
          <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative w-full max-w-md bg-gradient-to-br from-emerald-900/90 via-teal-900/80 to-emerald-800/90 backdrop-blur-xl rounded-[3rem] p-8 md:p-10 shadow-2xl border border-emerald-400/30 text-center overflow-hidden">
            {/* Confetti particles */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div key={i}
                initial={{ opacity: 1, y: -20, x: Math.random() * 400 - 200, rotate: 0, scale: 0 }}
                animate={{ opacity: 0, y: 600, rotate: 720, scale: 1.5 }}
                transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: 'easeIn' }}
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  background: ['#10b981', '#34d399', '#f59e0b', '#f472b6', '#8b5cf6', '#06b6d4', '#f97316'][i % 7],
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  boxShadow: '0 0 6px rgba(255,255,255,0.3)',
                }}
              />
            ))}
            <div className="relative z-10 space-y-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 ring-4 ring-amber-400/30">
                <Trophy size={48} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black mb-3">
                  <Sparkles size={12} /> تهانينا! <Sparkles size={12} />
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">أتممت التحدي 🎉</h2>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10 mb-4">
                  <p className="text-emerald-300 font-black text-lg mb-1">{celebration.title}</p>
                  <div className="flex items-center justify-center gap-2 text-gray-300 text-sm">
                    <BookOpenCheck size={16} className="text-emerald-400" />
                    <span>تم الإكمال بنجاح</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 shadow-xl shadow-amber-900/30">
                    <Zap size={24} className="text-white mx-auto mb-1" fill="currentColor" />
                    <p className="text-white font-black text-2xl">+{celebration.pointsAdded}</p>
                    <p className="text-amber-200 text-[9px] font-bold">نقطة</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-xl shadow-emerald-900/30">
                    <BadgeCheck size={24} className="text-white mx-auto mb-1" />
                    <p className="text-white font-black text-2xl">+{celebration.reward}</p>
                    <p className="text-emerald-200 text-[9px] font-bold">جائزة التحدي</p>
                  </div>
                </div>
              </motion.div>
              <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
                onClick={() => setCelebration(null)}
                className="bg-white/10 hover:bg-white/20 text-white font-black text-sm px-8 py-3 rounded-2xl border border-white/20 transition-all hover:scale-105 active:scale-95 w-full">
                🎊 أحسنت!
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Player */}
      <div ref={playerRef} className="fixed bottom-6 inset-x-4 md:inset-x-auto md:w-[600px] md:left-1/2 md:-translate-x-1/2 z-50">
        <div className={`bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2rem] overflow-hidden transition-all duration-300 ${isPanelExpanded ? 'max-h-[500px]' : 'max-h-[80px]'}`}>
            <div className="h-[80px] flex items-center justify-between px-4">
                <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.min(604, p+1))} className="p-2 text-gray-400"><ChevronLeft/></button>
                    <span className="text-white font-bold px-2">{currentPage}</span>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-2 text-gray-400"><ChevronRight/></button>
                </div>
                <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    {isPlaying ? <Pause fill="currentColor"/> : <Play fill="currentColor" className="ml-1"/>}
                </button>
                <button onClick={() => setIsPanelExpanded(!isPanelExpanded)} className={`p-3 rounded-xl transition-colors ${isPanelExpanded ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400'}`}>
                    <Settings2 size={24}/>
                </button>
            </div>

            {isPanelExpanded && (
                <div className="px-6 pb-6 pt-2 space-y-5 animate-in slide-in-from-bottom-4">
                    <div className="border-t border-white/5 pt-4">
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl mb-4">
                            <div className="flex items-center gap-3">
                                <MoveDown size={20} className={isAutoScrolling ? 'text-emerald-400' : 'text-gray-500'}/>
                                <span className="text-sm font-bold text-white">التمرير التلقائي</span>
                            </div>
                            <button onClick={toggleAutoScroll} className={`w-12 h-6 rounded-full transition-all relative ${isAutoScrolling ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isAutoScrolling ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><label className="text-[10px] text-gray-500 block">حجم الخط</label>
                                <div className="flex items-center justify-between bg-black/20 p-2 rounded-xl">
                                    <button onClick={() => setFontSize(s => Math.max(12, s-2))} className="p-1"><Minus size={14}/></button>
                                    <span className="font-bold text-emerald-400">{fontSize}</span>
                                    <button onClick={() => setFontSize(s => Math.min(60, s+2))} className="p-1"><Plus size={14}/></button>
                                </div>
                            </div>
                            <div className="space-y-2"><label className="text-[10px] text-gray-500 block">تكرار الآية</label>
                                <select value={repeatCount} onChange={e => setRepeatCount(parseInt(e.target.value))} className="w-full bg-black/20 border border-white/5 p-2 rounded-xl text-xs outline-none">
                                    {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n === 1 ? 'مرة واحدة' : `${n} مرات`}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2"><label className="text-[10px] text-gray-500 block">القارئ المفضل</label>
                            <select value={selectedReciter} onChange={e => setSelectedReciter(e.target.value)} className="w-full bg-black/20 border border-white/5 p-3 rounded-xl text-xs text-white outline-none">
                                {RECITERS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="mt-3 space-y-2"><label className="text-[10px] text-gray-500 block">التفسير</label>
                            <select value={selectedTafseer} onChange={e => { setSelectedTafseer(e.target.value); localStorage.setItem('quran_tafseer', e.target.value); }} className="w-full bg-black/20 border border-white/5 p-3 rounded-xl text-xs text-white outline-none">
                                {TAFSEER_EDITIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};