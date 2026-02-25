
import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { QuranList, QuranReader } from './components/QuranList';
import { Dashboard } from './components/Dashboard';
import { Planner } from './components/Planner';
import { DailyVerse } from './components/DailyVerse';
import { Azkar } from './components/Azkar';
import { PrayerTimes } from './components/PrayerTimes';
import { MosqueFinder } from './components/MosqueFinder';
import { Qibla } from './components/Qibla';
import { Radio } from './components/Radio';
import { Remix } from './components/Remix';
import { Tasbih } from './components/Tasbih';
import { HadithLibrary } from './components/HadithLibrary';
import { FatwaLibrary } from './components/FatwaLibrary';
import { Competitions } from './components/Competitions';
import { SURAH_START_PAGES } from './services/quranService';
import { ViewState, Surah } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Calendar, BookOpen, Sparkles, ChevronLeft, Star, Heart, ArrowRight, HelpCircle, Library, Trophy, Clock, Sun, MapPin, Radio as RadioIcon, Disc, Layers } from 'lucide-react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { getUserProfile, CompetitionUser } from './services/competitionService';

const Stars = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="mesh-gradient absolute inset-0 opacity-20"></div>
    <div className="mesh-blob absolute w-[400px] h-[400px] md:w-[700px] md:h-[700px] bg-emerald-500/10 -top-48 -left-48 rounded-full blur-[150px] animate-pulse"></div>
    {/* Small twinkling stars */}
    {[...Array(150)].map((_, i) => {
      const size = Math.random() * 2 + 0.5; // Small sizes: 0.5px to 2.5px
      const isGlowing = Math.random() > 0.8; // 20% chances for a brighter glow
      return (
        <div
          key={i}
          className={`absolute rounded-full animate-pulse blur-[0.3px] ${isGlowing ? 'bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.7)]' : 'bg-white/40'}`}
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${Math.random() * 4 + 1.5}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.6 + 0.2
          }}
        />
      );
    })}
  </div>
);

const LOGO_URL = "./logo.png";

