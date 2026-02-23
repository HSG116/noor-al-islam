
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share2, Image as ImageIcon, Heart, Sparkles, User, Send, Check, Palette, Brush, Library, ExternalLink, RefreshCw, MessageSquare, UserPlus, Loader2, Star, ShieldCheck, PenTool, Utensils, ShoppingBag, Play, Search, Filter, ChevronLeft, Music } from 'lucide-react';
import { RAMADAN_RECIPES, Recipe } from '../data/ramadanRecipes';
import { RAMADAN_NASHEEDS } from '../data/nasheedsData';

const WALLPAPERS = [
    { id: 1, url: 'https://i.ibb.co/YBkCMMMd/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-7.jpg', title: 'جمال رمضان' },
    { id: 2, url: 'https://i.ibb.co/NnSnpF2c/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-8.jpg', title: 'هلال الخير' },
    { id: 3, url: 'https://i.ibb.co/21YGfkgt/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-9.jpg', title: 'نور الفانوس' },
    { id: 4, url: 'https://i.ibb.co/r2Njf5v2/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-10.jpg', title: 'روحانية مسجد' },
    { id: 5, url: 'https://i.ibb.co/xtb9NXSr/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-11.jpg', title: 'سكينة الروح' },
    { id: 6, url: 'https://i.ibb.co/KzwqWFCF/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-12.jpg', title: 'زينة رمضان' },
    { id: 7, url: 'https://i.ibb.co/BV3qZBw9/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-13.jpg', title: 'أجواء التراويح' },
    { id: 8, url: 'https://i.ibb.co/Dx4pXDD/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-14.jpg', title: 'بركة السحور' },
    { id: 9, url: 'https://i.ibb.co/7NTzVFv5/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-15.jpg', title: 'نفحات عطرة' },
];

const READY_CARDS = [
    { id: 101, url: 'https://i.ibb.co/RkRC4QzS/image.jpg', title: 'بشائر الخير' },
    { id: 102, url: 'https://i.ibb.co/Mym68R5V/1.jpg', title: 'نور الفانوس' },
    { id: 103, url: 'https://i.ibb.co/4wCqpPhd/2.jpg', title: 'هلال البركة' },
    { id: 104, url: 'https://i.ibb.co/Y4nc21wG/3.jpg', title: 'سكينة الروح' },
    { id: 105, url: 'https://i.ibb.co/bgvh94SB/4.jpg', title: 'أطياف رمضانية' },
    { id: 106, url: 'https://i.ibb.co/1tDvYtpD/5.jpg', title: 'ليالي الوتر' },
    { id: 107, url: 'https://i.ibb.co/chxHh9Ms/6.jpg', title: 'نور الهداية' },
    { id: 108, url: 'https://i.ibb.co/RpM7fnYd/7.jpg', title: 'فرحة الصائم' },
    { id: 109, url: 'https://i.ibb.co/Kx0WVKBq/image.jpg', title: 'جود الكريم' },
    { id: 110, url: 'https://i.ibb.co/H8q2DdK/image.jpg', title: 'زينة العمر' },
    { id: 111, url: 'https://i.ibb.co/jZvQLvVG/Ramadan-Kareem-to-all-Muslims-and-non-Muslims-1.jpg', title: 'رمضان يجمعنا' },
    { id: 112, url: 'https://i.ibb.co/Cpqm53sh/image.jpg', title: 'نسيم الصيام' },
];

const PHRASES = [
    "رمضان مبارك وكل عام وأنت بخير", "تقبل الله منا ومنكم صالح الأعمال", "أعاده الله علينا وعليكم باليمن والبركات", "كل رمضان وأنت إلى الله أقرب",
    "بلغك الله ليلة القدر وأسعدك مدى الدهر", "مبارك عليك الشهر وجعلنا الله من صوامه وقوامه", "عساكم من عواده، كل عام وأنتم بخير", "رمضان كريم، رزقك الله فيه الرحمة والمغفرة",
    "يا باغي الخير أقبل، شهر مبارك وسعيد", "جعل الله صيامكم مقبولاً وذنبكم مغفوراً", "أمانينا تسبق تهانينا وفرحتنا تسبق ليالينا ومبارك الشهر عليك وعلينا", "نور الله قلبك بالقرآن في هذا الشهر الفضيل"
];

