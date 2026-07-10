/**
 * AI-powered smart selection for Reels Studio.
 * Rule-based intelligence — no external AI API required.
 */

export interface SmartPassage {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  startAyah: number;
  endAyah: number;
  mood: string;
  backgroundQuery: string;
}

export interface SmartReciter {
  identifier: string;
  name: string;       // short Arabic display name
  arabicName: string; // full name
  featured: boolean;
}

// ───── Curated beautiful passages with moods and ideal background themes ─────
const CURATED_PASSAGES: Array<{
  surah: number; name: string; en: string;
  start: number; end: number;
  mood: string; bg: string;
}> = [
  // Very short (2-5 ayahs)
  { surah: 112, name: 'الإخلاص',   en: 'Al-Ikhlas',  start: 1,  end: 4,  mood: 'توحيد',  bg: 'infinite blue sky calm serene' },
  { surah: 103, name: 'العصر',     en: 'Al-Asr',     start: 1,  end: 3,  mood: 'حكمة',   bg: 'sunset golden hour warm light' },
  { surah: 108, name: 'الكوثر',    en: 'Al-Kawthar', start: 1,  end: 3,  mood: 'نعمة',   bg: 'flowing water river green' },
  { surah: 113, name: 'الفلق',     en: 'Al-Falaq',   start: 1,  end: 5,  mood: 'حماية',  bg: 'dawn light protection morning' },
  { surah: 114, name: 'الناس',     en: 'An-Nas',     start: 1,  end: 6,  mood: 'أمان',   bg: 'calm peaceful nature serene' },
  // Short (6-10 ayahs)
  { surah: 1,   name: 'الفاتحة',   en: 'Al-Fatiha',  start: 1,  end: 7,  mood: 'روحانية', bg: 'golden light morning peace mosque' },
  { surah: 94,  name: 'الشرح',     en: 'Ash-Sharh',  start: 1,  end: 8,  mood: 'تفاؤل',  bg: 'sunrise hope horizon dawn sky' },
  { surah: 93,  name: 'الضحى',     en: 'Ad-Duha',    start: 1,  end: 11, mood: 'أمل',    bg: 'golden sunrise warm beautiful' },
  { surah: 89,  name: 'الفجر',     en: 'Al-Fajr',    start: 1,  end: 10, mood: 'تذكر',   bg: 'dawn morning fog misty light' },
  { surah: 2,   name: 'البقرة',    en: 'Al-Baqarah', start: 255, end: 257, mood: 'قوة', bg: 'golden light rays sky divine' },
  // Medium (10-18 ayahs)
  { surah: 55,  name: 'الرحمن',    en: 'Ar-Rahman',  start: 1,  end: 13, mood: 'جمال',   bg: 'lush green nature garden paradise' },
  { surah: 55,  name: 'الرحمن',    en: 'Ar-Rahman',  start: 19, end: 35, mood: 'عجائب',  bg: 'ocean waves sea blue meeting water' },
  { surah: 67,  name: 'الملك',     en: 'Al-Mulk',    start: 1,  end: 14, mood: 'عظمة',   bg: 'mountains majestic peaks clouds' },
  { surah: 78,  name: 'النبأ',     en: 'An-Naba',    start: 1,  end: 16, mood: 'قدرة',   bg: 'mountains dramatic landscape sky' },
  { surah: 76,  name: 'الإنسان',   en: 'Al-Insan',   start: 1,  end: 12, mood: 'شكر',    bg: 'flowing water river green nature' },
  { surah: 36,  name: 'يس',        en: 'Ya-Sin',      start: 1,  end: 12, mood: 'تأمل',   bg: 'stars night sky cosmos peaceful' },
  { surah: 79,  name: 'النازعات',  en: 'An-Naziat',  start: 27, end: 33, mood: 'إعجاز',  bg: 'night sky stars universe cosmos' },
  { surah: 18,  name: 'الكهف',     en: 'Al-Kahf',    start: 1,  end: 10, mood: 'حكمة',   bg: 'cave waterfall nature wonder' },
  // Longer (18-30 ayahs)
  { surah: 19,  name: 'مريم',      en: 'Maryam',     start: 1,  end: 26, mood: 'عاطفة',  bg: 'gentle light soft nature green' },
  { surah: 26,  name: 'الشعراء',   en: 'Ash-Shuara',  start: 192, end: 220, mood: 'إيمان', bg: 'sky light horizon hope' },
];

/**
 * Estimate how many ayahs fit in a target duration.
 * Average tarteel recitation ≈ 6 seconds/ayah.
 */
export function durationToAyahCount(seconds: number): number {
  return Math.max(1, Math.round(seconds / 6));
}

