import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Search, Play, Loader2, Film, Music4,
  Download, RefreshCw, CheckCircle2, AlertTriangle, Sparkles,
  Clapperboard, Clock, Wand2, Zap, Bot, ChevronDown, Star,
  RotateCcw, Timer, Copy, Compass
} from 'lucide-react';

import { useReelsJob } from './ReelsJobContext';

interface ReelsStudioProps { onBack: () => void; }

interface SurahMeta {
  number: number; name: string; englishName: string;
  englishNameTranslation: string; numberOfAyahs: number; revelationType: string;
}
interface ReciterEdition { identifier: string; englishName: string; name: string; }
interface FeaturedReciter { identifier: string; name: string; arabicName: string; featured: boolean; }
interface BackgroundVideo { id: number; image: string; duration: number; videoFile: string; width: number; height: number; }
interface OutroOption { id: string; label: string; }

type Step = 1 | 2 | 3 | 4 | 5;
type AutoPhase = 'idle' | 'config' | 'picking' | 'preview' | 'generating' | 'done' | 'error';

const DURATION_OPTIONS: Array<{ label: string; seconds: number; icon: string; desc: string }> = [
  { label: '٣٠ ث', seconds: 30,  icon: '⚡', desc: '٣٠–٣٥ ث' },
  { label: '٤٥ ث', seconds: 45,  icon: '⏱',  desc: '٤٥–٥٠ ث' },
  { label: '١ د',   seconds: 60,  icon: '✨', desc: '٦٠–٦٥ ث' },
  { label: '١:٣٠', seconds: 90,  icon: '🎬', desc: '٩٠–٩٥ ث' },
  { label: '٢ د',   seconds: 120, icon: '🌟', desc: '١٢٠–١٢٥ ث' },
];

const AUTO_MESSAGES = [
  '🌙 يختار أجمل السور...',
  '🎵 يختار أعذب الأصوات...',
  '🎬 يختار الخلفية المناسبة...',
  '✨ يُجهّز ريلزك...',
];

const STEP_LABELS: Record<Step, string> = { 1: 'السورة', 2: 'المدة', 3: 'القارئ', 4: 'الخلفية', 5: 'الإنشاء' };

