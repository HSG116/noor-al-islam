
import React, { useEffect, useState, Suspense, lazy, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import Footer from './components/Footer';
import { SURAH_START_PAGES } from './services/quranService';
import { ViewState, Surah } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, BookOpen, Sparkles, ChevronLeft, HelpCircle, Library, Trophy, Clock, Sun, MapPin, Radio as RadioIcon, Disc, Layers, BookmarkCheck, ArrowLeft, User } from 'lucide-react';
import AiChat from './components/AiChat';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { getUserProfile, CompetitionUser } from './services/competitionService';
import { syncService } from './services/syncService';
import { Auth } from './components/Auth';
import Profile from './components/Profile';
import { LegalPages } from './components/LegalPages';
import { applySEO } from './services/seoConfig';

const VIEW_PATH: Record<ViewState, string> = {
  [ViewState.HOME]: '/',
  [ViewState.AUTH]: '/auth',
  [ViewState.DASHBOARD]: '/dashboard',
  [ViewState.QURAN_LIST]: '/quran',
  [ViewState.QURAN_READ]: '/quran/read',
  [ViewState.AI_TUTOR]: '/ai-tutor',
  [ViewState.PLANNER]: '/planner',
  [ViewState.AZKAR]: '/azkar',
  [ViewState.PRAYER_TIMES]: '/prayer-times',
  [ViewState.MOSQUES]: '/mosques',
  [ViewState.QIBLA]: '/qibla',
  [ViewState.RADIO]: '/radio',
  [ViewState.REMIX]: '/remix',
  [ViewState.TASBIH]: '/tasbih',
  [ViewState.HADITH]: '/hadith',
  [ViewState.FATAWA]: '/fatawa',
  [ViewState.COMPETITIONS]: '/competitions',
  [ViewState.PROFILE]: '/profile',
  [ViewState.LEGAL]: '/legal',
  [ViewState.ADMIN]: '/admin',
  [ViewState.ARAFAH_DAY]: '/arafah',
  [ViewState.REELS_STUDIO]: '/reels-studio',
};

const PATH_VIEW: Record<string, ViewState> = Object.fromEntries(
  Object.entries(VIEW_PATH).map(([k, v]) => [v, k as ViewState])
);

const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const QuranList = lazy(() => import('./components/QuranList').then(m => ({ default: m.QuranList })));
const QuranReader = lazy(() => import('./components/QuranList').then(m => ({ default: m.QuranReader })));
const Planner = lazy(() => import('./components/Planner').then(m => ({ default: m.Planner })));
const DailyVerse = lazy(() => import('./components/DailyVerse').then(m => ({ default: m.DailyVerse })));
const Azkar = lazy(() => import('./components/Azkar').then(m => ({ default: m.Azkar })));
const PrayerTimes = lazy(() => import('./components/PrayerTimes').then(m => ({ default: m.PrayerTimes })));
const MosqueFinder = lazy(() => import('./components/MosqueFinder').then(m => ({ default: m.MosqueFinder })));
const Qibla = lazy(() => import('./components/Qibla').then(m => ({ default: m.Qibla })));
const Radio = lazy(() => import('./components/Radio').then(m => ({ default: m.Radio })));
const Remix = lazy(() => import('./components/Remix').then(m => ({ default: m.Remix })));
const Tasbih = lazy(() => import('./components/Tasbih').then(m => ({ default: m.Tasbih })));
const HadithLibrary = lazy(() => import('./components/HadithLibrary').then(m => ({ default: m.HadithLibrary })));
const FatwaLibrary = lazy(() => import('./components/FatwaLibrary').then(m => ({ default: m.FatwaLibrary })));
const Competitions = lazy(() => import('./components/Competitions').then(m => ({ default: m.Competitions })));
const Admin = lazy(() => import('./components/Admin').then(m => ({ default: m.Admin })));
const ArafahDay = lazy(() => import('./components/ArafahDay').then(m => ({ default: m.ArafahDay })));
const ReelsStudio = lazy(() => import('./components/ReelsStudio').then(m => ({ default: m.ReelsStudio })));

