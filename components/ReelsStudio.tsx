import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight, Search, Play, Loader2, Film, Music4,
  Download, RefreshCw, CheckCircle2, AlertTriangle, Sparkles,
  Clapperboard, Clock, Wand2, Zap, Bot, ChevronDown, Star,
  RotateCcw, Timer,
} from 'lucide-react';

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
type AutoPhase = 'idle' | 'picking' | 'preview' | 'generating' | 'done' | 'error';

const DURATION_OPTIONS: Array<{ label: string; seconds: number; icon: string; desc: string }> = [
  { label: '٣٠ ث', seconds: 30,  icon: '⚡', desc: '~٥ آيات' },
  { label: '١ د',  seconds: 60,  icon: '⏱', desc: '~١٠ آيات' },
  { label: '١:٣٠', seconds: 90,  icon: '✨', desc: '~١٥ آية' },
  { label: '٢ د',  seconds: 120, icon: '🎬', desc: '~٢٠ آية' },
  { label: '٢:٣٠', seconds: 150, icon: '🌟', desc: '~٢٥ آية' },
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
  const [jobId, setJobId]             = useState<string | null>(null);
  const [jobStatus, setJobStatus]     = useState<{ status: string; progress: number; message: string; error?: string } | null>(null);
  const [resultUrl, setResultUrl]     = useState<string | null>(null);
  const [genError, setGenError]       = useState<string | null>(null);

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
    const count = Math.round(selectedDuration / 6);
    const end   = Math.min(startAyah + count - 1, selectedSurah.numberOfAyahs);
    setEndAyah(end);
  }, [selectedDuration, startAyah, selectedSurah, showManualRange]);

  // ── Smart background when entering step 4 ────────────────────────────────
  useEffect(() => {
    if (step === 4 && bgTab === 'smart' && !smartBgResult && selectedSurah) {
      fetchSmartBg();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, bgTab]);

  // ── Job poll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return;
    const iv = setInterval(async () => {
      try {
        const d = await fetch(`/api/reels/status/${jobId}`).then(r => r.json());
        setJobStatus(d);
        if (d.status === 'done')  { clearInterval(iv); setResultUrl(`/reels-media/${jobId}.mp4`); }
        if (d.status === 'error') { clearInterval(iv); setGenError(d.error || 'حدث خطأ'); }
      } catch { /* transient */ }
    }, 1500);
    return () => clearInterval(iv);
  }, [jobId]);

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
    setGenError(null); setResultUrl(null);
    setJobStatus({ status: 'queued', progress: 0, message: 'جارِ الإرسال...' });
    try {
      const d = await fetch('/api/reels/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      }).then(r => r.json());
      if (d.error) throw new Error(d.error);
      setJobId(d.jobId);
    } catch (e: any) { setGenError(e.message || 'حدث خطأ غير متوقع'); }
  };

  // ── Full Auto mode ────────────────────────────────────────────────────────
  const runAutoMode = useCallback(async () => {
    setAutoPhase('picking');
    setAutoError(null);
    setAutoPickResult(null);
    setAutoMsgIdx(0);
    try {
      const durationSeconds = [45, 60, 75, 90][Math.floor(Math.random() * 4)];
      const d = await fetch('/api/reels/ai-pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSeconds }),
      }).then(r => r.json());
      if (d.error) throw new Error(d.error);
      if (!d.background) throw new Error('PEXELS_API_KEY غير مُضاف — لا يمكن اختيار خلفية تلقائياً');
      setAutoPickResult(d);
      setAutoPhase('preview');
    } catch (e: any) {
      setAutoError(e.message || 'حدث خطأ');
      setAutoPhase('error');
    }
  }, []);

  const confirmAutoGenerate = async () => {
    if (!autoPickResult) return;
    const outros_ = outros.length ? outros : await fetch('/api/reels/outros').then(r => r.json()).catch(() => []);
    const outroId = outros_[0]?.id;
    if (!outroId) { setAutoError('لا توجد خاتمة متاحة'); setAutoPhase('error'); return; }

    setAutoPhase('generating');
    setJobId(null); setJobStatus(null); setResultUrl(null); setGenError(null);

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
    } catch (e: any) { setAutoError(e.message || 'فشل إنشاء الفيديو'); setAutoPhase('error'); }
  };

  // Watch jobId for auto mode completion
  useEffect(() => {
    if (autoPhase === 'generating' && jobStatus?.status === 'done') setAutoPhase('done');
  }, [autoPhase, jobStatus]);

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
        {autoPhase === 'idle' && (
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
                onClick={runAutoMode}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black rounded-xl shadow-lg shadow-emerald-900/40 whitespace-nowrap text-sm md:text-base"
              >
                <Zap size={18} /> إنشاء ريلز تلقائي
              </motion.button>
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

        {(autoPhase === 'generating' || autoPhase === 'done') && (
          <motion.div key="auto-gen"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 rounded-2xl border border-emerald-500/30 bg-white/[0.03] backdrop-blur-xl p-5"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-black mb-4">
              <Bot size={18} /> الذكاء الاصطناعي يُنشئ ريلزك...
            </div>
            {autoPhase === 'generating' && jobStatus && jobStatus.status !== 'done' && !genError && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="animate-spin text-emerald-400 shrink-0" size={20} />
                  <p className="text-white/70 text-sm">{jobStatus.message}</p>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    animate={{ width: `${jobStatus.progress}%` }} transition={{ duration: 0.5 }} />
                </div>
                <p className="text-white/30 text-xs mt-1 text-left">{jobStatus.progress}%</p>
              </div>
            )}
            {genError && (
              <div className="text-rose-400 text-sm flex items-center gap-2">
                <AlertTriangle size={16} /> {genError}
                <button onClick={() => { setAutoPhase('idle'); setJobId(null); setJobStatus(null); setGenError(null); }} className="ml-2 text-white/50 hover:text-white text-xs underline">
                  إعادة المحاولة
                </button>
              </div>
            )}
            {resultUrl && autoPhase === 'done' && (
              <div className="max-w-xs mx-auto text-center">
                <video src={resultUrl} controls className="w-full rounded-xl border border-white/10 aspect-[9/16] bg-black mb-4" />
                <div className="flex gap-2 justify-center">
                  <a href={resultUrl} download className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm">
                    <Download size={15} /> تنزيل
                  </a>
                  <button onClick={() => { setAutoPhase('idle'); setJobId(null); setJobStatus(null); setResultUrl(null); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold text-sm">
                    <RotateCcw size={14} /> ريلز جديد
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {autoPhase === 'error' && (
          <motion.div key="auto-error"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 flex items-start gap-3"
          >
            <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-rose-300 font-bold text-sm">{autoError}</p>
              <button onClick={() => setAutoPhase('idle')} className="text-white/50 hover:text-white text-xs mt-1 underline">
                العودة
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─ OR divider ─ */}
      {autoPhase === 'idle' && (
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
                      <p className="text-white/50 text-xs mb-0.5">نطاق الآيات المقترح</p>
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
                              <p className="text-white/40 text-[11px]">المدة: {smartBgResult.duration}ث · {smartBgResult.width}×{smartBgResult.height}</p>
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

                  {!jobId && !genError && (
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => startGeneration()}
                      className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black shadow-lg shadow-emerald-900/30 text-base"
                    >
                      <Sparkles size={18} /> إنشاء الفيديو الآن
                    </motion.button>
                  )}

                  {jobId && jobStatus && jobStatus.status !== 'done' && !genError && (
                    <div className="max-w-sm mx-auto">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <Loader2 className="animate-spin text-emerald-400 shrink-0" size={24} />
                        <p className="text-white/70 text-sm">{jobStatus.message}</p>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          animate={{ width: `${jobStatus.progress}%` }} transition={{ duration: 0.5 }} />
                      </div>
                      <p className="text-white/30 text-xs mt-1 text-left">{jobStatus.progress}%</p>
                    </div>
                  )}

                  {genError && (
                    <div className="max-w-sm mx-auto text-rose-400 text-sm flex flex-col items-center gap-3">
                      <AlertTriangle size={24} />
                      <p>{genError}</p>
                      <button onClick={() => { setJobId(null); setJobStatus(null); setGenError(null); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white text-xs font-bold"
                      >
                        <RefreshCw size={13} /> إعادة المحاولة
                      </button>
                    </div>
                  )}

                  {resultUrl && (
                    <div className="max-w-xs mx-auto">
                      <div className="mb-3 flex items-center justify-center gap-2 text-emerald-400">
                        <CheckCircle2 size={18} /> <span className="font-black">اكتمل الفيديو!</span>
                      </div>
                      <video src={resultUrl} controls className="w-full rounded-xl border border-white/10 aspect-[9/16] bg-black mb-4" />
                      <div className="flex gap-2 justify-center">
                        <a href={resultUrl} download className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-sm">
                          <Download size={15} /> تنزيل
                        </a>
                        <button onClick={() => { setJobId(null); setJobStatus(null); setResultUrl(null); setGenError(null); setStep(1); setSelectedSurah(null); setSelectedReciter(null); setSelectedBg(null); setSmartBgResult(null); }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold text-sm"
                        >
                          <RotateCcw size={13} /> ريلز جديد
                        </button>
                      </div>
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