const CARD_TEMPLATES = [
    { id: 1, name: 'فخامة', bg: '#020617', gradient: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', textColor: '#f8fafc', pattern: 'https://www.transparenttextures.com/patterns/islamic-art.png', accentColor: '#fbbf24', borderStyle: 'double' },
    { id: 2, name: 'زمرد', bg: '#064e3b', gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)', textColor: '#ffffff', pattern: 'https://www.transparenttextures.com/patterns/arabesque.png', accentColor: '#d4af37', borderStyle: 'solid' },
    { id: 3, name: 'تراث', bg: '#78350f', gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)', textColor: '#fffbeb', pattern: 'https://www.transparenttextures.com/patterns/handmade-paper.png', accentColor: '#fde68a', borderStyle: 'solid' },
    { id: 4, name: 'أرجواني', bg: '#4c1d95', gradient: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)', textColor: '#f5f3ff', pattern: 'https://www.transparenttextures.com/patterns/black-orchid.png', accentColor: '#e9d5ff', borderStyle: 'double' },
    { id: 5, name: 'ذهبي', bg: '#422006', gradient: 'linear-gradient(135deg, #422006 0%, #713f12 100%)', textColor: '#fef9c3', pattern: 'https://www.transparenttextures.com/patterns/stardust.png', accentColor: '#eab308', borderStyle: 'solid' },
    { id: 6, name: 'ليلي', bg: '#1e1b4b', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', textColor: '#e0e7ff', pattern: 'https://www.transparenttextures.com/patterns/skulls.png', accentColor: '#818cf8', borderStyle: 'double' },
    { id: 7, name: 'صحراء', bg: '#451a03', gradient: 'linear-gradient(135deg, #451a03 0%, #78350f 100%)', textColor: '#ffedd5', pattern: 'https://www.transparenttextures.com/patterns/handmade-paper.png', accentColor: '#fdba74', borderStyle: 'solid' },
    { id: 8, name: 'فجر', bg: '#134e4a', gradient: 'linear-gradient(135deg, #134e4a 0%, #115e59 100%)', textColor: '#ccfbf1', pattern: 'https://www.transparenttextures.com/patterns/subtle-zebra-3d.png', accentColor: '#5eead4', borderStyle: 'double' },
];

export const Remix: React.FC = () => {
    const [view, setView] = useState<'selection' | 'content'>('selection');
    const [activeTab, setActiveTab] = useState<'wallpapers' | 'cards' | 'recipes' | 'nasheeds'>('wallpapers');
    const [cardSubTab, setCardSubTab] = useState<'create' | 'ready'>('ready');
    const [recipeCategory, setRecipeCategory] = useState<string>('الكل');
    const [recipeSearch, setRecipeSearch] = useState('');
    const [nasheedSearch, setNasheedSearch] = useState('');
    
    // Create Card State
    const [fromName, setFromName] = useState('');
    const [toName, setToName] = useState('');
    const [messageType, setMessageType] = useState<'standard' | 'random' | 'custom'>('standard');
    const [customMessage, setCustomMessage] = useState('');
    const [randomMessage, setRandomMessage] = useState(PHRASES[0]);
    const [selectedTemplate, setSelectedTemplate] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const getActiveMessage = () => {
        if (messageType === 'custom') return customMessage || 'اكتب تهنئتك الخاصة هنا...';
        if (messageType === 'random') return randomMessage;
        return "رمضان مبارك وكل عام وأنت بخير";
    };

    const handleRandomize = () => {
        const idx = Math.floor(Math.random() * PHRASES.length);
        setRandomMessage(PHRASES[idx]);
        setMessageType('random');
    };

    const shareRemoteImage = async (url: string, title: string) => {
        setIsGenerating(true);
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], 'ramadan-card.jpg', { type: blob.type });

            if (navigator.share) {
                await navigator.share({
                    files: [file],
                    title: title,
                    text: `تهنئة من تطبيق نور الإسلام 🌙`
                });
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'ramadan-card.jpg';
                link.click();
            }
        } catch (err) {
            console.error("Sharing failed", err);
            alert('عذراً، فشل تحميل ملف الصورة للمشاركة.');
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadRemoteImage = async (url: string, filename: string) => {
        setIsGenerating(true);
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'ramadan-card.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download failed", err);
            window.open(url, '_blank');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateCard = async (action: 'download' | 'share') => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsGenerating(true);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        await document.fonts.ready;

        const template = CARD_TEMPLATES[selectedTemplate];
        const size = 1080;
        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, size, size);
        
        const parseColors = (str: string) => {
            const matches = str.match(/#[a-fA-F0-9]{6}/g);
            return matches || ['#000000', '#333333'];
        };
        const colors = parseColors(template.gradient);
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        try {
            const patternImg = new Image();
            patternImg.crossOrigin = "anonymous";
            patternImg.src = template.pattern;
            await new Promise((resolve) => { 
                patternImg.onload = resolve; 
                patternImg.onerror = resolve;
            });
            if (patternImg.complete && patternImg.naturalWidth > 0) {
                const pattern = ctx.createPattern(patternImg, 'repeat');
                if (pattern) {
                    ctx.globalAlpha = 0.12;
                    ctx.fillStyle = pattern;
                    ctx.fillRect(0, 0, size, size);
                    ctx.globalAlpha = 1.0;
                }
            }
        } catch (e) { console.error("Pattern overlay failed", e); }

        ctx.strokeStyle = template.accentColor;
        ctx.lineWidth = 15;
        ctx.strokeRect(50, 50, size - 100, size - 100);
        
        if (template.borderStyle === 'double') {
            ctx.lineWidth = 4;
            ctx.strokeRect(75, 75, size - 150, size - 150);
        }

        const drawOrnament = (x: number, y: number, rot: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);
            ctx.beginPath();
            ctx.lineWidth = 6;
            ctx.moveTo(0, 0);
            ctx.lineTo(100, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 100);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(10, 10, 4, 0, Math.PI * 2);
            ctx.fillStyle = template.accentColor;
            ctx.fill();
            ctx.restore();
        };

        drawOrnament(50, 50, 0);
        drawOrnament(size - 50, 50, Math.PI / 2);
        drawOrnament(size - 50, size - 50, Math.PI);
        drawOrnament(50, size - 50, -Math.PI / 2);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (toName) {
            ctx.font = 'bold 40px "Noto Kufi Arabic", sans-serif';
            ctx.fillStyle = template.textColor;
            ctx.globalAlpha = 0.6;
            ctx.fillText('إلى العزيز:', size / 2, 220);
            ctx.globalAlpha = 1.0;
            ctx.font = '900 80px "Noto Kufi Arabic", sans-serif';
            ctx.fillStyle = template.accentColor;
            ctx.fillText(toName, size / 2, 310);
        } else {
             ctx.font = 'bold 70px "Amiri", serif';
             ctx.fillStyle = template.accentColor;
             ctx.fillText('تهنئة خاصة', size / 2, 260);
        }

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = template.textColor;
        ctx.font = 'bold 75px "Amiri", serif';
        
        const wrapText = (text: string, maxWidth: number) => {
            const words = text.split(' ');
            const lines = [];
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                let testLine = currentLine + ' ' + words[i];
                if (ctx.measureText(testLine).width < maxWidth) {
                    currentLine = testLine;
                } else {
                    lines.push(currentLine);
                    currentLine = words[i];
                }
            }
            lines.push(currentLine);
            return lines;
        };

        const lines = wrapText(getActiveMessage(), 800);
        let startY = (size / 2) - ((lines.length - 1) * 60);
        lines.forEach((line, i) => {
            ctx.fillText(line, size / 2, startY + (i * 120));
        });

        ctx.shadowBlur = 0;

        if (fromName) {
            ctx.font = 'bold 35px "Noto Kufi Arabic", sans-serif';
            ctx.fillStyle = template.textColor;
            ctx.globalAlpha = 0.5;
            ctx.fillText('بكل ود ومحبة من:', size / 2, size - 260);
            ctx.globalAlpha = 1.0;
            ctx.font = '900 70px "Noto Kufi Arabic", sans-serif';
            ctx.fillStyle = template.accentColor;
            ctx.fillText(fromName, size / 2, size - 180);
        }

        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = template.textColor;
        ctx.globalAlpha = 0.2;
        ctx.fillText('نور الإسلام - ريمكس رمضان 🌙', size / 2, size - 80);
        ctx.globalAlpha = 1.0;

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
                    await navigator.share({ files: [file] });
                }
            } catch (err) { console.error("Sharing failed", err); }
        }
        setIsGenerating(false);
    };

    const filteredRecipes = RAMADAN_RECIPES.filter(r => {
        const matchesCategory = recipeCategory === 'الكل' || r.category === recipeCategory;
        const matchesSearch = r.title.includes(recipeSearch) || r.ingredients.includes(recipeSearch);
        return matchesCategory && matchesSearch;
    });

    const recipeCategories = ['الكل', ...new Set(RAMADAN_RECIPES.map(r => r.category))];

    const mainCategories = [
        { id: 'wallpapers', icon: ImageIcon, label: 'خلفيات رمضانية', desc: 'أجمل الخلفيات لهاتفك', color: 'from-blue-500 to-indigo-600', delay: 0.1 },
        { id: 'cards', icon: Palette, label: 'بطاقات تهنئة', desc: 'صمم وشارك تهنئتك', color: 'from-emerald-500 to-teal-600', delay: 0.2 },
        { id: 'recipes', icon: Utensils, label: 'وصفات رمضانية', desc: 'أشهى المأكولات والحلويات', color: 'from-orange-500 to-red-600', delay: 0.3 },
        { id: 'nasheeds', icon: Music, label: 'أناشيد الشهر', desc: 'أجمل الأناشيد الرمضانية', color: 'from-purple-500 to-pink-600', delay: 0.4 }
    ];

    if (view === 'selection') {
        return (
            <div className="w-full max-w-5xl mx-auto px-4 pb-32 space-y-8">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-3"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase glow-emerald">
                        <Sparkles size={12} className="animate-pulse" />
                        استوديو الإبداع الرمضاني
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white premium-text-gradient leading-tight">
                        ماذا تريد أن <span className="text-emerald-500">تكتشف؟</span>
                    </h1>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mainCategories.map((cat) => (
                        <motion.button
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: cat.delay, duration: 0.5 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setActiveTab(cat.id as any);
                                setView('content');
                            }}
                            className="relative group h-40 md:h-56 rounded-[2rem] overflow-hidden border border-white/10 shadow-xl text-right"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-10 group-hover:opacity-30 transition-opacity duration-500`}></div>
                            <div className="absolute inset-0 backdrop-blur-sm bg-black/40 group-hover:bg-black/20 transition-colors duration-500"></div>
                            
                            <div className="relative h-full p-5 md:p-6 flex flex-col justify-between items-end">
                                <div className={`p-3 rounded-2xl bg-gradient-to-br ${cat.color} shadow-lg group-hover:scale-110 transition-transform duration-500 glow-emerald`}>
                                    <cat.icon size={20} className="text-white" />
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-lg md:text-xl font-black text-white group-hover:text-emerald-400 transition-colors">{cat.label.split(' ')[0]}</h3>
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
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            {/* Header - Ultra Premium */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-3 md:p-4 rounded-[2rem] border border-white/10 relative overflow-hidden backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl glow-emerald"
            >
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setView('selection')}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-emerald-600 hover:border-emerald-500 transition-all shadow-lg"
                    >
                        <ChevronLeft size={18} className="rotate-180" />
                    </button>
                    <div className="text-right space-y-0.5">
                        <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-black tracking-[0.2em] uppercase text-[8px]">
                            <Sparkles size={10} className="animate-pulse" />
                            <span>استوديو ريمكس</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white premium-text-gradient leading-none">
                            {mainCategories.find(c => c.id === activeTab)?.label.split(' ')[0]}
                        </h2>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {activeTab === 'wallpapers' && (
                    <motion.div 
                        key="wallpapers"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
                    >
                        {WALLPAPERS.map((wp) => (
                                <motion.div 
                                    whileHover={{ y: -15, scale: 1.02 }}
                                    key={wp.id} 
                                    className="group relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-slate-900/50 aspect-[9/16] shadow-2xl"
                                >
                                    <img src={wp.url} alt={wp.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-125" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>
                                    
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-[-10px] group-hover:translate-y-0">
                                        <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                                            <Star size={16} fill="currentColor" />
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 left-4 right-4 flex flex-col gap-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                        <h3 className="text-sm md:text-lg font-black text-white text-right drop-shadow-2xl">{wp.title}</h3>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => downloadRemoteImage(wp.url, `Wallpaper_${wp.id}.jpg`)}
                                                className="flex-1 bg-white text-black py-2.5 rounded-xl font-black text-[10px] md:text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-all shadow-xl active:scale-95"
                                            >
                                                <Download size={14} />
                                                تحميل
                                            </button>
                                            <button 
                                                onClick={() => shareRemoteImage(wp.url, wp.title)}
                                                className="p-2.5 bg-white/10 backdrop-blur-xl rounded-xl text-white border border-white/20 hover:bg-white/20 transition-all active:scale-95"
                                            >
                                                <Share2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'recipes' && (
                    <motion.div 
                        key="recipes"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-8"
                    >
                        {/* Recipe Filters */}
                        <div className="glass-panel p-4 md:p-5 rounded-[1.5rem] border border-white/5 shadow-xl space-y-4">
                            <div className="relative group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-400 transition-all" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="ابحث عن وصفة..."
                                    value={recipeSearch}
                                    onChange={(e) => setRecipeSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pr-12 pl-4 text-white text-xs md:text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-right shadow-inner"
                                />
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {recipeCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setRecipeCategory(cat)}
                                        className={`px-4 py-2 rounded-lg font-black text-[10px] md:text-xs whitespace-nowrap transition-all border ${recipeCategory === cat ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recipe Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            {filteredRecipes.map((recipe, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (idx % 10) * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    key={recipe.id}
                                    className="glass-panel p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl group hover:border-emerald-500/50 transition-all duration-500 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10 group-hover:bg-emerald-500/20 transition-colors"></div>
                                    
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-inner">
                                            <Utensils size={20} />
                                        </div>
                                        <div className="text-right flex-1 space-y-1">
                                            <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest">{recipe.category}</div>
                                            <h3 className="text-lg md:text-xl font-black text-white leading-tight group-hover:text-emerald-400 transition-colors">{recipe.title}</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-5 p-4 bg-black/40 rounded-2xl border border-white/5 shadow-inner group-hover:bg-black/60 transition-colors">
                                        <p className="text-xs md:text-sm text-gray-300 font-bold leading-relaxed text-right line-clamp-2">
                                            <span className="text-emerald-500 font-black ml-1 text-[9px] uppercase tracking-widest opacity-60">المكونات:</span>
                                            {recipe.ingredients}
                                        </p>
                                    </div>
                                    
                                    <div className="mt-5 flex gap-3">
                                        <a 
                                            href={recipe.youtubeUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 h-11 md:h-12 bg-emerald-600 text-white rounded-xl font-black text-[10px] md:text-xs flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/40 active:scale-95"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            طريقة التحضير
                                        </a>
                                        <button className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-95 border border-white/5">
                                            <Heart size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'nasheeds' && (
                    <motion.div 
                        key="nasheeds"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-8"
                    >
                        {/* Nasheed Search */}
                        <div className="glass-panel p-4 md:p-5 rounded-[1.5rem] border border-white/5 shadow-xl">
                            <div className="relative group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-400 transition-all" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="ابحث عن أنشودة..."
                                    value={nasheedSearch}
                                    onChange={(e) => setNasheedSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pr-12 pl-4 text-white text-xs md:text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-right shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Nasheed Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {RAMADAN_NASHEEDS.filter(n => n.title.includes(nasheedSearch) || n.lyrics.includes(nasheedSearch)).map((nasheed, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (idx % 15) * 0.03 }}
                                    whileHover={{ scale: 1.02 }}
                                    key={nasheed.id}
                                    className="glass-panel p-5 md:p-6 rounded-[2rem] border border-white/10 shadow-2xl group hover:border-purple-500/50 transition-all duration-500 relative overflow-hidden flex flex-col justify-between"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl -z-10 group-hover:bg-purple-500/10 transition-colors"></div>
                                    
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                                            <Music size={20} />
                                        </div>
                                        <div className="text-right flex-1 space-y-1">
                                            <h3 className="text-base md:text-lg font-black text-white leading-tight group-hover:text-purple-400 transition-colors line-clamp-2">{nasheed.title}</h3>
                                            <p className="text-xs md:text-sm text-gray-400 font-medium italic">"{nasheed.lyrics}"</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 flex gap-3">
                                        <a 
                                            href={nasheed.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 h-11 md:h-12 bg-purple-600 text-white rounded-xl font-black text-[10px] md:text-xs flex items-center justify-center gap-2 hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/40 active:scale-95"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            استماع الآن
                                        </a>
                                        <button className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-purple-500/20 hover:text-purple-400 transition-all active:scale-95 border border-white/5">
                                            <Heart size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'cards' && (
                    <motion.div 
                        key="cards"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-8"
                    >
                        {/* Sub-Tabs */}
                        <div className="flex justify-center">
                            <div className="bg-black/40 p-1 rounded-xl border border-white/5 flex gap-1 shadow-inner">
                                <button 
                                    onClick={() => setCardSubTab('ready')}
                                    className={`px-6 py-2 rounded-lg font-black text-[10px] md:text-xs transition-all flex items-center gap-2 ${cardSubTab === 'ready' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Library size={14} />
                                    بطاقات جاهزة
                                </button>
                                <button 
                                    onClick={() => setCardSubTab('create')}
                                    className={`px-6 py-2 rounded-lg font-black text-[10px] md:text-xs transition-all flex items-center gap-2 ${cardSubTab === 'create' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Brush size={14} />
                                    صمم بطاقتك
                                </button>
                            </div>
                        </div>

                        {cardSubTab === 'create' ? (
                            <div className="flex flex-col lg:flex-row gap-8 items-start">
                                
                                {/* Preview Area */}
                                <div className="w-full lg:w-1/2 sticky top-24">
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="relative w-full max-w-[380px] mx-auto aspect-square rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-[8px] border-white/5 overflow-hidden group"
                                    >
                                        <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center relative" style={{ background: CARD_TEMPLATES[selectedTemplate].gradient }}>
                                            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: `url(${CARD_TEMPLATES[selectedTemplate].pattern})` }}></div>
                                            <div className={`absolute inset-6 border ${CARD_TEMPLATES[selectedTemplate].borderStyle === 'double' ? 'border-double border-6' : 'border-2'} opacity-20`} style={{ borderColor: CARD_TEMPLATES[selectedTemplate].accentColor }}></div>
                                            
                                            {/* Decorative Corners */}
                                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 opacity-30" style={{ borderColor: CARD_TEMPLATES[selectedTemplate].accentColor }}></div>
                                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 opacity-30" style={{ borderColor: CARD_TEMPLATES[selectedTemplate].accentColor }}></div>

                                            <div className="relative z-10 w-full space-y-6">
                                                {toName ? (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                        <p className="text-[10px] md:text-xs font-black opacity-60 mb-1 uppercase tracking-[0.1em]" style={{ color: CARD_TEMPLATES[selectedTemplate].textColor }}>إلى العزيز</p>
                                                        <h4 className="text-xl md:text-3xl font-black truncate px-4 drop-shadow-lg" style={{ color: CARD_TEMPLATES[selectedTemplate].accentColor }}>{toName}</h4>
                                                    </motion.div>
                                                ) : <Star size={32} className="mx-auto opacity-30 animate-spin-slow" style={{ color: CARD_TEMPLATES[selectedTemplate].accentColor }} />}

                                                <motion.p 
                                                    key={getActiveMessage()}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-lg md:text-2xl font-amiri font-bold leading-relaxed px-4 drop-shadow-md" 
                                                    style={{ color: CARD_TEMPLATES[selectedTemplate].textColor }}
                                                >
                                                    {getActiveMessage()}
                                                </motion.p>

                                                {fromName && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6 border-t border-white/10 w-2/3 mx-auto">
                                                        <p className="text-[10px] md:text-xs font-black opacity-60 mb-1 uppercase tracking-[0.1em]" style={{ color: CARD_TEMPLATES[selectedTemplate].textColor }}>بكل حب من</p>
                                                        <p className="text-lg md:text-xl font-black drop-shadow-lg" style={{ color: CARD_TEMPLATES[selectedTemplate].accentColor }}>{fromName}</p>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div className="absolute bottom-6 text-[8px] md:text-[10px] font-black opacity-30 tracking-[0.2em] uppercase" style={{ color: CARD_TEMPLATES[selectedTemplate].textColor }}>نور الإسلام • ريمكس رمضان</div>
                                        </div>
                                        <canvas ref={canvasRef} className="hidden"></canvas>
                                    </motion.div>
                                </div>

                                {/* Controls */}
                                <div className="w-full lg:w-1/2 glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 space-y-6 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <User className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-400 transition-all" size={16} />
                                            <input type="text" placeholder="اسم المرسل.." className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white text-xs md:text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none text-right shadow-inner transition-all" value={fromName} onChange={(e) => setFromName(e.target.value)} maxLength={20} />
                                        </div>
                                        <div className="relative group">
                                            <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-400 transition-all" size={16} />
                                            <input type="text" placeholder="اسم المرسل إليه.." className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white text-xs md:text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none text-right shadow-inner transition-all" value={toName} onChange={(e) => setToName(e.target.value)} maxLength={20} />
                                        </div>
                                    </div>

                                    {/* Message Type */}
                                    <div className="flex bg-black/60 p-1 rounded-2xl border border-white/10 shadow-inner">
                                        {[
                                            { id: 'standard', label: 'رسمي' },
                                            { id: 'random', label: 'عشوائي' },
                                            { id: 'custom', label: 'مخصص' }
                                        ].map((t) => (
                                            <button key={t.id} onClick={() => setMessageType(t.id as any)} className={`flex-1 py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all duration-500 ${messageType === t.id ? 'bg-emerald-600 text-white shadow-xl scale-105' : 'text-gray-500 hover:text-gray-300'}`}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {messageType === 'custom' ? (
                                            <motion.textarea 
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 5 }}
                                                placeholder="اكتب تهنئتك الرمضانية الخاصة هنا..." 
                                                className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-xs md:text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none text-right resize-none shadow-inner h-28 transition-all" 
                                                value={customMessage} 
                                                onChange={(e) => setCustomMessage(e.target.value)} 
                                            />
                                        ) : messageType === 'random' ? (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex gap-4 items-center bg-black/60 p-5 rounded-2xl border border-white/10 shadow-inner"
                                            >
                                                <button onClick={handleRandomize} className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-90"><RefreshCw size={18} /></button>
                                                <p className="text-[10px] md:text-xs text-gray-200 font-bold flex-1 text-right leading-relaxed">{randomMessage}</p>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>

                                    {/* Template Scroller */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-emerald-500/40 text-[8px] font-black uppercase tracking-[0.2em]">Style Selection</span>
                                            <p className="text-right text-[10px] md:text-xs font-black text-white">اختر نمط التصميم</p>
                                        </div>
                                        <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar px-1">
                                            {CARD_TEMPLATES.map((t, idx) => (
                                                <button 
                                                    key={t.id} 
                                                    onClick={() => setSelectedTemplate(idx)} 
                                                    className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl shrink-0 border-2 transition-all duration-500 relative shadow-xl ${selectedTemplate === idx ? 'border-emerald-500 scale-110 rotate-6 shadow-emerald-500/20' : 'border-white/10 opacity-40 hover:opacity-100 hover:scale-105'}`} 
                                                    style={{ background: t.gradient }} 
                                                >
                                                     {selectedTemplate === idx && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl"><Check size={20} className="text-white" /></div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <button onClick={() => generateCard('download')} disabled={isGenerating} className="h-12 md:h-14 bg-white text-black rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 hover:text-white transition-all shadow-2xl disabled:opacity-50 active:scale-95">
                                            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                            حفظ
                                        </button>
                                        <button onClick={() => generateCard('share')} disabled={isGenerating} className="h-12 md:h-14 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all shadow-2xl disabled:opacity-50 active:scale-95">
                                            <Share2 size={18} />
                                            مشاركة
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                {READY_CARDS.map((card) => (
                                    <motion.div 
                                        whileHover={{ y: -5 }}
                                        key={card.id} 
                                        className="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 aspect-[4/5] shadow-xl"
                                    >
                                        <img src={card.url} alt={card.title} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-all duration-700" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-4 left-3 right-3 flex flex-col gap-2">
                                            <h3 className="text-[10px] md:text-xs font-black text-white text-right truncate">{card.title}</h3>
                                            <div className="flex gap-2">
                                                <button onClick={() => downloadRemoteImage(card.url, `Card_${card.id}.jpg`)} className="flex-1 bg-white text-black py-2 rounded-lg font-black text-[8px] md:text-[10px] flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-all shadow-lg">
                                                    <Download size={12} />
                                                    حفظ
                                                </button>
                                                <button onClick={() => shareRemoteImage(card.url, card.title)} className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white border border-white/10 hover:bg-white/20 transition-all">
                                                    <Share2 size={12} />
                                                </button>
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