/** Pick a curated passage closest to the target ayah count. */
export function pickSmartPassage(targetAyahs: number): SmartPassage {
  const min = Math.max(1, Math.floor(targetAyahs * 0.55));
  const max = Math.ceil(targetAyahs * 1.55);

  const candidates = CURATED_PASSAGES.filter((p) => {
    const n = p.end - p.start + 1;
    return n >= min && n <= max;
  });

  const pool = candidates.length > 0 ? candidates : CURATED_PASSAGES;
  const p = pool[Math.floor(Math.random() * pool.length)];

  return {
    surahNumber: p.surah,
    surahName: p.name,
    surahEnglishName: p.en,
    startAyah: p.start,
    endAyah: p.end,
    mood: p.mood,
    backgroundQuery: p.bg,
  };
}

// ───── Keyword extraction from Arabic ayah text ──────────────────────────────
const KEYWORD_RULES: Array<{ pattern: RegExp; keywords: string }> = [
  { pattern: /السماء|السماوات|عنان|سقف/, keywords: 'sky clouds blue heaven above' },
  { pattern: /البحر|الأنهار|نهر|بحار|الماء|الأنهار|الأنهر/, keywords: 'ocean waves river water flowing blue' },
  { pattern: /الجنة|جنات|الفردوس|عدن|نعيم/, keywords: 'lush garden paradise green flowers beautiful' },
  { pattern: /النور|ضياء|أضاء|مشكاة|سراج/, keywords: 'golden light rays glow sunrise luminous' },
  { pattern: /الليل|الظلام|أمسى|العتمة/, keywords: 'night stars dark peaceful sky serene' },
  { pattern: /الجبال|جبل|الجبل|الرواسي/, keywords: 'mountains majestic peaks landscape nature' },
  { pattern: /الشمس|الشمس|ضحاها/, keywords: 'sunrise golden sunshine warm beautiful' },
  { pattern: /القمر|قمر|هلال/, keywords: 'moon night peaceful sky glow silver' },
  { pattern: /النجوم|الكواكب|نجم|الثريا/, keywords: 'stars night sky cosmos universe milky way' },
  { pattern: /المطر|غيث|الغيث|سحاب/, keywords: 'rain drops water nature refresh clouds' },
  { pattern: /الريح|الرياح|عصف/, keywords: 'wind nature trees movement breeze' },
  { pattern: /الزرع|حرث|النبات|الثمرات|البستان/, keywords: 'green crops fields farmland nature harvest' },
  { pattern: /الفجر|الصبح|صبح|بكرة/, keywords: 'dawn morning fog misty sunrise tranquil' },
  { pattern: /المساء|العصر|الغروب|أصيل/, keywords: 'sunset golden hour warm evening twilight' },
  { pattern: /الطير|طيور|الغراب|الهدهد/, keywords: 'birds flying sky freedom nature' },
  { pattern: /الأرض|أرض|التراب/, keywords: 'earth nature landscape aerial aerial-view' },
  { pattern: /النار|جهنم|اللهب/, keywords: 'golden fire dramatic light warm glow' },
  { pattern: /الصحراء|الرمال|رمل/, keywords: 'desert sand dunes golden landscape' },
  { pattern: /الغابة|الأشجار|شجر|الخضراء/, keywords: 'forest trees green lush nature' },
];

/** Return Pexels search keywords based on Arabic ayah content. */
export function getBackgroundKeywords(arabicText: string): string {
  for (const { pattern, keywords } of KEYWORD_RULES) {
    if (pattern.test(arabicText)) return keywords;
  }
  return 'nature peaceful landscape serene calm';
}

// ───── Featured reciters (verified identifiers from alquran.cloud) ────────────
export const FEATURED_RECITERS: SmartReciter[] = [
  { identifier: 'ar.alafasy',             name: 'مشاري العفاسي',   arabicName: 'مشاري راشد العفاسي',          featured: true },
  { identifier: 'ar.abdulbasitmurattal',   name: 'عبد الباسط',      arabicName: 'عبد الباسط عبد الصمد',        featured: true },
  { identifier: 'ar.minshawi',            name: 'المنشاوي',        arabicName: 'محمد صديق المنشاوي',          featured: true },
  { identifier: 'ar.hudhaify',            name: 'الحذيفي',         arabicName: 'علي الحذيفي',                  featured: true },
  { identifier: 'ar.shaatree',            name: 'الشاطري',         arabicName: 'أبو بكر الشاطري',             featured: true },
  { identifier: 'ar.mahermuaiqly',        name: 'ماهر المعيقلي',   arabicName: 'ماهر بن حمد المعيقلي',        featured: true },
  { identifier: 'ar.saoodshuraym',        name: 'سعود الشريم',     arabicName: 'سعود بن إبراهيم الشريم',      featured: false },
  { identifier: 'ar.hanirifai',           name: 'هاني الرفاعي',   arabicName: 'هاني الرفاعي',                featured: false },
];

export function pickSmartReciter(): SmartReciter {
  const featured = FEATURED_RECITERS.filter((r) => r.featured);
  return featured[Math.floor(Math.random() * featured.length)];
}