export const ReelsStudio: React.FC<ReelsStudioProps> = ({ onBack }) => {
  // ── Auto-mode ─────────────────────────────────────────────────────────────
  const [autoPhase, setAutoPhase]     = useState<AutoPhase>('idle');
  const [autoMsgIdx, setAutoMsgIdx]   = useState(0);
  const [autoPickResult, setAutoPickResult] = useState<any>(null);
  const [autoError, setAutoError]     = useState<string | null>(null);
  const [aiDuration, setAiDuration]   = useState(60);
  const [aiReciter, setAiReciter]     = useState('auto');
  const [jobStartTime, setJobStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // ── Manual mode ──────────────────────────────────────────────────────────
  const [step, setStep]               = useState<Step>(1);

  // Step 1 – surah
  const [surahs, setSurahs]           = useState<SurahMeta[]>([]);
  const [surahSearch, setSurahSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(null);
  const [loadingSurahs, setLoadingSurahs] = useState(true);
  const [smartSurahLoading, setSmartSurahLoading] = useState(false);

  // Step 2 – duration / ayah range
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [startAyah, setStartAyah]     = useState(1);
  const [endAyah, setEndAyah]         = useState(10);
  const [showManualRange, setShowManualRange] = useState(false);
  const [calcEndAyahLoading, setCalcEndAyahLoading] = useState(false);

  // Step 3 – reciter
  const [reciters, setReciters]       = useState<ReciterEdition[]>([]);
  const [featuredReciters, setFeaturedReciters] = useState<FeaturedReciter[]>([]);
  const [reciterSearch, setReciterSearch] = useState('');
  const [selectedReciter, setSelectedReciter] = useState<ReciterEdition | null>(null);
  const [loadingReciters, setLoadingReciters] = useState(true);
  const [showAllReciters, setShowAllReciters] = useState(false);

  // Step 4 – background
  const [bgTab, setBgTab]             = useState<'smart' | 'manual'>('smart');
  const [bgQuery, setBgQuery]         = useState('nature mountains peaceful');
  const [backgrounds, setBackgrounds] = useState<BackgroundVideo[]>([]);
  const [selectedBg, setSelectedBg]   = useState<BackgroundVideo | null>(null);
  const [loadingBg, setLoadingBg]     = useState(false);
  const [bgError, setBgError]         = useState<string | null>(null);
  const [smartBgLoading, setSmartBgLoading] = useState(false);
  const [smartBgResult, setSmartBgResult]   = useState<(BackgroundVideo & { query: string }) | null>(null);

  // Outros
  const [outros, setOutros]           = useState<OutroOption[]>([]);
  const [selectedOutro, setSelectedOutro] = useState<string | null>(null);

  // Step 5 – generation
  const { jobId, jobStatus, resultUrl, genError, setJobId, clearJob } = useReelsJob();

  // Restore view if coming back with an active job
  useEffect(() => {
    if (jobId || genError || resultUrl) {
      setStep(5);
      setAutoPhase('idle');
    }
  }, []);

  // ── Boot fetches ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/reels/surahs').then(r => r.json())
      .then(d => setSurahs(Array.isArray(d) ? d : []))
      .catch(() => setSurahs([]))
      .finally(() => setLoadingSurahs(false));

    fetch('/api/reels/reciters').then(r => r.json())
      .then(d => setReciters(Array.isArray(d) ? d : []))
      .catch(() => setReciters([]))
      .finally(() => setLoadingReciters(false));

    fetch('/api/reels/featured-reciters').then(r => r.json())
      .then(d => setFeaturedReciters(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch('/api/reels/outros').then(r => r.json())
      .then(d => { setOutros(Array.isArray(d) ? d : []); if (d[0]) setSelectedOutro(d[0].id); })
      .catch(() => {});
  }, []);

  // ── Auto duration → ayah range sync ──────────────────────────────────────
  useEffect(() => {
    if (!selectedSurah || showManualRange) return;

    let active = true;
    setCalcEndAyahLoading(true);

    const fallbackReciter = selectedReciter?.identifier || (featuredReciters.length > 0 ? featuredReciters[0].identifier : 'ar.alafasy');

    fetch('/api/reels/calc-end-ayah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surahNumber: selectedSurah.number,
        startAyah,
        reciterEdition: fallbackReciter,
        durationSeconds: selectedDuration
      })
    })
      .then(r => r.json())
      .then(d => {
        if (!active) return;
        if (d.endAyah) {
          setEndAyah(Math.min(d.endAyah, selectedSurah.numberOfAyahs));
        } else {
          // Fallback if network fails
          const count = Math.round(selectedDuration / 6);
          setEndAyah(Math.min(startAyah + count - 1, selectedSurah.numberOfAyahs));
        }
      })
      .catch(() => {
        if (!active) return;
        const count = Math.round(selectedDuration / 6);
        setEndAyah(Math.min(startAyah + count - 1, selectedSurah.numberOfAyahs));
      })
      .finally(() => {
        if (active) setCalcEndAyahLoading(false);
      });

    return () => { active = false; };
  }, [selectedDuration, startAyah, selectedSurah, showManualRange, selectedReciter, featuredReciters]);

  // ── Smart background when entering step 4 ────────────────────────────────
  useEffect(() => {
    if (step === 4 && bgTab === 'smart' && !smartBgResult && selectedSurah) {
      fetchSmartBg();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, bgTab]);



  // Auto-mode message cycling
  useEffect(() => {
    if (autoPhase !== 'picking') return;
    const iv = setInterval(() => setAutoMsgIdx(i => (i + 1) % AUTO_MESSAGES.length), 1200);
    return () => clearInterval(iv);
  }, [autoPhase]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fetchSmartBg = async () => {
    if (!selectedSurah) return;
    setSmartBgLoading(true);
    setBgError(null);
    try {
      const url = `/api/reels/smart-background?surah=${selectedSurah.number}&start=${startAyah}&end=${endAyah}`;
      const d   = await fetch(url).then(r => r.json());
      if (d.error) throw new Error(d.error);
      setSmartBgResult(d);
      setSelectedBg(d);
    } catch (e: any) {
      setBgError(e.message || 'تعذر الحصول على خلفية ذكية');
    } finally { setSmartBgLoading(false); }
  };

  const searchManualBg = async () => {
    setLoadingBg(true); setBgError(null);
    try {
      const d = await fetch(`/api/reels/backgrounds?query=${encodeURIComponent(bgQuery)}`).then(r => r.json());
      if (d.error) throw new Error(d.error);
      setBackgrounds(Array.isArray(d) ? d : []);
    } catch (e: any) {
      setBgError(e.message || 'حدث خطأ'); setBackgrounds([]);
    } finally { setLoadingBg(false); }
  };

  const smartPickSurah = async () => {
    setSmartSurahLoading(true);
    try {
      const d = await fetch('/api/reels/ai-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSeconds: selectedDuration }),
      }).then(r => r.json());
      if (d.error) throw new Error(d.error);
      const found = surahs.find(s => s.number === d.passage.surahNumber);
      if (found) {
        setSelectedSurah(found);
        setStartAyah(d.passage.startAyah);
        setEndAyah(d.passage.endAyah);
        setShowManualRange(false);
        setTimeout(() => setStep(2), 300);
      }
    } catch { /* ignore – user can pick manually */ }
    finally { setSmartSurahLoading(false); }
  };

  const startGeneration = async (
    params?: { surahNumber: number; startAyah: number; endAyah: number; reciterEdition: string; backgroundVideoUrl: string; outroId: string }
  ) => {
    const p = params || {
      surahNumber: selectedSurah!.number,
      startAyah,
      endAyah,
      reciterEdition: selectedReciter!.identifier,
      backgroundVideoUrl: (bgTab === 'smart' ? smartBgResult?.videoFile : selectedBg?.videoFile) || '',
      outroId: selectedOutro!,
    };
    clearJob();
    try {
      const d = await fetch('/api/reels/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      }).then(r => r.json());
      if (d.error) throw new Error(d.error);
      setJobId(d.jobId);
    } catch (e: any) { alert(e.message || 'حدث خطأ غير متوقع'); }
  };

  // ── Full Auto mode ────────────────────────────────────────────────────────
  const runAutoMode = useCallback(async () => {
    setAutoPhase('picking');
    setAutoError(null);
    setAutoPickResult(null);
    setAutoMsgIdx(0);
    try {
      const d = await fetch('/api/reels/ai-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSeconds: aiDuration, reciterEdition: aiReciter === 'auto' ? undefined : aiReciter }),
      }).then(r => r.json());
      if (d.error) throw new Error(d.error);
      if (!d.background) throw new Error('PEXELS_API_KEY غير مُضاف — لا يمكن اختيار خلفية تلقائياً');
      setAutoPickResult(d);
      setAutoPhase('preview');
    } catch (e: any) {
      alert(e.message || 'حدث خطأ');
      setAutoPhase('idle');
    }
  }, [aiDuration, aiReciter]);

  const confirmAutoGenerate = async () => {
    if (!autoPickResult) return;
    const outros_ = outros.length ? outros : await fetch('/api/reels/outros').then(r => r.json()).catch(() => []);
    const outroId = outros_[0]?.id;
    if (!outroId) { alert('لا توجد خاتمة متاحة'); return; }

    setAutoPhase('idle');
    setStep(5);
    clearJob();

    try {
      const d = await fetch('/api/reels/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surahNumber:      autoPickResult.passage.surahNumber,
          startAyah:        autoPickResult.passage.startAyah,
          endAyah:          autoPickResult.passage.endAyah,
          reciterEdition:   autoPickResult.reciter.identifier,
          backgroundVideoUrl: autoPickResult.background.videoFile,
          outroId,
        }),
      }).then(r => r.json());
      if (d.error) throw new Error(d.error);
      setJobId(d.jobId);
    } catch (e: any) { alert(e.message || 'فشل إنشاء الفيديو'); }
  };
  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredSurahs = useMemo(() => {
    const q = surahSearch.trim();
    if (!q) return surahs;
    return surahs.filter(s => s.name.includes(q) || s.englishName.toLowerCase().includes(q.toLowerCase()) || String(s.number) === q);
  }, [surahs, surahSearch]);

  const filteredReciters = useMemo(() => {
    const q = reciterSearch.trim().toLowerCase();
    if (!q) return reciters;
    return reciters.filter(r => r.englishName.toLowerCase().includes(q) || r.name.includes(q));
  }, [reciters, reciterSearch]);

  const ayahCount = endAyah - startAyah + 1;
  const bgVideoUrl = bgTab === 'smart' ? smartBgResult?.videoFile : selectedBg?.videoFile;

  const canNext = () => {
    if (step === 1) return !!selectedSurah;
    if (step === 2) return selectedSurah ? startAyah >= 1 && endAyah >= startAyah && endAyah <= selectedSurah.numberOfAyahs && ayahCount <= 50 : false;
    if (step === 3) return !!selectedReciter;
    if (step === 4) return !!bgVideoUrl && !!selectedOutro;
    return true;
  };

  // ════════════════════════════════════════════════════════════════════════════
  const hasActiveJob = !!(jobId || resultUrl || genError);

  return (
    <div className="w-full max-w-3xl mx-auto px-3 md:px-6 py-4 md:py-10 relative z-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors">
          <ArrowRight size={18} />
        </button>
        <div>
          <h1 className="text-xl md:text-3xl font-black text-white flex items-center gap-2">
            <Clapperboard className="text-emerald-400" size={24} />
            استوديو الريلز القرآني
          </h1>
          <p className="text-xs md:text-sm text-emerald-100/50">أنشئ ريلز قرآنياً احترافياً بضغطة واحدة</p>
        </div>
      </div>

      {/* ═══ AUTO MODE CARD ═══════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {autoPhase === 'idle' && !hasActiveJob && (
          <motion.div key="auto-idle"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-teal-950/40 to-emerald-950/60 backdrop-blur-xl p-5 md:p-6"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.12),transparent_60%)] pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Bot size={20} className="text-emerald-400" />
                  <span className="text-emerald-300 font-black text-base md:text-lg">ريلز تلقائي بالذكاء الاصطناعي</span>
                </div>
                <p className="text-white/50 text-xs md:text-sm">اضغط زراً واحداً — الذكاء الاصطناعي يختار السورة والقارئ والخلفية ويبدأ التوليد فوراً</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => setAutoPhase('config')}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-xl shadow-lg shadow-emerald-900/40 whitespace-nowrap text-sm md:text-base"
              >
                <Zap size={18} /> بدء الذكاء الاصطناعي
              </motion.button>
            </div>
          </motion.div>
        )}

        {autoPhase === 'config' && !hasActiveJob && (
          <motion.div key="auto-config"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-6 rounded-2xl border border-emerald-500/30 bg-white/[0.03] backdrop-blur-xl p-6"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-black mb-6">
              <Bot size={20} /> تفضيلات الذكاء الاصطناعي
            </div>

            <div className="mb-6">
              <p className="text-white/60 text-sm font-bold mb-3">مدة الريلز التقريبية</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {DURATION_OPTIONS.map(d => (
                  <button key={d.seconds} onClick={() => setAiDuration(d.seconds)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      aiDuration === d.seconds 
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.15)]' 
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl mb-1">{d.icon}</span>
                    <span className="font-bold text-sm">{d.label}</span>
                    <span className="text-[10px] opacity-50">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-white/60 text-sm font-bold mb-3">القارئ</p>
              <select
                value={aiReciter}
                onChange={(e) => setAiReciter(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                style={{ direction: 'rtl' }}
              >
                <option value="auto">✨ اختيار تلقائي (الذكاء الاصطناعي يقرر)</option>
                {reciters.filter(r => r.identifier.startsWith('ar.')).map(r => (
                  <option key={r.identifier} value={r.identifier}>{r.name} - {r.englishName}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAutoPhase('idle')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm transition-colors"
              >
                إلغاء
              </button>
              <button onClick={runAutoMode}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-900/30"
              >
                <Sparkles size={18} /> متابعة
              </button>
            </div>
          </motion.div>
        )}

        {autoPhase === 'picking' && (
          <motion.div key="auto-picking"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-xl p-6 flex flex-col items-center gap-4"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Bot size={28} className="text-emerald-400" />
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={autoMsgIdx}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="text-emerald-300 font-black text-lg text-center"
              >
                {AUTO_MESSAGES[autoMsgIdx]}
              </motion.p>
            </AnimatePresence>
            <p className="text-white/40 text-xs">يرجى الانتظار...</p>
          </motion.div>
        )}

        {autoPhase === 'preview' && autoPickResult && (
          <motion.div key="auto-preview"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-2xl border border-emerald-500/30 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
          >
            <div className="p-4 md:p-5 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-base mb-1">
                <CheckCircle2 size={18} /> اختار الذكاء الاصطناعي لك:
              </div>
              <p className="text-white/40 text-xs">راجع الاختيار واضغط "إنشاء" أو اختر من جديد</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10 rtl:md:divide-x-reverse">
              {/* Surah */}
              <div className="p-4 flex flex-row md:flex-col gap-3 items-center md:items-start">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                  <span className="text-teal-400 text-xl">📖</span>
                </div>
                <div>
                  <p className="text-white/40 text-[11px]">السورة</p>
                  <p className="text-white font-black text-base">{autoPickResult.passage.surahName}</p>
                  <p className="text-emerald-400 text-xs">الآيات {autoPickResult.passage.startAyah}–{autoPickResult.passage.endAyah} · مزاج: {autoPickResult.passage.mood}</p>
                </div>
              </div>
              {/* Reciter */}
              <div className="p-4 flex flex-row md:flex-col gap-3 items-center md:items-start">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
                  <span className="text-purple-400 text-xl">🎵</span>
                </div>
                <div>
                  <p className="text-white/40 text-[11px]">القارئ</p>
                  <p className="text-white font-black text-base">{autoPickResult.reciter.name}</p>
                  <p className="text-white/40 text-xs">{autoPickResult.reciter.arabicName}</p>
                </div>
              </div>
              {/* Background */}
              <div className="p-4 flex flex-row md:flex-col gap-3 items-center md:items-start">
                <div className="relative w-10 h-16 rounded-xl overflow-hidden shrink-0 border border-white/20">
                  {autoPickResult.background?.image
                    ? <img src={autoPickResult.background.image} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-white/10 flex items-center justify-center"><span className="text-white/40 text-lg">🎬</span></div>}
                </div>
                <div>
                  <p className="text-white/40 text-[11px]">الخلفية</p>
                  <p className="text-white font-black text-sm line-clamp-1">خلفية ذكية</p>
                  <p className="text-white/40 text-xs line-clamp-1">{autoPickResult.background?.query || 'مختارة تلقائياً'}</p>
                </div>
              </div>
            </div>
            <div className="p-4 flex gap-3 border-t border-white/10">
              <motion.button whileTap={{ scale: 0.97 }} onClick={confirmAutoGenerate}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-900/30"
              >
                <Sparkles size={16} /> إنشاء الريلز الآن
              </motion.button>
              <button onClick={runAutoMode}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-xl font-bold text-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw size={14} /> اختر غيره
              </button>
            </div>
          </motion.div>
        )}



      </AnimatePresence>

      {/* ─ OR divider ─ */}
      {autoPhase === 'idle' && !hasActiveJob && (
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-white/30 text-xs font-bold px-2">أو اختر يدوياً</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      )}

      {/* ═══ MANUAL MODE ══════════════════════════════════════════════════════ */}
      {autoPhase === 'idle' && (
        <>
          {/* Stepper */}
          {!hasActiveJob && (
            <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1 no-scrollbar">
              {([1, 2, 3, 4, 5] as Step[]).map((s, i) => (
                <React.Fragment key={s}>
                  <button
                    onClick={() => step > s && setStep(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                      step === s  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-900/40' :
                      step > s    ? 'bg-emerald-500/20 text-emerald-300 cursor-pointer hover:bg-emerald-500/30' :
                      'bg-white/5 text-white/30'
                    }`}
                  >
                    {step > s ? <CheckCircle2 size={11} /> : <span>{s}</span>}
                    <span>{STEP_LABELS[s]}</span>
                  </button>
                  {i < 4 && <div className={`h-px flex-1 min-w-[8px] transition-colors ${step > s ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Step content */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl p-4 md:p-6 min-h-[440px]">
            <AnimatePresence mode="wait">

              {/* ── STEP 1: SURAH ── */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-black text-base flex items-center gap-2"><span className="text-lg">📖</span> اختر السورة</h2>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={smartPickSurah} disabled={smartSurahLoading || loadingSurahs}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-black disabled:opacity-50 transition-all"
                    >
                      {smartSurahLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      اختيار ذكي
                    </motion.button>
                  </div>
                  <div className="relative mb-3">
                    <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input value={surahSearch} onChange={e => setSurahSearch(e.target.value)} placeholder="ابحث باسم السورة أو رقمها..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-10 pl-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  {loadingSurahs
                    ? <div className="flex justify-center py-14"><Loader2 className="animate-spin text-emerald-400" size={28} /></div>
                    : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[310px] overflow-y-auto custom-scrollbar pr-0.5">
                        {filteredSurahs.map(s => (
                          <motion.button key={s.number} whileTap={{ scale: 0.97 }}
                            onClick={() => { setSelectedSurah(s); setStartAyah(1); const c = Math.round(selectedDuration / 6); setEndAyah(Math.min(c, s.numberOfAyahs)); }}
                            className={`text-right p-3 rounded-xl border transition-all ${selectedSurah?.number === s.number ? 'bg-emerald-500/20 border-emerald-500/50 shadow-sm shadow-emerald-900/20' : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'}`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-white/30 text-[10px] font-bold">{s.number}</span>
                              {selectedSurah?.number === s.number && <CheckCircle2 size={12} className="text-emerald-400" />}
                            </div>
                            <div className="font-black text-white text-sm">{s.name}</div>
                            <div className="text-[10px] text-white/35 mt-0.5">{s.englishName} · {s.numberOfAyahs} آية</div>
                          </motion.button>
                        ))}
                      </div>
                    )
                  }
                </motion.div>
              )}

              {/* ── STEP 2: DURATION ── */}
              {step === 2 && selectedSurah && (
                <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h2 className="text-white font-black text-base flex items-center gap-2 mb-1"><Timer size={18} className="text-amber-400" /> اختر مدة الفيديو</h2>
                  <p className="text-white/40 text-xs mb-5">سورة {selectedSurah.name} · {selectedSurah.numberOfAyahs} آية — الذكاء الاصطناعي يحسب عدد الآيات المناسب تلقائياً</p>

                  <div className="grid grid-cols-5 gap-2 mb-6">
                    {DURATION_OPTIONS.map(opt => (
                      <motion.button key={opt.seconds} whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDuration(opt.seconds)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all ${
                          selectedDuration === opt.seconds
                            ? 'bg-gradient-to-b from-emerald-500/30 to-teal-500/15 border-emerald-500/60 shadow-md shadow-emerald-900/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/8'
                        }`}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <span className={`font-black text-sm ${selectedDuration === opt.seconds ? 'text-emerald-300' : 'text-white/70'}`}>{opt.label}</span>
                        <span className={`text-[10px] ${selectedDuration === opt.seconds ? 'text-emerald-400/80' : 'text-white/30'}`}>{opt.desc}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Ayah range preview */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-white/50 text-xs">نطاق الآيات المقترح</p>
                        {calcEndAyahLoading && <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>}
                      </div>
                      <p className="text-white font-black text-lg">من {startAyah} إلى {endAyah} <span className="text-emerald-400 text-sm">({ayahCount} آية)</span></p>
                    </div>
                    <button onClick={() => setShowManualRange(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/60 font-bold transition-all"
                    >
                      <ChevronDown size={12} className={`transition-transform ${showManualRange ? 'rotate-180' : ''}`} /> ضبط يدوي
                    </button>
                  </div>

                  <AnimatePresence>
                    {showManualRange && (
                      <motion.div key="manual-range"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3 pb-2">
                          <label>
                            <span className="text-xs text-white/40 mb-1 block">من آية</span>
                            <input type="number" min={1} max={selectedSurah.numberOfAyahs} value={startAyah}
                              onChange={e => { const v = Math.max(1, Math.min(parseInt(e.target.value) || 1, selectedSurah.numberOfAyahs)); setStartAyah(v); setShowManualRange(true); }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm"
                            />
                          </label>
                          <label>
                            <span className="text-xs text-white/40 mb-1 block">إلى آية</span>
                            <input type="number" min={startAyah} max={selectedSurah.numberOfAyahs} value={endAyah}
                              onChange={e => { const v = Math.max(startAyah, Math.min(parseInt(e.target.value) || startAyah, selectedSurah.numberOfAyahs)); setEndAyah(v); }}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm"
                            />
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {ayahCount > 50 && (
                    <p className="text-rose-400 text-xs flex items-center gap-1 mt-1"><AlertTriangle size={13} /> الحد الأقصى 50 آية للفيديو الواحد</p>
                  )}
                </motion.div>
              )}

              {/* ── STEP 3: RECITER ── */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h2 className="text-white font-black text-base flex items-center gap-2 mb-4"><Music4 size={18} className="text-purple-400" /> اختر القارئ</h2>

                  {/* Featured reciters */}
                  {featuredReciters.filter(r => r.featured).length > 0 && (
                    <div className="mb-4">
                      <p className="text-white/40 text-xs font-bold mb-2 flex items-center gap-1"><Star size={11} className="text-amber-400" /> القراء المميزون</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {featuredReciters.filter(r => r.featured).map(fr => {
                          const full = reciters.find(r => r.identifier === fr.identifier);
                          const isSelected = selectedReciter?.identifier === fr.identifier;
                          return (
                            <motion.button key={fr.identifier} whileTap={{ scale: 0.96 }}
                              onClick={() => setSelectedReciter(full || { identifier: fr.identifier, name: fr.name, englishName: fr.arabicName })}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-right ${isSelected ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10 hover:bg-white/8'}`}
                            >
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg ${isSelected ? 'bg-purple-500/30' : 'bg-white/8'}`}>
                                🎙
                              </div>
                              <div className="min-w-0">
                                <p className={`font-black text-sm truncate ${isSelected ? 'text-purple-300' : 'text-white'}`}>{fr.name}</p>
                                {isSelected && <CheckCircle2 size={11} className="text-purple-400 mt-0.5" />}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* More reciters toggle */}
                  <button onClick={() => setShowAllReciters(v => !v)}
                    className="flex items-center gap-2 text-white/50 hover:text-white/80 text-xs font-bold mb-3 transition-colors"
                  >
                    <ChevronDown size={13} className={`transition-transform ${showAllReciters ? 'rotate-180' : ''}`} />
                    {showAllReciters ? 'إخفاء القائمة الكاملة' : 'المزيد من القراء'}
                  </button>

                  <AnimatePresence>
                    {showAllReciters && (
                      <motion.div key="all-reciters"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="relative mb-3">
                          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
                          <input value={reciterSearch} onChange={e => setReciterSearch(e.target.value)} placeholder="ابحث عن قارئ..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-10 pl-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                        {loadingReciters
                          ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-400" /></div>
                          : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pb-1">
                              {filteredReciters.map(r => (
                                <motion.button key={r.identifier} whileTap={{ scale: 0.97 }}
                                  onClick={() => setSelectedReciter(r)}
                                  className={`flex items-center gap-3 text-right p-2.5 rounded-xl border transition-all ${selectedReciter?.identifier === r.identifier ? 'bg-purple-500/20 border-purple-500/50' : 'bg-white/5 border-white/10 hover:bg-white/8'}`}
                                >
                                  <Music4 size={14} className={selectedReciter?.identifier === r.identifier ? 'text-purple-400' : 'text-white/30'} />
                                  <div>
                                    <div className="font-bold text-white text-xs">{r.name}</div>
                                    <div className="text-[10px] text-white/35">{r.englishName}</div>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          )
                        }
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── STEP 4: BACKGROUND ── */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h2 className="text-white font-black text-base flex items-center gap-2 mb-4">🎬 الخلفية</h2>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 p-1 bg-white/5 rounded-xl">
                    {[{ key: 'smart', icon: <Bot size={13} />, label: 'ذكي تلقائي' }, { key: 'manual', icon: <Search size={13} />, label: 'بحث يدوي' }].map(t => (
                      <button key={t.key} onClick={() => { setBgTab(t.key as any); setBgError(null); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-all ${bgTab === t.key ? 'bg-emerald-500 text-black shadow' : 'text-white/50 hover:text-white/80'}`}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Smart tab */}
                  {bgTab === 'smart' && (
                    <div>
                      {smartBgLoading && (
                        <div className="flex flex-col items-center py-10 gap-3">
                          <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping" />
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <Bot size={20} className="text-emerald-400" />
                            </div>
                          </div>
                          <p className="text-emerald-400 font-black text-sm">يحلل الآيات ويختار الخلفية...</p>
                        </div>
                      )}
                      {bgError && (
                        <div className="text-rose-400 text-sm flex items-start gap-2 mb-3">
                          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                          <div>
                            <p>{bgError}</p>
                            <button onClick={fetchSmartBg} className="text-white/50 hover:text-white underline text-xs mt-1">إعادة المحاولة</button>
                          </div>
                        </div>
                      )}
                      {!smartBgLoading && smartBgResult && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 size={15} className="text-emerald-400" />
                            <p className="text-emerald-300 font-black text-sm">تم اختيار الخلفية المناسبة</p>
                            <button onClick={() => { setSmartBgResult(null); setSelectedBg(null); fetchSmartBg(); }}
                              className="mr-auto flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/50 text-xs font-bold"
                            >
                              <RefreshCw size={11} /> تحديث
                            </button>
                          </div>
                          <div className="flex gap-4 items-center bg-white/5 border border-white/10 rounded-xl p-3">
                            <div className="w-16 h-28 rounded-lg overflow-hidden border border-white/20 shrink-0">
                              <img src={smartBgResult.image} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-white/40 text-[11px] mb-1">استُخدم البحث:</p>
                              <p className="text-white/70 text-xs italic mb-2">"{smartBgResult.query}"</p>
                              <p className="text-white/40 text-[11px]">جودة المقطع: {smartBgResult.width}×{smartBgResult.height}</p>
                              <p className="text-emerald-400/80 text-[10px] mt-0.5">* سيتم تكرار المقطع برمجياً ليطابق مدة الفيديو المطلوبة.</p>
                              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 rounded-full text-emerald-400 text-[10px] font-bold">
                                <Bot size={9} /> مختار بذكاء
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {!smartBgLoading && !smartBgResult && !bgError && (
                        <div className="flex flex-col items-center py-8 gap-3">
                          <Bot size={32} className="text-white/20" />
                          <p className="text-white/40 text-sm">سيتم اختيار الخلفية تلقائياً</p>
                          <button onClick={fetchSmartBg} className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-black">
                            اختر الآن
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual tab */}
                  {bgTab === 'manual' && (
                    <div>
                      <div className="flex gap-2 mb-3">
                        <input value={bgQuery} onChange={e => setBgQuery(e.target.value)}
                          placeholder="ابحث (مثال: mountains, ocean waves, forest)"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50"
                          onKeyDown={e => { if (e.key === 'Enter') searchManualBg(); }}
                        />
                        <button onClick={searchManualBg} className="px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-sm flex items-center gap-1.5 whitespace-nowrap">
                          <Search size={14} /> بحث
                        </button>
                      </div>
                      {loadingBg
                        ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-400" size={24} /></div>
                        : bgError
                          ? <p className="text-rose-400 text-sm flex items-center gap-2"><AlertTriangle size={14} /> {bgError}</p>
                          : backgrounds.length > 0
                            ? (
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-[260px] overflow-y-auto custom-scrollbar">
                                {backgrounds.map(b => (
                                  <motion.button key={b.id} whileTap={{ scale: 0.96 }} onClick={() => setSelectedBg(b)}
                                    className={`relative rounded-xl overflow-hidden border-2 aspect-[9/16] ${selectedBg?.id === b.id ? 'border-emerald-500' : 'border-transparent hover:border-white/30'}`}
                                  >
                                    <img src={b.image} className="w-full h-full object-cover" />
                                    {selectedBg?.id === b.id && <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center"><CheckCircle2 className="text-white" size={20} /></div>}
                                  </motion.button>
                                ))}
                              </div>
                            )
                            : (
                              <div className="flex flex-col items-center py-10 gap-2 text-white/30">
                                <Film size={28} />
                                <p className="text-sm">ابحث عن خلفية فيديو</p>
                              </div>
                            )
                      }
                    </div>
                  )}

                  {/* Outro */}
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <p className="text-white/40 text-xs font-bold mb-2 flex items-center gap-1"><Film size={11} /> مقطع الخاتمة</p>
                    <div className="flex flex-wrap gap-2">
                      {outros.map(o => (
                        <button key={o.id} onClick={() => setSelectedOutro(o.id)}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${selectedOutro === o.id ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/8'}`}
                        >
                          <Film size={11} className="inline ml-1" /> {o.label}
                        </button>
                      ))}
                      {outros.length === 0 && <p className="text-white/30 text-xs">لا توجد مقاطع خاتمة متاحة.</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5: GENERATE ── */}
              {step === 5 && (
                <motion.div key="s5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-center">
                  
                  {!hasActiveJob && (
                    <>
                      <h2 className="text-white font-black text-base mb-4 flex items-center justify-center gap-2"><Sparkles size={18} className="text-emerald-400" /> ملخص وإنشاء</h2>

                      <div className="grid grid-cols-2 gap-2 mb-5 text-right text-sm">
                        {[
                          { label: 'السورة', value: `${selectedSurah?.name} (${startAyah}–${endAyah})` },
                          { label: 'القارئ', value: selectedReciter?.name },
                          { label: 'الخلفية', value: bgTab === 'smart' ? `ذكية · ${smartBgResult?.query?.slice(0, 20) || ''}` : 'يدوية' },
                          { label: 'الخاتمة', value: outros.find(o => o.id === selectedOutro)?.label },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <p className="text-white/40 text-[10px] mb-0.5">{label}</p>
                            <p className="text-white font-bold text-xs truncate">{value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {!jobId && !genError && (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => startGeneration()}
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black shadow-lg shadow-emerald-900/30 text-base"
                    >
                      <Sparkles size={18} /> إنشاء الفيديو الآن
                    </motion.button>
                  )}

                  {jobId && jobStatus && jobStatus.status !== 'done' && !genError && (
                    <div className="flex flex-col items-center justify-center min-h-[340px] w-full max-w-lg mx-auto relative">
                      {/* Background Ambient Glow */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
                      
                      {/* Animated Center Icon */}
                      <div className="relative mb-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="w-24 h-24 rounded-full border border-dashed border-emerald-500/30 flex items-center justify-center"
                        >
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <Wand2 className="text-emerald-50" size={32} />
                          </div>
                        </motion.div>
                        {/* Orbiting particle */}
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0"
                        >
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-teal-300 rounded-full shadow-[0_0_10px_#5eead4]" />
                        </motion.div>
                      </div>

                      {/* Status Text */}
                      <AnimatePresence mode="wait">
                        <motion.h3 
                          key={jobStatus.message}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-teal-200 mb-6 text-center"
                        >
                          {jobStatus.message}
                        </motion.h3>
                      </AnimatePresence>

                      {/* Progress Bar Container */}
                      <div className="w-full mb-8">
                        <div className="h-4 bg-black/40 border border-white/10 rounded-full overflow-hidden p-0.5 shadow-inner">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 rounded-full relative"
                            animate={{ width: `${jobStatus.progress}%` }} 
                            transition={{ duration: 0.5, ease: "easeOut" }} 
                          >
                            {/* Shimmer effect inside progress bar */}
                            <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                          </motion.div>
                        </div>
                        <div className="flex justify-between items-center mt-2 px-1">
                          <span className="text-emerald-400/80 text-xs font-mono">{jobStatus.progress}%</span>
                          <span className="text-white/30 text-[10px] tracking-wider uppercase">جاري التوليد...</span>
                        </div>
                      </div>

                      {/* Explore Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={onBack}
                        className="group w-full md:w-auto relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-45deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                        <Compass className="text-emerald-400 group-hover:rotate-45 transition-transform duration-500" size={20} />
                        <span className="text-white font-bold text-sm md:text-base">استكشف الموقع بينما يجهز ريلزك</span>
                      </motion.button>
                      
                      <p className="text-emerald-400/40 text-[11px] mt-4 flex items-center gap-1.5">
                        <Sparkles size={10} /> سيظل الريلز قيد التجهيز وستتمكن من متابعة التقدم أعلى الشاشة
                      </p>
                    </div>
                  )}

                  {genError && (
                    <div className="max-w-sm mx-auto text-rose-400 text-sm flex flex-col items-center gap-3">
                      <AlertTriangle size={24} />
                      <p>{genError}</p>
                      <button onClick={() => { clearJob(); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white text-xs font-bold"
                      >
                        <RefreshCw size={13} /> إعادة المحاولة
                      </button>
                    </div>
                  )}

                  {resultUrl && (
                    <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6 w-full max-w-4xl mx-auto mt-4">
                      {/* Video Box */}
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', bounce: 0.3 }}
                        className="w-full max-w-xs shrink-0 z-20"
                      >
                        <div className="mb-3 flex items-center justify-center gap-2 text-emerald-400">
                          <CheckCircle2 size={18} /> <span className="font-black">اكتمل الفيديو!</span>
                        </div>
                        <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/30">
                          <video src={resultUrl} controls className="w-full aspect-[9/16]" />
                        </div>
                      </motion.div>

                      {/* Export Options Panel */}
                      <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.3 }}
                        className="w-full max-w-sm bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-center z-10 lg:mt-9"
                      >
                        <h3 className="text-white font-black text-xl mb-1 flex items-center gap-2">
                          <Download size={20} className="text-emerald-400" /> حفظ الفيديو
                        </h3>
                        <p className="text-white/40 text-sm mb-6">هل تريد تصديره؟ اختر الجودة المناسبة لجهازك</p>

                        <div className="flex flex-col gap-3">
                          {jobStatus?.outputs ? jobStatus.outputs.map((out) => {
                            const sizeLabel = out.sizeMb >= 1024 ? `${(out.sizeMb / 1024).toFixed(2)} GB` : `${out.sizeMb} MB`;
                            return (
                            <a 
                              key={out.quality}
                              href={`/api/reels/download/${jobId}?q=${out.quality}`}
                              download
                              className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-emerald-500/20 flex items-center justify-center text-white/50 group-hover:text-emerald-400 transition-colors">
                                  <Download size={18} />
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-bold text-sm">جودة {out.quality}</p>
                                  <p className="text-white/40 text-xs mt-0.5">
                                    {out.quality === '2K' ? 'فائقة الدقة (موصى بها للمنصات)' : out.quality === '1080p' ? 'عالية جداً' : out.quality === '720p' ? 'متوسطة' : 'عادية'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left">
                                <span className="px-2 py-1 bg-black/40 text-emerald-300 border border-emerald-500/20 rounded-md text-[11px] font-mono font-bold whitespace-nowrap" dir="ltr">
                                  {sizeLabel}
                                </span>
                              </div>
                            </a>
                          )}) : (
                            <div className="text-white/30 text-center py-6 text-sm flex items-center justify-center gap-2">
                              <Loader2 className="animate-spin shrink-0" size={16} /> جاري تجهيز الملفات...
                            </div>
                          )}
                        </div>

                        <button onClick={() => { setJobId(null); setJobStatus(null); setResultUrl(null); setGenError(null); setStep(1); setSelectedSurah(null); setSelectedReciter(null); setSelectedBg(null); setSmartBgResult(null); }}
                          className="mt-6 w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <RotateCcw size={16} /> ريلز جديد
                        </button>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Nav buttons */}
          {step !== 5 || (!jobId && !resultUrl) ? (
            <div className="flex justify-between mt-4">
              <button disabled={step === 1} onClick={() => setStep(s => (s - 1) as Step)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 disabled:opacity-30 font-bold text-sm hover:bg-white/8 transition-all"
              >
                <ArrowRight size={14} /> السابق
              </button>
              {step < 5 && (
                <motion.button whileTap={{ scale: 0.97 }} disabled={!canNext()} onClick={() => setStep(s => (s + 1) as Step)}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-30 disabled:pointer-events-none text-white font-black text-sm shadow-md shadow-emerald-900/30"
                >
                  التالي <Play size={13} />
                </motion.button>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};
