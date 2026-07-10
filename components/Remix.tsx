import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share2, Image as ImageIcon, Heart, Sparkles, User, Send, Check, Palette, Brush, Library, ExternalLink, RefreshCw, MessageSquare, UserPlus, Loader2, Star, ShieldCheck, PenTool, Utensils, ShoppingBag, Play, Search, Filter, ChevronLeft, Music, Upload, Trash2, Type, Sun, Moon, Crop, FlipHorizontal, GripHorizontal, Sticker } from 'lucide-react';
import { RAMADAN_RECIPES, Recipe } from '../data/ramadanRecipes';
import { RAMADAN_NASHEEDS } from '../data/nasheedsData';

const BG_COUNT = 132;
const BG_START = 1055;
const CARD_COUNT = 160;
const CARD_START = 1189;

const BACKGROUNDS = Array.from({ length: BG_COUNT }, (_, i) => `/background/IMG_${BG_START + i}.JPG`);

const cardIndexes = (() => {
  const exclude = new Set([1261, 1275, 1325, 1326, 1343]);
  const nums: number[] = [];
  for (let n = CARD_START; n <= CARD_START + CARD_COUNT - 1; n++) {
    if (!exclude.has(n)) nums.push(n);
  }
  return nums;
})();

const READY_CARDS = cardIndexes.map((n, i) => ({
  id: i + 1, url: `/cards/IMG_${n}.JPG`, title: `بطاقة ${i + 1}`
}));

const BASE = 'https://whatsapp.com/channel/0029VauX49o6WaKrquKvGJ3j';

const STICKER_PACKS = [
  { id: 1, name: 'فيض الرَّحْمَن', image: '/stickers/1.png', desc: 'فيض من رحمة الله وبركاته', count: 30, link: `${BASE}/680` },
  { id: 2, name: 'نُور الإيمان', image: '/stickers/2.png', desc: 'نور الإيمان يضيء القلب', count: 25, link: `${BASE}/682` },
  { id: 3, name: 'سَكِينَة القَلْب', image: '/stickers/3.png', desc: 'سكينة وراحة للبال', count: 28, link: `${BASE}/683` },
  { id: 4, name: 'عِطْر الجَنَّة', image: '/stickers/4.png', desc: 'عطر الجنة يفوح شذاه', count: 35, link: `${BASE}/677` },
  { id: 5, name: 'ضِيَاء الهُدَى', image: '/stickers/5.png', desc: 'ضياء الهدى يبدد الظلام', count: 22, link: `${BASE}/675` },
  { id: 6, name: 'رَوْح ورَيْحَان', image: '/stickers/6.png', desc: 'روح وريحان وجنة نعيم', count: 30, link: `${BASE}/678` },
  { id: 7, name: 'حَيَاة القُلُوب', image: '/stickers/7.png', desc: 'حياة القلوب بذكر الله', count: 25, link: `${BASE}/676` },
  { id: 8, name: 'بَرد السَّلَام', image: '/stickers/8.png', desc: 'سلام وأمان واطمئنان', count: 28, link: `${BASE}/681` },
  { id: 9, name: 'نَسَمَات الفَجْر', image: '/stickers/9.png', desc: 'نسمات الفجر تحمل الخير', count: 32, link: `${BASE}/679` },
];

const PHRASES = [
    "تقبل الله منا ومنكم صالح الأعمال", "جعلنا الله وإياكم من المقبولين", "هدانا الله وإياكم للتي هي أقوم", "اللهم بارك لنا في أعمالنا وبارك لنا في أعمارنا",
    "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة", "ربنا اغفر لنا ولوالدينا وللمؤمنين", "اللهم اجعلنا من الذين يستمعون القول فيتبعون أحسنه", "ربنا تقبل منا إنك أنت السميع العليم",
    "وفقنا الله لما يحب ويرضى", "اللهم اهدنا فيمن هديت وعافنا فيمن عافيت", "اللهم زدنا ولا تنقصنا وأكرمنا ولا تهنا", "نور الله قلبك بالإيمان وشرح صدرك بالقرآن",
    "بارك الله لك وبارك عليك وجمع بينكما في خير", "اللهم ألف بين قلوبنا وأصلح ذات بيننا", "اللهم ارزقنا حبك وحب من يحبك وحب كل عمل يقربنا إلى حبك",
    "كل عام وأنت بخير", "عيد مبارك تقبل الله منا ومنكم", "رمضان كريم", "جعله الله في ميزان حسناتك",
    "اللهم تقبل صالح أعمالنا", "الحمد لله على تمام النعمة", "اللهم صل على سيدنا محمد", "ربنا لا تؤاخذنا إن نسينا أو أخطأنا",
    "اللهم اجعل القرآن ربيع قلوبنا", "ربنا هب لنا من أزواجنا وذرياتنا قرة أعين", "اللهم إنا نسألك الهدى والتقى والعفاف والغنى", "لا إله إلا الله وحده لا شريك له"
];