const STAR_COUNT = 60;
const starPositions = Array.from({ length: STAR_COUNT }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  s: Math.random() * 2 + 1,
  d: Math.random() * 4,
  p: Math.random() * 0.5 + 0.3,
}));

const Stars = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.06)_0%,_transparent_70%)]"></div>
    <div className="absolute w-[500px] h-[500px] md:w-[800px] md:h-[800px] bg-emerald-500/8 top-[-20%] left-[-10%] rounded-full blur-[120px]"></div>
    <div className="absolute w-[400px] h-[400px] bg-blue-500/5 bottom-[-15%] right-[-10%] rounded-full blur-[100px]"></div>
    {starPositions.map((st, i) => (
      <motion.div key={i} className="absolute rounded-full"
        style={{
          left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s,
          backgroundColor: '#ffffff',
          boxShadow: '0 0 4px 1px rgba(94,234,212,0.3)',
        }}
        animate={{ opacity: [st.p, st.p * 0.15, st.p] }}
        transition={{ duration: st.d + 2, delay: st.d, repeat: Infinity, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

const LOGO_URL = "./logo.webp";

const getViewFromPath = (): ViewState => {
  const path = window.location.pathname;
  const matched = PATH_VIEW[path];
  if (matched) return matched;
  if (path.startsWith('/quran/read')) return ViewState.QURAN_READ;
  if (path.startsWith('/quran')) return ViewState.QURAN_LIST;
  return ViewState.HOME;
};

const navigateView = (newView: ViewState, replace?: boolean) => {
  const path = VIEW_PATH[newView] || '/';
  if (replace) {
    window.history.replaceState({ view: newView }, '', path);
  } else {
    window.history.pushState({ view: newView }, '', path);
  }
  applySEO(newView);
};

const App = () => {
  const [view, setViewState] = useState<ViewState>(() => getViewFromPath());
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [currentReaderPage, setCurrentReaderPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CompetitionUser | null>(null);
  const [lastReadPage, setLastReadPage] = useState<number | null>(() => {
    try { const s = localStorage.getItem('quran_last_page'); return s ? parseInt(s) : null; } catch { return null; }
  });
  const [lastReadSurah, setLastReadSurah] = useState<string | null>(() => {
    try { return localStorage.getItem('quran_last_surah'); } catch { return null; }
  });

  const setView = useCallback((newView: ViewState) => {
    setViewState(newView);
    navigateView(newView);
  }, []);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const initialView = getViewFromPath();
    if (currentPath !== (VIEW_PATH[initialView] || '/')) {
      window.history.replaceState({ view: initialView }, '', VIEW_PATH[initialView] || '/');
    }
    applySEO(initialView);
  }, []);

  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      const pathView = getViewFromPath();
      setViewState(pathView);
      applySEO(pathView);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  useEffect(() => {
    applySEO(view);
  }, [view]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        syncService.syncAll(session.user.id);
      }
    }).catch(() => {});

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await syncService.syncAll(session.user.id);
          }
        } else {
          setProfile(null);
        }
      } catch {}
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const p = await getUserProfile(userId);
      setProfile(p);
      localStorage.setItem(`profile_${userId}`, JSON.stringify(p));
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshLastRead = () => {
    try {
      const p = localStorage.getItem('quran_last_page');
      setLastReadPage(p ? parseInt(p) : null);
      setLastReadSurah(localStorage.getItem('quran_last_surah'));
    } catch {}
  };

  useEffect(() => { if (view === ViewState.HOME) refreshLastRead(); }, [view]);

  const openTaskRange = (start: number, end: number, type: string) => {
    setView(ViewState.QURAN_READ);
  };

  const handleAuthSuccess = () => {
    setView(ViewState.HOME);
  };

  const renderContent = () => {
    switch (view) {
      case ViewState.AUTH:
        return (
          <Auth
            onSuccess={handleAuthSuccess}
            onBack={() => setView(ViewState.HOME)}
            onGuest={() => setView(ViewState.HOME)}
          />
        );
      case ViewState.LEGAL:
        return <LegalPages onBack={() => setView(ViewState.HOME)} />;
      case ViewState.PROFILE:
        return session ? (
          <Profile
            session={session}
            onBack={() => setView(ViewState.HOME)}
            onLogout={() => { setSession(null); setProfile(null); setView(ViewState.HOME); }}
            onGoToAdmin={() => setView(ViewState.ADMIN)}
          />
        ) : (
          <Auth onSuccess={handleAuthSuccess} onBack={() => setView(ViewState.HOME)} />
        );
      case ViewState.DASHBOARD: return <Dashboard session={session} onNavigate={openTaskRange} />;
      case ViewState.QURAN_LIST:
        return (
          <QuranList
            onSelectSurah={(surah, pageNum) => {
              setSelectedSurah(surah);
              setCurrentReaderPage(pageNum || SURAH_START_PAGES[surah.number - 1]);
              setView(ViewState.QURAN_READ);
            }}
            session={session}
            onBack={() => setView(ViewState.HOME)}
          />
        );
      case ViewState.QURAN_READ:
        return (
          <QuranReader
            initialPage={currentReaderPage}
            onBack={() => setView(ViewState.QURAN_LIST)}
            onFinishTask={() => setView(ViewState.PLANNER)}
            session={session}
          />
        );
      case ViewState.PLANNER: return <Planner session={session} onNavigate={openTaskRange} />;
      case ViewState.AZKAR: return <Azkar session={session} />;
      case ViewState.PRAYER_TIMES: return <PrayerTimes />;
      case ViewState.MOSQUES: return <MosqueFinder />;
      case ViewState.QIBLA: return <Qibla />;
      case ViewState.RADIO: return <Radio session={session} />;
      case ViewState.REMIX: return <Remix />;
      case ViewState.TASBIH: return <Tasbih session={session} />;
      case ViewState.HADITH: return <HadithLibrary />;
      case ViewState.FATAWA: return <FatwaLibrary />;
      case ViewState.COMPETITIONS:
        return <Competitions session={session} />;
      case ViewState.ADMIN:
        return <Admin email={session?.user?.email || ''} onBack={() => setView(ViewState.PROFILE)} />;
      case ViewState.ARAFAH_DAY:
        return <ArafahDay onBack={() => setView(ViewState.HOME)} />;
      case ViewState.REELS_STUDIO:
        return <ReelsStudio onBack={() => setView(ViewState.HOME)} />;
      case ViewState.HOME:
      default:
        return (
          <div className="w-full max-w-4xl mx-auto space-y-6 md:space-y-14 py-4 md:py-10 px-3 md:px-6 text-center">

            {/* HERO */}
            <div className="relative pt-3 md:pt-10 pb-2">
              <div className="relative mx-auto w-fit mb-4 md:mb-6">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[50px] md:blur-[70px] rounded-full scale-150"></div>
                <img src={LOGO_URL} alt="نور الإسلام" className="w-20 md:w-48 h-auto relative drop-shadow-[0_10px_30px_rgba(16,185,129,0.4)]" />
              </div>
              <div className="space-y-2 md:space-y-3">
                <h1 className="text-4xl md:text-[100px] font-black tracking-tighter leading-none">
                  <span className="bg-gradient-to-b from-white via-emerald-50 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg">
                    نور الإسلام
                  </span>
                </h1>
                <p className="text-emerald-100/60 text-sm md:text-xl font-bold tracking-wide">
                  رفيقك في رحاب القرآن
                </p>
                {!session && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={() => setView(ViewState.AUTH)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-900/30 mt-2 md:mt-4">
                    <User size={16} />
                    تسجيل الدخول
                  </motion.button>
                )}
                {session && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={() => setView(ViewState.PROFILE)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all shadow-lg mt-2 md:mt-4">
                    <User size={16} />
                    حسابي
                  </motion.button>
                )}
              </div>
            </div>

            {/* DAILY VERSE */}
            <div className="relative z-10">
              <DailyVerse />
            </div>

            {/* TOOLS */}
            <div className="relative z-10 space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 px-1">
                <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent"></div>
                <h2 className="text-sm md:text-2xl font-black text-white/80">الأدوات</h2>
                <div className="h-px flex-1 bg-gradient-to-l from-emerald-500/30 to-transparent"></div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-4">
                <ToolCard onClick={() => setView(ViewState.PRAYER_TIMES)} icon={<Clock size={18} />} label="الصلاة" color="emerald" />
                <ToolCard onClick={() => setView(ViewState.AZKAR)} icon={<Sun size={18} />} label="الأذكار" color="amber" />
                <ToolCard onClick={() => setView(ViewState.TASBIH)} icon={<Sparkles size={18} />} label="التسبيح" color="teal" />
                <ToolCard onClick={() => setView(ViewState.QIBLA)} icon={<MapPin size={18} />} label="القبلة" color="rose" />
                <ToolCard onClick={() => setView(ViewState.RADIO)} icon={<RadioIcon size={18} />} label="الراديو" color="blue" />
                <ToolCard onClick={() => setView(ViewState.REMIX)} icon={<Disc size={18} />} label="واحة الإبداع" color="purple" />
                <ToolCard onClick={() => setView(ViewState.MOSQUES)} icon={<MapPin size={18} />} label="المساجد" color="indigo" />
                <ToolCard onClick={() => setView(ViewState.COMPETITIONS)} icon={<Trophy size={18} />} label="المسابقات" color="orange" />
                <ToolCard onClick={() => setView(ViewState.ARAFAH_DAY)} icon={<Sun size={18} />} label="يوم عرفة" color="amber" />
                <ToolCard onClick={() => setView(ViewState.REELS_STUDIO)} icon={<Layers size={18} />} label="استوديو الريلز" color="emerald" />
              </div>
            </div>

            {/* FEATURED CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 relative z-10 pb-16 md:pb-20">

              <button onClick={() => { if (lastReadPage) { setCurrentReaderPage(lastReadPage); setView(ViewState.QURAN_READ); } else setView(ViewState.QURAN_LIST); }}
                className="group relative overflow-hidden glass-panel p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/10 text-right transition-all duration-500 hover:border-teal-500/40 hover:bg-teal-500/5 active:scale-[0.98] shadow-lg md:col-span-2">
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-teal-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-3 md:gap-5 relative z-10">
                  <div className="p-3 md:p-4 bg-teal-600/20 rounded-xl md:rounded-3xl text-teal-400 group-hover:scale-110 transition-all">
                    <BookOpen size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-2xl font-black text-white">المصحف الشريف</h3>
                    {lastReadPage && lastReadSurah ? (
                      <p className="text-teal-400/80 text-[10px] md:text-sm font-bold truncate mt-0.5">
                        <BookmarkCheck size={12} className="inline ml-1" />
                        {lastReadSurah} • صفحة {lastReadPage}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-[10px] md:text-sm font-medium">اقرأ بقلبك واستمتع بأجمل التلاوات.</p>
                    )}
                  </div>
                  <ChevronLeft size={16} className="text-teal-500/30 group-hover:text-teal-400 transition-colors shrink-0" />
                </div>
              </button>

              <button onClick={() => setView(ViewState.FATAWA)}
                className="group relative overflow-hidden glass-panel p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/10 text-right transition-all duration-500 hover:border-emerald-500/40 hover:bg-emerald-500/5 active:scale-[0.98] shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-3 md:gap-5 relative z-10">
                  <div className="p-3 md:p-4 bg-emerald-600/20 rounded-xl md:rounded-3xl text-emerald-400 group-hover:scale-110 transition-all">
                    <HelpCircle size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-2xl font-black text-white">الأحكام</h3>
                    <p className="text-gray-400 text-[10px] md:text-sm font-medium truncate">موسوعة الفتاوى والأحكام</p>
                  </div>
                  <ChevronLeft size={16} className="text-emerald-500/30 group-hover:text-emerald-400 transition-colors shrink-0" />
                </div>
              </button>

              <button onClick={() => setView(ViewState.HADITH)}
                className="group relative overflow-hidden glass-panel p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/10 text-right transition-all duration-500 hover:border-amber-500/40 hover:bg-amber-500/5 active:scale-[0.98] shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-3 md:gap-5 relative z-10">
                  <div className="p-3 md:p-4 bg-amber-600/20 rounded-xl md:rounded-3xl text-amber-400 group-hover:scale-110 transition-all">
                    <Library size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-2xl font-black text-white">الحديث</h3>
                    <p className="text-gray-400 text-[10px] md:text-sm font-medium truncate">المكتبة الحديثية</p>
                  </div>
                  <ChevronLeft size={16} className="text-amber-500/30 group-hover:text-amber-400 transition-colors shrink-0" />
                </div>
              </button>

              <button onClick={() => setView(ViewState.COMPETITIONS)}
                className="group relative overflow-hidden glass-panel p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/10 text-right transition-all duration-500 hover:border-yellow-500/40 hover:bg-yellow-500/5 active:scale-[0.98] shadow-lg md:col-span-2">
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-yellow-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-3 md:gap-5 relative z-10">
                  <div className="p-3 md:p-4 bg-yellow-600/20 rounded-xl md:rounded-3xl text-yellow-400 group-hover:scale-110 transition-all">
                    <Trophy size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-2xl font-black text-white">مسابقات</h3>
                    <p className="text-gray-400 text-[10px] md:text-sm font-medium truncate">شارك واربح جوائز قيمة</p>
                  </div>
                  <ChevronLeft size={16} className="text-yellow-500/30 group-hover:text-yellow-400 transition-colors shrink-0" />
                </div>
              </button>

            </div>
          </div>
        );

    }
  };

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;

  if (typeof window !== 'undefined' && localStorage.getItem('islamic_app_banned') === 'true') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-500 font-bold p-10 text-center space-y-6">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse border border-red-500/30">
          <span className="text-5xl">🚫</span>
        </div>
        <h1 className="text-4xl">تم حظر الجهاز والآي بي نهائياً</h1>
        <p className="text-red-400 max-w-sm">لقد تم رصد تجاوزات متكررة لأنظمة الحماية والغش في التحديات. تم حظر هذا الجهاز من استخدام التطبيق.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white relative flex flex-col overflow-x-hidden selection:bg-emerald-500/30 font-sans">
      <Stars />
      <div className="relative z-10 flex flex-col flex-1">
        {view !== ViewState.QURAN_READ && <Navbar currentView={view} setView={setView} />}
        <main className={`flex-1 container mx-auto px-0 md:px-4 ${view === ViewState.HOME ? 'pb-0' : 'pb-10 pt-6 md:pt-28'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full flex-1 flex flex-col"
            >
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>}>
                {renderContent()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        {view !== ViewState.QURAN_READ && <AiChat userId={session?.user?.id} email={session?.user?.email} userName={profile?.name || session?.user?.user_metadata?.full_name} />}
        {view !== ViewState.QURAN_READ && <Footer onNavigate={setView} />}
      </div>
    </div>
  );
};

const ToolCard = ({ onClick, icon, label, color }: { onClick: () => void, icon: any, label: string, color: string }) => {
  const colorMap: any = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-300 hover:scale-105 active:scale-95 group shadow-lg ${colorMap[color] || colorMap.emerald}`}
    >
      <div className="mb-2 transition-transform group-hover:rotate-12">
        {icon}
      </div>
      <span className="text-[10px] md:text-xs font-black">{label}</span>
    </button>
  );
};

export default App;
