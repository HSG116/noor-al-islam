import React, { useEffect, useState, useRef } from 'react';
import { fetchSurahs, fetchPageContent, getSurahForPage, getAyahAudioUrl, fetchTafseer, RECITERS, TAFSEER_EDITIONS, SURAH_START_PAGES } from '../services/quranService';
import { plannerService } from '../services/plannerService';
import { progressService } from '../services/progressService';
import { challengeService } from '../services/challengeService';
import { Surah, UserProgress } from '../types';
import { Search, ChevronLeft, ChevronRight, CheckCircle, Book, Play, Circle, Loader2, Pause, Type, BookOpen, Zap, Settings2, X, Minus, Plus, MoveDown, Repeat, BookOpenCheck, Sparkles, ArrowRight, Flag } from 'lucide-react';

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
  const [activeChallenge, setActiveChallenge] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchSurahs();
      setSurahs(data);
      setFilteredSurahs(data);

      const progress = await progressService.getAll(session?.user?.id);
      setUserProgress(progress);

      if (session?.user) {
        const challenge = await challengeService.getActiveUserChallenge(session.user.id);
        setActiveChallenge(challenge);
      }
      setLoading(false);
    };
    loadData();
  }, [session]);

  useEffect(() => {
    const filtered = surahs.filter(
      (s) =>
        s.name.includes(searchTerm) ||
        s.englishName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSurahs(filtered);
  }, [searchTerm, surahs]);

  const getStatus = (surahNumber: number) => {
    const p = userProgress.find(up => up.surah_id === surahNumber);
    return p?.status || 'not_started';
  };

  return (
    <div className="max-w-4xl mx-auto pb-32 px-4 md:px-6">
      {/* Active Challenge Quick Action */}
      {activeChallenge && (
        <div className="mb-8 animate-in slide-in-from-top duration-700">
          <div className="glass-panel p-5 rounded-[2rem] border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50">
                <Flag size={24} />
              </div>
              <div>
                <h3 className="text-white font-black text-sm md:text-base">تحدي: {activeChallenge.challenge_details.title}</h3>
                <p className="text-emerald-400 text-[10px] md:text-xs">وصلت إلى الصفحة {activeChallenge.last_page_read || 1} من {activeChallenge.challenge_details.total_pages}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const { getSurahForPage } = await import('../services/quranService');
                const page = activeChallenge.last_page_read || 1;
                const surah = await getSurahForPage(page);
                if (surah) onSelectSurah(surah, page);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-2"
            >
              إكمال التحدي
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* --- PREMIUM HERO HEADER --- */}
      <div className="relative pt-6 pb-10 text-center animate-in fade-in zoom-in duration-1000">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full scale-110 pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mx-auto mb-2">
            <Sparkles size={14} className="animate-pulse" />
            <span>كتاب الله المسطور</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-black premium-text-gradient font-quran leading-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">المصحف الشريف</h1>
            <p className="font-quran text-lg md:text-3xl text-emerald-100/40 opacity-80 tracking-wide">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          </div>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="sticky top-0 z-40 py-4 bg-[#0f172a]/80 backdrop-blur-xl mb-6 border-b border-white/5 -mx-4 px-4 md:mx-0 md:rounded-b-2xl">
        <div className="relative group max-w-2xl mx-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={20} />
          <input
            type="text"
            placeholder="ابحث عن اسم السورة أو الرقم..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white text-base focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 transition-all text-right shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-emerald-500" size={48} />
          <p className="text-gray-500 font-bold text-sm">جاري عرض السور...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in slide-in-from-bottom-8 duration-700">
          {filteredSurahs.map((surah) => {
            const status = getStatus(surah.number);
            return (
              <div
                key={surah.number}
                onClick={() => onSelectSurah(surah)}
                className="group glass-panel p-5 rounded-[2rem] flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-lg transition-all group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-900/50 group-hover:rotate-3">
                    {surah.number}
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-white font-quran group-hover:text-emerald-300 transition-colors">{surah.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-bold">{surah.numberOfAyahs} آية</span>
                      <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                      <span className="text-[10px] text-slate-500 font-bold">{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  {status === 'completed' && <CheckCircle size={18} className="text-emerald-500" />}
                  {status === 'in_progress' && <Circle size={18} className="text-amber-500 animate-pulse" />}
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all">
                    <ChevronLeft size={24} />
                  </div>
                </div>
              </div>
            )
          })}
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
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [showSequenceWarning, setShowSequenceWarning] = useState(false);
  const [expectedPage, setExpectedPage] = useState<number>(1);

  const pageStartTimeRef = useRef<number>(Date.now());
  const [fontSize, setFontSize] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 18 : 24));
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const scrollRef = useRef<number | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAyahKey, setActiveAyahKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pageAyahsList, setPageAyahsList] = useState<{ key: string }[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(-1);
  const [repeatCount, setRepeatCount] = useState(1);
  const currentRepeatRef = useRef(0);
  const [selectedReciter, setSelectedReciter] = useState('Yasser_Ad-Dussary_128kbps');
  const [tafseerModal, setTafseerModal] = useState<{ title: string, text: string } | null>(null);
  const [tafseerLoading, setTafseerLoading] = useState(false);
  const [selectedTafseer, setSelectedTafseer] = useState('ar.muyassar');
  const clickTimeoutRef = useRef<any>(null);

  const stopAutoScroll = () => {
    setIsAutoScrolling(false);
    if (scrollRef.current) { cancelAnimationFrame(scrollRef.current); scrollRef.current = null; }
  };

  const resetAudio = () => {
    setIsPlaying(false); setCurrentAudioIndex(-1); setActiveAyahKey(null); currentRepeatRef.current = 0;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  };

  useEffect(() => {
    const loadInit = async () => {
      setLoading(true);
      const data = await fetchPageContent(currentPage);
      setPageData(data);
      const surah = await getSurahForPage(currentPage);
      setPrimarySurah(surah);
      if (surah && session?.user) {
        const s = await progressService.getSurahStatus(session.user.id, surah.number);
        setStatus(s);
        const challenge = await challengeService.getActiveUserChallenge(session.user.id);
        setActiveChallenge(challenge);

        if (challenge) {
          const expPage = challenge.last_page_read || 1;
          setExpectedPage(expPage);
          // If the user tries to read a page that is > expectedPage + 1
          if (currentPage > expPage + 1 || currentPage < expPage - 5) {
            setShowSequenceWarning(true);
          }
        }
      }
      setLoading(false);
    };

    const handlePageFinish = async () => {
      const duration = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      pageStartTimeRef.current = Date.now();

      if (session?.user && pageData && activeChallenge) {
        const expPage = activeChallenge.last_page_read || 1;

        if (currentPage <= expPage + 1) {
          const result = await challengeService.recordPageRead(session.user.id, currentPage, duration);
          if (result.error) {
            alert(result.error);
            if (result.isBanned) {
              localStorage.setItem('islamic_app_banned', 'true');
              window.location.reload();
            }
          }
        }
      }
    };

    loadInit();
    stopAutoScroll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    resetAudio();

    return () => { handlePageFinish(); };
  }, [currentPage, session]);

  useEffect(() => {
    if (!pageData?.ayahs) return;
    setPageAyahsList(pageData.ayahs.map((ayah: any) => ({ key: `${ayah.surah.number}:${ayah.numberInSurah}` })));
  }, [pageData]);

  useEffect(() => {
    if (currentAudioIndex !== -1 && isPlaying) {
      playAyahAtIndex(currentAudioIndex);
    }
  }, [selectedReciter]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      if (currentRepeatRef.current < repeatCount - 1) {
        currentRepeatRef.current++;
        audio.currentTime = 0; audio.play();
      } else {
        currentRepeatRef.current = 0;
        if (currentAudioIndex < pageAyahsList.length - 1) playAyahAtIndex(currentAudioIndex + 1);
        else setIsPlaying(false);
      }
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentAudioIndex, pageAyahsList, repeatCount, selectedReciter]);

  const playAyahAtIndex = async (index: number) => {
    if (index < 0 || index >= pageAyahsList.length) return;
    const audio = audioRef.current; if (!audio) return;
    audio.pause();
    currentRepeatRef.current = 0; setCurrentAudioIndex(index);
    const target = pageAyahsList[index];
    setActiveAyahKey(target.key); setIsPlaying(true);
    const element = document.getElementById(`ayah-${target.key.replace(':', '-')}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const url = await getAyahAudioUrl(selectedReciter, target.key);
    if (url) { audio.src = url; audio.play().catch(() => setIsPlaying(false)); }
  };

  const togglePlay = () => {
    const audio = audioRef.current; if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { if (currentAudioIndex === -1) playAyahAtIndex(0); else audio.play().then(() => setIsPlaying(true)); }
  };

  const loadPage = async (pageNum: number) => {
    setLoading(true);
    const data = await fetchPageContent(pageNum);
    setPageData(data);
    setLoading(false);
  };

  const toggleAutoScroll = () => {
    if (isAutoScrolling) stopAutoScroll();
    else {
      setIsAutoScrolling(true);
      const scrollStep = () => {
        const pixelSpeeds = [0.4, 0.8, 1.5, 2.2, 3.5];
        window.scrollBy(0, pixelSpeeds[scrollSpeed - 1] || 1);
        scrollRef.current = requestAnimationFrame(scrollStep);
      };
      scrollRef.current = requestAnimationFrame(scrollStep);
    }
  };

  const cleanAyahText = (text: string, surahNumber: number, ayahNumber: number) => {
    if (ayahNumber === 1 && surahNumber !== 9) {
      const words = text.split(' ');
      if (words.length >= 4 && (words[0].includes('بِسْمِ') || words[0].includes('بسم'))) return words.slice(4).join(' ').trim();
    }
    return text;
  };

  const handleAyahClick = (ayahKey: string) => {
    const idx = pageAyahsList.findIndex(a => a.key === ayahKey);
    if (idx === -1) return;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => { playAyahAtIndex(idx); clickTimeoutRef.current = null; }, 250);
  };

  const handleAyahDoubleClick = async (surahNum: number, ayahNum: number, surahName: string) => {
    if (clickTimeoutRef.current) { clearTimeout(clickTimeoutRef.current); clickTimeoutRef.current = null; }
    setTafseerLoading(true);
    setTafseerModal({ title: `الآية ${ayahNum} - ${surahName}`, text: '' });
    const tafseerText = await fetchTafseer(surahNum, ayahNum, selectedTafseer);
    setTafseerModal({ title: `الآية ${ayahNum} - ${surahName}`, text: tafseerText });
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
              <span className="font-quran text-2xl text-emerald-300 shadow-black drop-shadow-sm">{ayah.surah.name}</span>
            </div>
            {ayah.surah.number !== 9 && <div className="font-quran text-emerald-400 text-xl mb-6">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>}
          </div>
        );
      }
      if (cleanedText !== "" || ayah.numberInSurah !== 1) {
        elements.push(
          <span key={ayahKey} id={`ayah-${ayah.surah.number}-${ayah.numberInSurah}`}
            className={`inline group cursor-pointer transition-colors px-1 py-0.5 rounded-lg ${isActive ? 'text-emerald-300 bg-emerald-500/10' : 'hover:text-emerald-100'}`}
            onClick={() => handleAyahClick(ayahKey)} onDoubleClick={() => handleAyahDoubleClick(ayah.surah.number, ayah.numberInSurah, ayah.surah.name)}
          >
            {cleanedText}
            <span className="inline-flex items-center justify-center mx-1 rounded-full border border-emerald-500/20 text-emerald-500 font-sans bg-emerald-500/5 select-none"
              style={{ width: `${fontSize * 1.3}px`, height: `${fontSize * 1.3}px`, fontSize: `${fontSize * 0.5}px` }}>{ayah.numberInSurah}</span>
          </span>
        );
      }
    });
    return elements;
  };

  return (
    <div className="max-w-4xl mx-auto pb-40 px-2 md:px-4 animate-in fade-in duration-500 pt-6 md:pt-10">
      <audio ref={audioRef} className="hidden" />

      {/* Challenge Progress Bar - Fixed at top of viewport */}
      {activeChallenge && (
        <div className="fixed top-0 left-0 right-0 z-[100] px-2 py-3 bg-[#0f172a]/90 backdrop-blur-lg border-b border-emerald-500/30 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                <Flag size={14} />
              </div>
              <div className="hidden sm:block">
                <span className="text-[10px] font-black text-white block leading-none">تحدي الختمة</span>
                <span className="text-[9px] text-emerald-400 font-bold">{activeChallenge.challenge_details?.title}</span>
              </div>
            </div>
            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                style={{ width: `${(activeChallenge.pages_completed / (activeChallenge.challenge_details?.total_pages || 604)) * 100}%` }}></div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-black text-white tabular-nums">{Math.round((activeChallenge.pages_completed / (activeChallenge.challenge_details?.total_pages || 604)) * 100)}%</span>
              <span className="text-[8px] text-gray-400 block font-bold">إنجاز</span>
            </div>
          </div>
        </div>
      )}

      {/* Sequence Warning Popup */}
      {showSequenceWarning && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-md bg-[#1e293b] border border-red-500/50 rounded-3xl p-8 shadow-2xl z-10 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="font-black text-2xl text-white mb-4">خارج مسار التحدي!</h3>
            <p className="text-gray-300 mb-8 leading-relaxed">
              أنت الآن تقرأ في صفحة مختلفة عن مسار تحديك الحالي. صفحتك المستحقة هي <strong className="text-emerald-400 text-xl mx-1">{expectedPage}</strong>.<br /><br />
              القراءة العشوائية <strong>غير مسموحة</strong> في مسابقات التحدي. سيتم إيقاف احتساب تقدّمك حتى تعود للمسار الصحيح.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setShowSequenceWarning(false); setCurrentPage(expectedPage); }}
                className="w-full py-4 rounded-xl bg-emerald-500 text-white font-black hover:bg-emerald-400 transition-all shadow-lg active:scale-95"
              >
                العودة لصفحة التحدي الآن
              </button>
              <button
                onClick={() => setShowSequenceWarning(false)}
                className="w-full py-3 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-all"
              >
                متابعة تلاوة حرة (بدون تقدم)
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Tafseer Modal */}
      {tafseerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setTafseerModal(null)}></div>
          <div className="relative w-full max-w-lg bg-[#1e293b]/95 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 shadow-2xl z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3 text-emerald-400"><BookOpenCheck size={24} /><h3 className="font-bold text-xl text-white">تفسير الآية</h3></div>
              <button onClick={() => setTafseerModal(null)} className="p-2 bg-white/5 rounded-full text-gray-400"><X size={20} /></button>
            </div>
            <div className="bg-black/20 rounded-2xl p-5 max-h-[50vh] overflow-y-auto font-quran text-lg leading-relaxed text-white">
              {tafseerLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-emerald-500" /></div> : tafseerModal.text}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-40"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
      ) : (
        <div className="bg-[#1e293b]/50 border border-emerald-500/10 rounded-[2.5rem] p-5 md:p-10 min-h-[80vh] shadow-2xl relative overflow-hidden mb-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-emerald-500/10">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-90 group">
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex flex-col"><span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{primarySurah?.name}</span><span className="text-[10px] text-gray-500 font-bold">نور الإسلام</span></div>
            </div>
            <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400">صفحة <span className="text-emerald-400 font-black tabular-nums mx-1">{currentPage}</span></div>
          </div>
          <div className="font-quran text-white text-justify" dir="rtl" style={{ fontSize: `${fontSize}px`, lineHeight: fontSize < 20 ? '2.8' : '3.5' }}>{renderPageContent()}</div>
        </div>
      )}

      {/* Floating Control Center */}
      <div ref={playerRef} className="fixed bottom-6 inset-x-4 md:inset-x-auto md:w-[720px] md:left-1/2 md:-translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-700">
        <div className={`bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-[2.5rem] transition-all duration-500 ${isPanelExpanded ? 'max-h-[80vh] overflow-y-auto custom-scrollbar' : 'max-h-[100px] overflow-hidden'}`}>
          <div className="h-[100px] grid grid-cols-3 items-center px-4 md:px-8 relative">

            {/* Page Navigation Area */}
            <div className="flex justify-start">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-emerald-500/10">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-90"
                  title="الصفحة السابقة"
                >
                  <ChevronRight size={18} />
                </button>

                <div className="flex flex-col items-center px-2 min-w-[55px]">
                  <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest leading-none mb-1">PAGE</span>
                  <span className="text-base font-black text-white tabular-nums leading-none">{currentPage}</span>
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(604, p + 1))}
                  className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-90"
                  title="الصفحة التالية"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>

            {/* Play Button - Center Column */}
            <div className="flex justify-center">
              <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-90 transition-all hover:scale-105 border-4 border-[#0f172a]">
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
            </div>

            {/* Settings Toggle - Left Column */}
            <div className="flex justify-end">
              <button onClick={() => setIsPanelExpanded(!isPanelExpanded)} className={`p-4 rounded-2xl transition-all duration-300 ${isPanelExpanded ? 'bg-emerald-500 text-white shadow-lg rotate-90' : 'bg-white/5 text-gray-400 hover:text-emerald-400'}`}>
                <Settings2 size={24} />
              </button>
            </div>
          </div>
          {isPanelExpanded && (
            <div className="px-6 pb-8 pt-2 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="border-t border-white/5 pt-6 space-y-6">

                {/* Recitation & Tafseer - Custom Visual Selection */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block px-2">اختر القارئ المفضل</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
                      {RECITERS.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedReciter(r.id)}
                          className={`p-3 rounded-2xl border transition-all text-right relative group overflow-hidden ${selectedReciter === r.id ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                        >
                          <div className="relative z-10 flex flex-col gap-1">
                            <span className={`text-[11px] font-black transition-colors ${selectedReciter === r.id ? 'text-white' : 'text-gray-300'}`}>{r.name}</span>
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${selectedReciter === r.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                                {r.style}
                              </span>
                              <span className="text-[8px] text-gray-500 font-bold opacity-60">حفص عن عاصم</span>
                            </div>
                          </div>
                          {selectedReciter === r.id && <div className="absolute top-2 left-2 text-emerald-400 animate-in zoom-in duration-300"><CheckCircle size={14} fill="currentColor" className="text-emerald-500/20" /></div>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] text-emerald-400 font-black uppercase tracking-widest block px-2">تفسير الآيات</label>
                    <div className="flex flex-wrap gap-2">
                      {TAFSEER_EDITIONS.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTafseer(t.id)}
                          className={`px-4 py-2.5 rounded-xl border text-[10px] font-black transition-all ${selectedTafseer === t.id ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg scale-105' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggles & Numbers Control */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-emerald-500/10 pt-6">
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-emerald-500/10 group hover:bg-white/[0.07] transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-white leading-none">التمرير التلقائي</span>
                      <span className="text-[8px] text-gray-500 font-bold">تحريك الصفحة لأسفل</span>
                    </div>
                    <button onClick={toggleAutoScroll} className={`w-12 h-6 rounded-full transition-all relative ${isAutoScrolling ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isAutoScrolling ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex flex-col justify-center bg-white/5 p-4 rounded-2xl border border-white/5 gap-2 group hover:bg-white/[0.07] transition-all">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">حجم الخط</label>
                    <div className="flex items-center justify-between px-1">
                      <button onClick={() => setFontSize(s => Math.max(12, s - 2))} className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-white active:scale-90 transition-all"><Minus size={14} /></button>
                      <span className="font-black text-emerald-400 text-sm tabular-nums">{fontSize}</span>
                      <button onClick={() => setFontSize(s => Math.min(60, s + 2))} className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-white hover:bg-emerald-500 hover:text-white active:scale-90 transition-all"><Plus size={14} /></button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center bg-white/5 p-4 rounded-2xl border border-white/5 gap-2 group hover:bg-white/[0.07] transition-all">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">تكرار الآية</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setRepeatCount(n)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${repeatCount === n ? 'bg-emerald-500 text-white shadow-lg' : 'bg-black/20 text-gray-500 hover:text-white'}`}
                        >
                          {n === 1 ? 'مرة' : `${n} م`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