const App = () => {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [currentReaderPage, setCurrentReaderPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CompetitionUser | null>(null);

  useEffect(() => {
    // Initialize Supabase Auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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

  const openTaskRange = (start: number, end: number, type: string) => {
    setView(ViewState.QURAN_READ);
  };

  const renderContent = () => {
    switch (view) {
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
      case ViewState.RADIO: return <Radio />;
      case ViewState.REMIX: return <Remix />;
      case ViewState.TASBIH: return <Tasbih session={session} />;
      case ViewState.HADITH: return <HadithLibrary />;
      case ViewState.FATAWA: return <FatwaLibrary />;
      case ViewState.COMPETITIONS:
        return (
          <Competitions
            onBack={() => setView(ViewState.HOME)}
            session={session}
          />
        );
      case ViewState.HOME:
      default:
        return (
          <div className="w-full max-w-4xl mx-auto space-y-10 md:space-y-16 py-6 md:py-12 px-4 md:px-6 text-center">
            {/* --- PREMIUM HERO SECTION --- */}
            <div className="relative pt-4 md:pt-12 pb-4 animate-in fade-in zoom-in duration-1000">

              <div className="relative mx-auto w-fit mb-8 group">
                <div className="absolute inset-0 bg-emerald-500/30 blur-[70px] rounded-full scale-125 group-hover:scale-150 transition-transform duration-1000"></div>
                <img
                  src={LOGO_URL}
                  alt="نور الإسلام"
                  className="w-32 md:w-56 h-auto relative z-10 drop-shadow-[0_15px_45px_rgba(16,185,129,0.5)] animate-float"
                />
              </div>

              <div className="space-y-4 relative z-10">
                <h1 className="text-6xl md:text-[110px] font-black tracking-tighter leading-none">
                  <span className="bg-gradient-to-b from-white via-emerald-50 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
                    نور الإسلام
                  </span>
                </h1>

                <div className="flex items-center justify-center gap-3 opacity-80">
                  <div className="h-[2px] w-6 md:w-12 bg-gradient-to-r from-transparent to-emerald-500/40"></div>
                  <p className="text-emerald-100/70 text-base md:text-2xl font-bold font-sans tracking-wide">
                    رفيقك في رحاب القرآن
                  </p>
                  <div className="h-[2px] w-6 md:w-12 bg-gradient-to-l from-transparent to-emerald-500/40"></div>
                </div>
              </div>
            </div>

            {/* --- DAILY SPIRITUAL CONTENT --- */}
            <div className="relative z-10">
              <DailyVerse />
            </div>

            {/* --- SPIRITUAL TOOLS GRID --- */}
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl md:text-3xl font-black text-white">الأدوات الإسلامية</h2>
                <div className="h-px flex-1 mx-4 bg-gradient-to-r from-emerald-500/50 to-transparent"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ToolCard
                  onClick={() => setView(ViewState.PRAYER_TIMES)}
                  icon={<Clock size={24} />}
                  label="مواقيت الصلاة"
                  color="emerald"
                />
                <ToolCard
                  onClick={() => setView(ViewState.AZKAR)}
                  icon={<Sun size={24} />}
                  label="الأذكار"
                  color="amber"
                />
                <ToolCard
                  onClick={() => setView(ViewState.TASBIH)}
                  icon={<Sparkles size={24} />}
                  label="المسبحة"
                  color="teal"
                />
                <ToolCard
                  onClick={() => setView(ViewState.QIBLA)}
                  icon={<MapPin size={24} />}
                  label="القبلة"
                  color="rose"
                />
                <ToolCard
                  onClick={() => setView(ViewState.RADIO)}
                  icon={<RadioIcon size={24} />}
                  label="الراديو"
                  color="blue"
                />
                <ToolCard
                  onClick={() => setView(ViewState.REMIX)}
                  icon={<Disc size={24} />}
                  label="ريمكس"
                  color="purple"
                />
                <ToolCard
                  onClick={() => setView(ViewState.MOSQUES)}
                  icon={<MapPin size={24} />}
                  label="المساجد"
                  color="indigo"
                />
                <ToolCard
                  onClick={() => setView(ViewState.DASHBOARD)}
                  icon={<Layers size={24} />}
                  label="الإحصائيات"
                  color="orange"
                />
              </div>
            </div>

            {/* --- CLEAN NAVIGATION CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10 pb-20">

              <button
                onClick={() => setView(ViewState.QURAN_LIST)}
                className="group relative overflow-hidden glass-panel p-6 md:p-8 rounded-[2.5rem] border border-white/10 text-right transition-all duration-500 hover:border-teal-500/40 hover:bg-teal-500/5 active:scale-[0.98] shadow-xl md:col-span-2"
              >
                {/* Fixed Background: Soft Glow instead of broken shapes */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center gap-5 relative z-10">
                  <div className="p-4 bg-teal-600/20 rounded-2xl md:rounded-3xl text-teal-400 group-hover:scale-110 group-hover:-rotate-3 transition-all">
                    <BookOpen size={28} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-black text-white">المصحف الشريف</h3>
                    <p className="text-gray-400 text-xs md:text-sm font-medium">اقرأ بقلبك واستمتع بأجمل التلاوات.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-teal-500/40 group-hover:text-teal-400 group-hover:bg-teal-500/20 transition-all">
                    <ChevronLeft size={20} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setView(ViewState.FATAWA)}
                className="group relative overflow-hidden glass-panel p-6 md:p-8 rounded-[2.5rem] border border-white/10 text-right transition-all duration-500 hover:border-emerald-500/40 hover:bg-emerald-500/5 active:scale-[0.98] shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center gap-5 relative z-10">
                  <div className="p-4 bg-emerald-600/20 rounded-2xl md:rounded-3xl text-emerald-400 group-hover:scale-110 group-hover:-rotate-3 transition-all">
                    <HelpCircle size={28} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-black text-white">الأحكام الشائعة</h3>
                    <p className="text-gray-400 text-xs md:text-sm font-medium">موسوعة شاملة لأهم الفتاوى والأحكام.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-emerald-500/40 group-hover:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                    <ChevronLeft size={20} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setView(ViewState.HADITH)}
                className="group relative overflow-hidden glass-panel p-6 md:p-8 rounded-[2.5rem] border border-white/10 text-right transition-all duration-500 hover:border-amber-500/40 hover:bg-amber-500/5 active:scale-[0.98] shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center gap-5 relative z-10">
                  <div className="p-4 bg-amber-600/20 rounded-2xl md:rounded-3xl text-amber-400 group-hover:scale-110 group-hover:-rotate-3 transition-all">
                    <Library size={28} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-black text-white">المكتبة الحديثية</h3>
                    <p className="text-gray-400 text-xs md:text-sm font-medium">تصفح الأحاديث النبوية الشريفة.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-amber-500/40 group-hover:text-amber-400 group-hover:bg-amber-500/20 transition-all">
                    <ChevronLeft size={20} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => setView(ViewState.COMPETITIONS)}
                className="group relative overflow-hidden glass-panel p-6 md:p-8 rounded-[2.5rem] border border-white/10 text-right transition-all duration-500 hover:border-yellow-500/40 hover:bg-yellow-500/5 active:scale-[0.98] shadow-xl md:col-span-2"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex items-center gap-5 relative z-10">
                  <div className="p-4 bg-yellow-600/20 rounded-2xl md:rounded-3xl text-yellow-400 group-hover:scale-110 group-hover:-rotate-3 transition-all">
                    <Trophy size={28} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-black text-white">مسابقات رمضان</h3>
                    <p className="text-gray-400 text-xs md:text-sm font-medium">شارك واربح جوائز قيمة في مسابقاتنا اليومية.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-yellow-500/40 group-hover:text-yellow-400 group-hover:bg-yellow-500/20 transition-all">
                    <ChevronLeft size={20} />
                  </div>
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
        <main className={`flex-1 container mx-auto px-0 md:px-4 ${view === ViewState.HOME ? 'pb-24' : 'pb-32 pt-6 md:pt-28'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full flex-1 flex flex-col"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
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