const ARABIC_FONTS = [
  { name: 'Amiri', label: 'أميري', category: 'نَسْخ' },
  { name: 'Noto Kufi Arabic', label: 'نوتو كوفي', category: 'كوفي' },
  { name: 'Noto Naskh Arabic', label: 'نوتو نَسْخ', category: 'نَسْخ' },
  { name: 'Cairo', label: 'القاهرة', category: 'كوفي' },
  { name: 'Tajawal', label: 'تاجوال', category: 'حديث' },
  { name: 'Reem Kufi', label: 'ريم كوفي', category: 'كوفي' },
  { name: 'Scheherazade New', label: 'شهرزاد', category: 'نَسْخ' },
  { name: 'Lateef', label: 'لطيف', category: 'نَسْخ' },
  { name: 'Almarai', label: 'المراعي', category: 'حديث' },
  { name: 'El Messiri', label: 'المسيري', category: 'حديث' },
];

const CANVAS_SIZE = 1080;

interface TextEl {
  id: string;
  label: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  visible: boolean;
}

type TextId = 'message' | 'from' | 'to';

export const Remix: React.FC = () => {
    const [view, setView] = useState<'selection' | 'content'>('selection');
    const [activeTab, setActiveTab] = useState<'wallpapers' | 'cards' | 'recipes' | 'nasheeds' | 'stickers'>('wallpapers');
    const [cardSubTab, setCardSubTab] = useState<'create' | 'ready'>('ready');
    const [recipeCategory, setRecipeCategory] = useState<string>('الكل');
    const [recipeSearch, setRecipeSearch] = useState('');
    const [nasheedSearch, setNasheedSearch] = useState('');

    const [selectedCard, setSelectedCard] = useState(0);
    const [messageType, setMessageType] = useState<'standard' | 'random' | 'custom'>('standard');
    const [customMessage, setCustomMessage] = useState('');
    const [randomMessage, setRandomMessage] = useState(PHRASES[0]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [overlayImage, setOverlayImage] = useState<string | null>(null);
    const [selectedEl, setSelectedEl] = useState<TextId>('message');
    const [dragTarget, setDragTarget] = useState<TextId | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const [texts, setTexts] = useState<Record<TextId, TextEl>>({
      message: { id: 'message', label: 'النص الرئيسي', content: '', x: 50, y: 50, fontSize: 60, fontFamily: 'Amiri', color: '#ffffff', visible: true },
      to: { id: 'to', label: 'إلى', content: '', x: 50, y: 20, fontSize: 40, fontFamily: 'Noto Kufi Arabic', color: '#fbbf24', visible: true },
      from: { id: 'from', label: 'من', content: '', x: 50, y: 80, fontSize: 40, fontFamily: 'Noto Kufi Arabic', color: '#fbbf24', visible: true },
    });

    const updateText = (id: TextId, patch: Partial<TextEl>) => {
      setTexts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    };

    const getActiveMessage = () => {
        if (messageType === 'custom') return customMessage || 'اكتب تهنئتك الخاصة هنا...';
        if (messageType === 'random') return randomMessage;
        return texts.message.content || 'تقبل الله منا ومنكم صالح الأعمال';
    };

    useEffect(() => {
      const msg = getActiveMessage();
      if (texts.message.content !== msg) {
        updateText('message', { content: msg });
      }
    }, [messageType, customMessage, randomMessage]);

    const handleRandomize = () => {
        const idx = Math.floor(Math.random() * PHRASES.length);
        setRandomMessage(PHRASES[idx]);
        setMessageType('random');
    };

    const drawCanvas = useCallback(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await document.fonts.ready;
      const size = CANVAS_SIZE;
      canvas.width = size;
      canvas.height = size;
      ctx.clearRect(0, 0, size, size);

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, size, size);

      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = READY_CARDS[selectedCard].url;
      await new Promise<void>((resolve) => { bgImg.onload = () => resolve(); bgImg.onerror = () => resolve(); });

      if (bgImg.complete && bgImg.naturalWidth > 0) {
        const scale = Math.max(size / bgImg.naturalWidth, size / bgImg.naturalHeight);
        const sw = bgImg.naturalWidth * scale;
        const sh = bgImg.naturalHeight * scale;
        const sx = (size - sw) / 2;
        const sy = (size - sh) / 2;
        ctx.drawImage(bgImg, sx, sy, sw, sh);
      }

      if (overlayImage) {
        const ov = new Image();
        ov.src = overlayImage;
        await new Promise<void>((resolve) => { ov.onload = () => resolve(); ov.onerror = () => resolve(); });
        if (ov.complete && ov.naturalWidth > 0) {
          const ovSize = size * 0.3;
          ctx.drawImage(ov, size / 2 - ovSize / 2, size / 2 - ovSize / 2, ovSize, ovSize);
        }
      }

      const drawOrder: TextId[] = ['to', 'message', 'from'];
      for (const id of drawOrder) {
        const t = texts[id];
        if (!t.visible || !t.content) continue;
        const px = (t.x / 100) * size;
        const py = (t.y / 100) * size;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.fontSize}px "${t.fontFamily}", sans-serif`;

        const lines = t.content.split('\n').flatMap(line => {
          const words = line.split(' ');
          const wrapped: string[] = [];
          let cur = words[0] || '';
          for (let i = 1; i < words.length; i++) {
            const test = cur + ' ' + words[i];
            if (ctx.measureText(test).width < size * 0.8) { cur = test; }
            else { wrapped.push(cur); cur = words[i]; }
          }
          if (cur) wrapped.push(cur);
          return wrapped.length ? wrapped : [''];
        });

        const lineH = t.fontSize * 1.4;
        const startY = py - ((lines.length - 1) * lineH) / 2;
        lines.forEach((line, i) => {
          ctx.fillText(line, px, startY + i * lineH);
        });
        ctx.shadowBlur = 0;
      }

      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('نور الإسلام • بطاقات تهنئة', size / 2, size - 30);
    }, [selectedCard, overlayImage, texts]);

    const generateCard = async (action: 'download' | 'share') => {
        setIsGenerating(true);
        await drawCanvas();
        const canvas = canvasRef.current;
        if (!canvas) { setIsGenerating(false); return; }
        const dataUrl = canvas.toDataURL('image/png', 1.0);

        if (action === 'download') {
            const link = document.createElement('a');
            link.download = `NoorIslam_Card.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (action === 'share') {
            try {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'noorislam-card.png', { type: 'image/png' });
                if (navigator.share) {
                    await navigator.share({ files: [file], title: 'تهنئة من نور الإسلام' });
                }
            } catch (err) { console.error("Sharing failed", err); }
        }
        setIsGenerating(false);
    };

    const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setOverlayImage(reader.result as string);
      reader.readAsDataURL(file);
    };

    const handlePreviewPointerDown = (e: React.PointerEvent) => {
      if (!previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;

      let closest: TextId | null = null;
      let minDist = Infinity;
      for (const id of ['to', 'message', 'from'] as TextId[]) {
        const t = texts[id];
        if (!t.visible) continue;
        const dx = px - t.x;
        const dy = py - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) { minDist = dist; closest = id; }
      }
      if (closest && minDist < 15) {
        setDragTarget(closest);
        setSelectedEl(closest);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    };

    const handlePreviewPointerMove = (e: React.PointerEvent) => {
      if (!dragTarget || !previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const px = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const py = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      updateText(dragTarget, { x: Math.round(px * 10) / 10, y: Math.round(py * 10) / 10 });
    };

    const handlePreviewPointerUp = () => {
      setDragTarget(null);
    };

    const shareRemoteImage = async (url: string, title: string) => {
        setIsGenerating(true);
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], 'noor-card.jpg', { type: blob.type });
            if (navigator.share) {
                await navigator.share({ files: [file], title: title, text: `تهنئة من تطبيق نور الإسلام` });
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'noor-card.jpg';
                link.click();
            }
        } catch (err) { console.error("Sharing failed", err); }
        finally { setIsGenerating(false); }
    };

    const downloadRemoteImage = async (url: string, filename: string) => {
        setIsGenerating(true);
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'noor-card.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download failed", err);
            window.open(url, '_blank');
        } finally { setIsGenerating(false); }
    };

    const filteredRecipes = RAMADAN_RECIPES.filter(r => {
        const matchesCategory = recipeCategory === 'الكل' || r.category === recipeCategory;
        const matchesSearch = r.title.includes(recipeSearch) || r.ingredients.includes(recipeSearch);
        return matchesCategory && matchesSearch;
    });

    const recipeCategories = ['الكل', ...new Set(RAMADAN_RECIPES.map(r => r.category))];

    const mainCategories = [
        { id: 'wallpapers', icon: ImageIcon, label: 'خلفيات إسلامية', desc: 'أجمل الخلفيات لهاتفك', color: 'from-blue-500 to-indigo-600', delay: 0.1 },
        { id: 'cards', icon: Palette, label: 'بطاقات تهنئة', desc: 'بطاقات تهنئة وتصاميم إبداعية', color: 'from-emerald-500 to-teal-600', delay: 0.2 },
        { id: 'recipes', icon: Utensils, label: 'وصفات منزلية', desc: 'أشهى المأكولات والحلويات', color: 'from-orange-500 to-red-600', delay: 0.3 },
        { id: 'nasheeds', icon: Music, label: 'أناشيد إسلامية', desc: 'أجمل الأناشيد الإسلامية', color: 'from-purple-500 to-pink-600', delay: 0.4 },
        { id: 'stickers', icon: Sticker, label: 'ملصقات واتس', desc: 'باقات ملصقات إسلامية', color: 'from-rose-500 to-orange-600', delay: 0.5 }
    ];

    if (view === 'selection') {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 pb-32 space-y-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase glow-emerald">
                        <Sparkles size={12} className="animate-pulse" />
                        استوديو التصميم الإسلامي
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white premium-text-gradient leading-tight">
                        ماذا تريد أن <span className="text-emerald-500">تصمم؟</span>
                    </h1>
                </motion.div>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mainCategories.map((cat) => (
                        <motion.button key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: cat.delay, duration: 0.5 }} whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}
                            onClick={() => { setActiveTab(cat.id as any); setView('content'); }}
                            className="relative group h-40 md:h-56 rounded-[2rem] overflow-hidden border border-white/10 shadow-xl text-right">
                            <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-10 group-hover:opacity-30 transition-opacity duration-500`}></div>
                            <div className="absolute inset-0 backdrop-blur-sm bg-black/40 group-hover:bg-black/20 transition-colors duration-500"></div>
                            <div className="relative h-full p-5 md:p-6 flex flex-col justify-between items-end">
                                <div className={`p-3 rounded-2xl bg-gradient-to-br ${cat.color} shadow-lg group-hover:scale-110 transition-transform duration-500 glow-emerald`}><cat.icon size={20} className="text-white" /></div>
                                <div className="space-y-1">
                                    <h3 className="text-lg md:text-xl font-black text-white group-hover:text-emerald-400 transition-colors">{cat.label}</h3>
                                    <p className="text-gray-400 text-[10px] md:text-xs font-bold opacity-80 line-clamp-1">{cat.desc}</p>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 pb-32 space-y-8 overflow-x-hidden relative">
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-3 md:p-4 rounded-[2rem] border border-white/10 relative overflow-hidden backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl glow-emerald">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => setView('selection')} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all shadow-lg"><ChevronLeft size={18} className="rotate-180" /></button>
                    <div className="text-right space-y-0.5">
                        <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-black uppercase text-[8px]"><Sparkles size={10} className="animate-pulse" /><span>استوديو التصميم</span></div>
                        <h2 className="text-xl md:text-2xl font-black text-white premium-text-gradient leading-none">{mainCategories.find(c => c.id === activeTab)?.label}</h2>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {activeTab === 'wallpapers' && (
                    <motion.div key="wallpapers" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {BACKGROUNDS.map((url, idx) => (
                            <motion.div whileHover={{ y: -8, scale: 1.02 }} key={idx} className="group relative rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/50 aspect-[9/16] shadow-xl">
                                <img src={url} alt={`خلفية ${idx + 1}`} className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" referrerPolicy="no-referrer" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                                <div className="absolute bottom-4 left-3 right-3 flex items-center justify-between">
                                    <button onClick={(e) => { e.stopPropagation(); downloadRemoteImage(url, `Wallpaper_${idx + 1}.jpg`); }}
                                        className="bg-white/10 backdrop-blur-md text-white p-2 rounded-xl border border-white/10 hover:bg-white/20 transition-all active:scale-90"><Download size={14} /></button>
                                    <span className="text-[10px] font-black text-white drop-shadow-lg">خلفية {idx + 1}</span>
                                </div>
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-emerald-500/90 p-1.5 rounded-full"><Check size={12} className="text-white" /></div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'recipes' && (
                    <motion.div key="recipes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-8">
                        <div className="glass-panel p-4 md:p-5 border border-white/5 shadow-xl space-y-4">
                            <div className="relative group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-400 transition-all" size={18} />
                                <input type="text" placeholder="ابحث عن وصفة..." value={recipeSearch} onChange={(e) => setRecipeSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 py-3 pr-12 pl-4 text-white text-xs md:text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-right shadow-inner" />
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {recipeCategories.map(cat => (
                                    <button key={cat} onClick={() => setRecipeCategory(cat)}
                                        className={`px-4 py-2 font-black text-[10px] md:text-xs whitespace-nowrap transition-all border ${recipeCategory === cat ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300'}`}>{cat}</button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            {filteredRecipes.map((recipe, idx) => (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (idx % 10) * 0.05 }} whileHover={{ scale: 1.02 }} key={recipe.id}
                                    className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl group hover:border-emerald-500/50 transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10 group-hover:bg-emerald-500/20 transition-colors"></div>
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner"><Utensils size={20} /></div>
                                        <div className="text-right flex-1 space-y-1">
                                            <div className="inline-block px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400">{recipe.category}</div>
                                            <h3 className="text-lg md:text-xl font-black text-white leading-tight group-hover:text-emerald-400 transition-colors">{recipe.title}</h3>
                                        </div>
                                    </div>
                                    <div className="mt-5 p-4 bg-black/40 rounded-2xl border border-white/5 shadow-inner group-hover:bg-black/60 transition-colors">
                                        <p className="text-xs md:text-sm text-gray-300 font-bold leading-relaxed text-right line-clamp-2"><span className="text-emerald-500 font-black ml-1 text-[9px] opacity-60">المكونات:</span>{recipe.ingredients}</p>
                                    </div>
                                    <div className="mt-5 flex gap-3">
                                        <a href={recipe.youtubeUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex-1 h-11 md:h-12 bg-emerald-600 text-white font-black text-[10px] md:text-xs flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/40 active:scale-95"><Play size={16} fill="currentColor" /> طريقة التحضير</a>
                                        <button className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-95 border border-white/5"><Heart size={18} /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'nasheeds' && (
                    <motion.div key="nasheeds" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-8">
                        <div className="glass-panel p-4 md:p-5 border border-white/5 shadow-xl">
                            <div className="relative group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-400 transition-all" size={18} />
                                <input type="text" placeholder="ابحث عن أنشودة..." value={nasheedSearch} onChange={(e) => setNasheedSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 py-3 pr-12 pl-4 text-white text-xs md:text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-right shadow-inner" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {RAMADAN_NASHEEDS.filter(n => n.title.includes(nasheedSearch) || n.lyrics.includes(nasheedSearch)).map((nasheed, idx) => (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (idx % 15) * 0.03 }} whileHover={{ scale: 1.02 }} key={nasheed.id}
                                    className="glass-panel p-5 md:p-6 rounded-[2rem] border border-white/10 shadow-2xl group hover:border-purple-500/50 transition-all duration-500 relative overflow-hidden flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl -z-10 group-hover:bg-purple-500/10 transition-colors"></div>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-inner shrink-0"><Music size={20} /></div>
                                        <div className="text-right flex-1 space-y-1">
                                            <h3 className="text-base md:text-lg font-black text-white leading-tight group-hover:text-purple-400 transition-colors line-clamp-2">{nasheed.title}</h3>
                                            <p className="text-xs md:text-sm text-gray-400 font-medium italic">"{nasheed.lyrics}"</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex gap-3">
                                        <a href={nasheed.url} target="_blank" rel="noopener noreferrer"
                                            className="flex-1 h-11 md:h-12 bg-purple-600 text-white font-black text-[10px] md:text-xs flex items-center justify-center gap-2 hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/40 active:scale-95"><Play size={16} fill="currentColor" /> استماع الآن</a>
                                        <button className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-purple-500/20 hover:text-purple-400 transition-all active:scale-95 border border-white/5"><Heart size={18} /></button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'stickers' && (
                    <motion.div key="stickers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-8">
                        <div className="text-center space-y-2 mb-4">
                            <p className="text-xs md:text-sm text-gray-400 font-bold">اختر باقة ملصقات واتساب إسلامية لفتحها وتحميلها</p>
                            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                                <MessageSquare size={12} className="text-rose-500/40" />
                                <span>{STICKER_PACKS.length} باقات • كل منها 20+ ملصق</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {STICKER_PACKS.map((pack, idx) => (
                                <motion.a
                                    key={pack.id}
                                    href={pack.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08, duration: 0.4 }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="group relative rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/50 shadow-2xl block cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="aspect-[4/3] relative overflow-hidden">
                                        <img src={pack.image} alt={pack.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                                            loading="lazy" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                                        <div className="absolute top-3 left-3">
                                            <div className="px-2.5 py-1 bg-rose-500/80 backdrop-blur-md rounded-lg text-[9px] md:text-[11px] font-black text-white shadow-lg">
                                                {pack.count}+
                                            </div>
                                        </div>
                                        <div className="absolute top-3 right-3 p-1.5 bg-black/30 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <ExternalLink size={13} className="text-white/80" />
                                        </div>
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <div className="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <Sticker size={14} className="text-rose-400 shrink-0" />
                                                    <h3 className="text-[11px] md:text-sm font-black text-white text-right leading-tight">{pack.name}</h3>
                                                </div>
                                                <p className="text-[8px] md:text-[10px] text-gray-400 font-bold text-right mt-0.5 line-clamp-1">{pack.desc}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 md:p-4">
                                        <div className="flex items-center justify-between gap-2 bg-rose-600/20 hover:bg-rose-600/40 rounded-xl h-10 md:h-11 px-4 transition-all border border-rose-500/10">
                                            <MessageSquare size={13} className="text-rose-400 shrink-0" />
                                            <span className="text-[9px] md:text-xs font-black text-rose-300">فتح عبر واتساب</span>
                                        </div>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'cards' && (
                    <motion.div key="cards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-8">
                        <div className="flex justify-center">
                            <div className="bg-black/40 p-1 rounded-xl border border-white/5 flex gap-1 shadow-inner">
                                <button onClick={() => setCardSubTab('ready')}
                                    className={`px-6 py-2 rounded-lg font-black text-[10px] md:text-xs transition-all flex items-center gap-2 ${cardSubTab === 'ready' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><Library size={14} /> بطاقات جاهزة</button>
                                <button onClick={() => setCardSubTab('create')}
                                    className={`px-6 py-2 rounded-lg font-black text-[10px] md:text-xs transition-all flex items-center gap-2 ${cardSubTab === 'create' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><Brush size={14} /> صمم بطاقتك</button>
                            </div>
                        </div>

                        {cardSubTab === 'create' ? (
                            <div className="flex flex-col lg:flex-row gap-6 items-start">
                                {/* Canvas Preview */}
                                <div className="w-full lg:w-[45%] sticky top-24">
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="relative w-full max-w-[400px] mx-auto">
                                        <div ref={previewRef}
                                            onPointerDown={handlePreviewPointerDown}
                                            onPointerMove={handlePreviewPointerMove}
                                            onPointerUp={handlePreviewPointerUp}
                                            onPointerLeave={handlePreviewPointerUp}
                                            className="relative aspect-square rounded-[2rem] overflow-hidden border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing select-none"
                                            style={{ backgroundImage: `url(${READY_CARDS[selectedCard].url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                            {(['to', 'message', 'from'] as TextId[]).map(id => {
                                              const t = texts[id];
                                              if (!t.visible || !t.content) return null;
                                              return (
                                                <div key={id}
                                                  onClick={() => setSelectedEl(id)}
                                                  className={`absolute px-3 py-1.5 rounded-xl cursor-grab active:cursor-grabbing transition-shadow ${selectedEl === id ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30' : 'ring-0'}`}
                                                  style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)', fontFamily: t.fontFamily, fontSize: `${Math.max(10, t.fontSize * 0.12)}px`, color: t.color, textShadow: '0 2px 10px rgba(0,0,0,0.8)', fontWeight: 900, whiteSpace: 'nowrap', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl' }}>
                                                  {t.content || (id === 'message' ? 'النص' : id === 'to' ? 'المرسل إليه' : 'المرسل')}
                                                </div>
                                              );
                                            })}
                                            {overlayImage && (
                                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <img src={overlayImage} className="w-1/3 h-1/3 object-contain opacity-70" alt="overlay" />
                                              </div>
                                            )}
                                            <div className="absolute bottom-2 left-0 right-0 text-center">
                                              <span className="text-[6px] text-white/20 font-black">نور الإسلام • بطاقات تهنئة</span>
                                            </div>
                                            <canvas ref={canvasRef} className="hidden" />
                                        </div>
                                        <p className="text-[8px] text-gray-600 text-center mt-2 font-bold">اسحب النص لتغيير موقعه • اختر عنصراً من الأسفل لتعديله</p>
                                    </motion.div>
                                </div>

                                {/* Controls */}
                                <div className="w-full lg:w-[55%] glass-panel p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 space-y-5 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

                                    {/* Card Template Selector */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-emerald-500/40 text-[8px] font-black uppercase tracking-[0.2em]">Template</span>
                                            <p className="text-[10px] md:text-xs font-black text-white">اختر قالب البطاقة</p>
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                                            {READY_CARDS.slice(0, 24).map((card, idx) => (
                                                <button key={idx} onClick={() => setSelectedCard(idx)}
                                                    className={`w-14 h-20 md:w-16 md:h-22 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedCard === idx ? 'border-emerald-500 shadow-lg shadow-emerald-500/30 scale-110' : 'border-white/10 opacity-60 hover:opacity-100'}`}>
                                                    <img src={card.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[8px] text-gray-600">تم عرض 24 قالباً من أصل {READY_CARDS.length}</p>
                                    </div>

                                    {/* Text Inputs */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="relative group">
                                            <User className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/40 group-focus-within:text-amber-400 transition-all" size={14} />
                                            <input type="text" placeholder="اسم المرسل (من)" className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pr-10 pl-3 text-white text-xs font-bold focus:ring-2 focus:ring-amber-500/30 outline-none text-right shadow-inner transition-all"
                                              value={texts.from.content} onChange={(e) => updateText('from', { content: e.target.value })} maxLength={30} />
                                        </div>
                                        <div className="relative group">
                                            <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/40 group-focus-within:text-amber-400 transition-all" size={14} />
                                            <input type="text" placeholder="اسم المرسل إليه (إلى)" className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pr-10 pl-3 text-white text-xs font-bold focus:ring-2 focus:ring-amber-500/30 outline-none text-right shadow-inner transition-all"
                                              value={texts.to.content} onChange={(e) => updateText('to', { content: e.target.value })} maxLength={30} />
                                        </div>
                                        <div className="relative group">
                                            <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-400 transition-all" size={14} />
                                            <select value={messageType} onChange={(e) => setMessageType(e.target.value as any)}
                                              className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pr-10 pl-3 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none text-right shadow-inner transition-all appearance-none cursor-pointer">
                                              <option value="standard">نص افتراضي</option>
                                              <option value="random">عشوائي</option>
                                              <option value="custom">نص مخصص</option>
                                            </select>
                                        </div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {messageType === 'custom' ? (
                                            <motion.textarea key="custom" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                                placeholder="اكتب تهنئتك الخاصة هنا..." className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none text-right resize-none shadow-inner h-20 transition-all"
                                                value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} />
                                        ) : messageType === 'random' ? (
                                            <motion.div key="random" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                className="flex gap-3 items-center bg-black/60 p-3 rounded-2xl border border-white/10 shadow-inner">
                                                <button onClick={handleRandomize} className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-90 shrink-0"><RefreshCw size={16} /></button>
                                                <p className="text-[10px] md:text-xs text-gray-200 font-bold flex-1 text-right leading-relaxed">{randomMessage}</p>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>

                                    {/* Text Element Selector + Controls */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-emerald-500/40 text-[8px] font-black uppercase tracking-[0.2em]">Text Control</span>
                                            <p className="text-[10px] md:text-xs font-black text-white">تعديل النصوص</p>
                                        </div>
                                        <div className="flex gap-2">
                                          {(['message', 'to', 'from'] as TextId[]).map(id => {
                                            const t = texts[id];
                                            return (
                                              <button key={id} onClick={() => setSelectedEl(id)}
                                                className={`flex-1 py-2 px-2 rounded-xl font-black text-[9px] md:text-[10px] transition-all border ${selectedEl === id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/40 border-white/5 text-gray-500 hover:text-gray-300'}`}>
                                                {t.label}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {selectedEl && (
                                          <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <label className="text-[8px] text-gray-500 font-black block mb-1">X {texts[selectedEl].x}%</label>
                                                <input type="range" min="0" max="100" step="0.5" value={texts[selectedEl].x}
                                                  onChange={(e) => updateText(selectedEl, { x: parseFloat(e.target.value) })}
                                                  className="w-full accent-emerald-500" />
                                              </div>
                                              <div>
                                                <label className="text-[8px] text-gray-500 font-black block mb-1">Y {texts[selectedEl].y}%</label>
                                                <input type="range" min="0" max="100" step="0.5" value={texts[selectedEl].y}
                                                  onChange={(e) => updateText(selectedEl, { y: parseFloat(e.target.value) })}
                                                  className="w-full accent-emerald-500" />
                                              </div>
                                              <div>
                                                <label className="text-[8px] text-gray-500 font-black block mb-1">الحجم {texts[selectedEl].fontSize}</label>
                                                <input type="range" min="16" max="160" step="2" value={texts[selectedEl].fontSize}
                                                  onChange={(e) => updateText(selectedEl, { fontSize: parseInt(e.target.value) })}
                                                  className="w-full accent-emerald-500" />
                                              </div>
                                              <div>
                                                <label className="text-[8px] text-gray-500 font-black block mb-1">اللون</label>
                                                <input type="color" value={texts[selectedEl].color}
                                                  onChange={(e) => updateText(selectedEl, { color: e.target.value })}
                                                  className="w-full h-9 rounded-xl bg-transparent cursor-pointer border border-white/10" />
                                              </div>
                                            </div>
                                            <div>
                                              <label className="text-[8px] text-gray-500 font-black block mb-1">الخط</label>
                                              <select value={texts[selectedEl].fontFamily} onChange={(e) => updateText(selectedEl, { fontFamily: e.target.value })}
                                                className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none text-right appearance-none cursor-pointer">
                                                {ARABIC_FONTS.map(f => (
                                                  <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>{f.label} ({f.category})</option>
                                                ))}
                                              </select>
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <button onClick={() => updateText(selectedEl, { visible: !texts[selectedEl].visible })}
                                                className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all border ${texts[selectedEl].visible ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/40 border-white/5 text-gray-500'}`}>
                                                {texts[selectedEl].visible ? '🟢 ظاهر' : '🔴 مخفي'}
                                              </button>
                                              <span className="text-[8px] text-gray-600">اسحب النص على المعاينة لتغيير موقعه</span>
                                            </div>
                                          </div>
                                        )}
                                    </div>

                                    {/* Image Overlay */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-emerald-500/40 text-[8px] font-black uppercase tracking-[0.2em]">Overlay</span>
                                            <p className="text-[10px] md:text-xs font-black text-white">صورة إضافية</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <label className="flex items-center gap-2 px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 cursor-pointer transition-all">
                                            <Upload size={14} /> اختر صورة
                                            <input type="file" accept="image/*" className="hidden" onChange={handleOverlayUpload} />
                                          </label>
                                          {overlayImage && (
                                            <button onClick={() => setOverlayImage(null)} className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-400 hover:bg-red-500/20 transition-all"><Trash2 size={14} /> إزالة</button>
                                          )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <button onClick={() => generateCard('download')} disabled={isGenerating}
                                            className="h-12 md:h-14 bg-white text-black rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 hover:text-white transition-all shadow-2xl disabled:opacity-50 active:scale-95">
                                            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} حفظ
                                        </button>
                                        <button onClick={() => generateCard('share')} disabled={isGenerating}
                                            className="h-12 md:h-14 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-2xl disabled:opacity-50 active:scale-95">
                                            <Share2 size={18} /> مشاركة
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                {READY_CARDS.map((card, idx) => (
                                    <motion.div whileHover={{ y: -5 }} key={card.id}
                                        onClick={() => { setSelectedCard(idx); setCardSubTab('create'); }}
                                        className="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 aspect-[4/5] shadow-xl cursor-pointer">
                                        <img src={card.url} alt={card.title} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700" referrerPolicy="no-referrer" loading="lazy" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
                                            <h3 className="text-[10px] md:text-xs font-black text-white text-right truncate">{card.title}</h3>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); downloadRemoteImage(card.url, `Card_${card.id}.jpg`); }} className="flex-1 bg-white text-black py-2 rounded-lg font-black text-[8px] md:text-[10px] flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-all shadow-lg"><Download size={12} /> حفظ</button>
                                                <button onClick={(e) => { e.stopPropagation(); shareRemoteImage(card.url, card.title); }} className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white border border-white/10 hover:bg-white/20 transition-all"><Share2 size={12} /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
