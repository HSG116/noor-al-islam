import { getSurahAyahs } from './quranClient';
import ffprobeStatic from 'ffprobe-static';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ffprobePath = ffprobeStatic.path;

export async function getRemoteAudioDuration(url: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`"${ffprobePath}" -i "${url}" -show_entries format=duration -v quiet -of csv="p=0"`);
    const dur = parseFloat(stdout.trim());
    return isNaN(dur) ? 0 : dur;
  } catch {
    return 0;
  }
}

/**
 * Calculate the endAyah for a given surah/startAyah/reciter to match a target duration.
 * Uses actual audio file durations via ffprobe for precision.
 */
export async function calcEndAyah(
  surahNumber: number,
  startAyah: number,
  reciterEdition: string,
  targetSeconds: number
): Promise<{ endAyah: number; totalAudioSecs: number }> {
  const targetAudioSecs = Math.max(5, targetSeconds - 4); // 4s for outro
  let computedEnd = startAyah;
  let cumulativeSecs = 0;

  const { ayahs, surah } = await getSurahAyahs(surahNumber);

  for (let i = startAyah; i <= surah.numberOfAyahs; i += 5) {
    const batchAyahs = [];
    for (let j = 0; j < 5 && (i + j) <= surah.numberOfAyahs; j++) {
      const ayahData = ayahs.find(a => a.numberInSurah === (i + j));
      if (ayahData) batchAyahs.push(ayahData);
    }
    if (batchAyahs.length === 0) break;

    const urls = batchAyahs.map(a =>
      `https://cdn.islamic.network/quran/audio/128/${reciterEdition}/${a.number}.mp3`
    );
    const batchDurations = await Promise.all(urls.map(getRemoteAudioDuration));

    let batchDone = false;
    for (let k = 0; k < batchAyahs.length; k++) {
      const dur = batchDurations[k];
      const actualDur = dur > 0 ? dur : batchAyahs[k].text.length / 11.5;
      cumulativeSecs += actualDur;
      computedEnd = batchAyahs[k].numberInSurah;

      if (cumulativeSecs >= targetAudioSecs || (computedEnd - startAyah + 1) >= 50) {
        batchDone = true;
        break;
      }
    }
    if (batchDone) break;
  }

  console.log(
    `[calcEndAyah] surah=${surahNumber} start=${startAyah} end=${computedEnd} ` +
    `audioSecs=${cumulativeSecs.toFixed(1)}s target=${targetAudioSecs}s`
  );

  return { endAyah: computedEnd, totalAudioSecs: cumulativeSecs };
}

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

// ───── Curated beautiful passages ─────────────────────────────────────────
// Deliberately biased toward deep, moving verses drawn from mid-Quran /
// mid-surah positions (juz 4 and beyond), never the opening ayah of a surah
// unless the surah itself is very short and the opening IS the powerful part.
const CURATED_PASSAGES: Array<{
  surah: number; name: string; en: string;
  start: number; end: number;
  mood: string; bg: string;
}> = [
  // ── Very short, complete surahs (their entirety is the powerful part) ──
  { surah: 112, name: 'الإخلاص',   en: 'Al-Ikhlas',  start: 1,  end: 4,  mood: 'توحيد',   bg: 'infinite blue sky calm serene galaxy' },
  { surah: 113, name: 'الفلق',     en: 'Al-Falaq',   start: 1,  end: 5,  mood: 'حماية',   bg: 'dark forest moonlight night mysterious' },
  { surah: 114, name: 'الناس',     en: 'An-Nas',     start: 1,  end: 6,  mood: 'أمان',    bg: 'calm peaceful nature serene fog' },
  { surah: 108, name: 'الكوثر',    en: 'Al-Kawthar', start: 1,  end: 3,  mood: 'نعمة',    bg: 'flowing river crystal water green' },
  { surah: 103, name: 'العصر',     en: 'Al-Asr',     start: 1,  end: 3,  mood: 'حكمة',    bg: 'sunset golden hour warm light time' },

  // ── Juz 1-3: middle of Al-Baqarah / Aal-Imran, never the opening ──
  { surah: 2,  name: 'البقرة', en: 'Al-Baqarah', start: 255, end: 257, mood: 'قوة عظيمة',  bg: 'majestic golden light rays divine sky' },
  { surah: 2,  name: 'البقرة', en: 'Al-Baqarah', start: 284, end: 286, mood: 'رحمة وطمأنينة', bg: 'soft clouds sunrise calm hope' },
  { surah: 2,  name: 'البقرة', en: 'Al-Baqarah', start: 152, end: 157, mood: 'صبر',        bg: 'mountain storm resilience dramatic sky' },
  { surah: 3,  name: 'آل عمران', en: 'Aal-Imran', start: 190, end: 195, mood: 'تفكر',       bg: 'night sky stars cosmos wonder' },
  { surah: 3,  name: 'آل عمران', en: 'Aal-Imran', start: 26, end: 27,  mood: 'ملك الله',   bg: 'sunset over city golden power' },

  // ── Juz 4+: deep verses, mid-surah, emotional or majestic ──
  { surah: 6,  name: 'الأنعام', en: 'Al-Anam',    start: 95, end: 99,   mood: 'تدبر',      bg: 'seeds sprouting growth green nature timelapse' },
  { surah: 6,  name: 'الأنعام', en: 'Al-Anam',    start: 59, end: 60,   mood: 'علم الغيب', bg: 'deep ocean dark mysterious blue underwater' },
  { surah: 7,  name: 'الأعراف', en: 'Al-Araf',    start: 54, end: 56,   mood: 'خلق',        bg: 'day to night timelapse sky earth' },
  { surah: 7,  name: 'الأعراف', en: 'Al-Araf',    start: 179, end: 179, mood: 'تذكر',       bg: 'desert dunes golden vast landscape' },
  { surah: 9,  name: 'التوبة', en: 'At-Tawbah',   start: 40, end: 40,   mood: 'نصر',        bg: 'cave mountain quiet dramatic light' },
  { surah: 10, name: 'يونس',   en: 'Yunus',       start: 24, end: 25,   mood: 'مثل الدنيا', bg: 'rain falling on green field nature' },
  { surah: 12, name: 'يوسف',   en: 'Yusuf',       start: 86, end: 87,   mood: 'أمل',        bg: 'sunrise horizon hope golden light' },
  { surah: 13, name: 'الرعد',  en: 'Ar-Rad',      start: 28, end: 29,   mood: 'طمأنينة',    bg: 'calm lake reflection peaceful morning' },
  { surah: 14, name: 'إبراهيم', en: 'Ibrahim',    start: 24, end: 27,   mood: 'ثبات',       bg: 'tall tree roots strong nature' },
  { surah: 16, name: 'النحل',  en: 'An-Nahl',     start: 78, end: 81,   mood: 'نعمة',       bg: 'bees flowers garden nature macro' },
  { surah: 16, name: 'النحل',  en: 'An-Nahl',     start: 90, end: 90,   mood: 'عدل',        bg: 'balance scale light symmetry sky' },
  { surah: 17, name: 'الإسراء', en: 'Al-Isra',    start: 23, end: 25,   mood: 'بر الوالدين', bg: 'warm sunlight home peaceful nature' },
  { surah: 17, name: 'الإسراء', en: 'Al-Isra',    start: 78, end: 79,   mood: 'قيام الليل', bg: 'night sky stars mosque silhouette' },
  { surah: 18, name: 'الكهف',  en: 'Al-Kahf',     start: 45, end: 46,   mood: 'زوال الدنيا', bg: 'wilted flowers wind field time' },
  { surah: 18, name: 'الكهف',  en: 'Al-Kahf',     start: 109, end: 110, mood: 'عظمة كلام الله', bg: 'vast ocean horizon endless blue' },
  { surah: 19, name: 'مريم',   en: 'Maryam',      start: 16, end: 26,   mood: 'عاطفة',      bg: 'gentle palm tree desert soft light' },
  { surah: 19, name: 'مريم',   en: 'Maryam',      start: 96, end: 96,   mood: 'محبة',       bg: 'soft golden light warm glow nature' },
  { surah: 20, name: 'طه',     en: 'Ta-Ha',       start: 124, end: 126, mood: 'إعراض',      bg: 'narrow dark path forest shadows' },
  { surah: 21, name: 'الأنبياء', en: 'Al-Anbiya', start: 30, end: 33,   mood: 'خلق الكون',  bg: 'galaxy stars universe cosmic timelapse' },
  { surah: 21, name: 'الأنبياء', en: 'Al-Anbiya', start: 87, end: 88,   mood: 'استغاثة',    bg: 'deep sea dark waves dramatic' },
  { surah: 22, name: 'الحج',   en: 'Al-Hajj',     start: 1, end: 2,     mood: 'خشية',       bg: 'dark storm clouds dramatic sky powerful' },
  { surah: 23, name: 'المؤمنون', en: 'Al-Muminun', start: 12, end: 14,  mood: 'خلق الإنسان', bg: 'macro cells biology light abstract' },
  { surah: 24, name: 'النور',  en: 'An-Nur',      start: 35, end: 35,   mood: 'نور',        bg: 'golden light rays glow through window' },
  { surah: 25, name: 'الفرقان', en: 'Al-Furqan',  start: 63, end: 67,   mood: 'صفات المؤمنين', bg: 'calm walking path nature humble' },
  { surah: 26, name: 'الشعراء', en: 'Ash-Shuara', start: 192, end: 220, mood: 'إيمان',      bg: 'sky light horizon hope clouds' },
  { surah: 27, name: 'النمل',  en: 'An-Naml',     start: 88, end: 88,   mood: 'حركة الجبال', bg: 'clouds moving timelapse sky mountains' },
  { surah: 28, name: 'القصص',  en: 'Al-Qasas',    start: 77, end: 77,   mood: 'اعتدال',     bg: 'balanced nature green field walking' },
  { surah: 29, name: 'العنكبوت', en: 'Al-Ankabut', start: 2, end: 3,    mood: 'ابتلاء',     bg: 'stormy sea waves testing dramatic' },
  { surah: 29, name: 'العنكبوت', en: 'Al-Ankabut', start: 41, end: 41,  mood: 'ضعف الدنيا', bg: 'spider web dew morning macro nature' },
  { surah: 30, name: 'الروم',  en: 'Ar-Rum',      start: 21, end: 21,   mood: 'مودة ورحمة', bg: 'sunset couple silhouette warm calm' },
  { surah: 31, name: 'لقمان',  en: 'Luqman',      start: 13, end: 19,   mood: 'وصية أب',    bg: 'father walking path guidance nature' },
  { surah: 33, name: 'الأحزاب', en: 'Al-Ahzab',   start: 21, end: 21,   mood: 'قدوة',       bg: 'quiet mosque silhouette peaceful light' },
  { surah: 34, name: 'سبأ',    en: 'Saba',        start: 10, end: 11,   mood: 'تسبيح',      bg: 'mountains echo majestic peaks clouds' },
  { surah: 35, name: 'فاطر',   en: 'Fatir',       start: 27, end: 28,   mood: 'تنوع الخلق', bg: 'colorful mountains snow nature diverse' },
  { surah: 36, name: 'يس',     en: 'Ya-Sin',      start: 37, end: 40,   mood: 'آيات كونية', bg: 'sun moon eclipse cosmic timelapse' },
  { surah: 36, name: 'يس',     en: 'Ya-Sin',      start: 77, end: 83,   mood: 'إعجاز',      bg: 'stars night sky cosmos deep space' },
  { surah: 37, name: 'الصافات', en: 'As-Saffat', start: 6, end: 10,     mood: 'زينة السماء', bg: 'stars night sky shooting star' },
  { surah: 39, name: 'الزمر',  en: 'Az-Zumar',    start: 53, end: 54,   mood: 'رجاء',       bg: 'sunrise hope warm light horizon' },
  { surah: 39, name: 'الزمر',  en: 'Az-Zumar',    start: 73, end: 73,   mood: 'جنة',        bg: 'lush garden paradise flowers green gate' },
  { surah: 40, name: 'غافر',   en: 'Ghafir',      start: 60, end: 60,   mood: 'دعاء',       bg: 'hands raised dua sunset silhouette' },
  { surah: 41, name: 'فصلت',   en: 'Fussilat',    start: 30, end: 32,   mood: 'استقامة',    bg: 'calm path light steady walking nature' },
  { surah: 41, name: 'فصلت',   en: 'Fussilat',    start: 53, end: 53,   mood: 'آيات الآفاق', bg: 'earth from space horizon aerial' },
  { surah: 42, name: 'الشورى', en: 'Ash-Shura',   start: 19, end: 19,   mood: 'لطف',        bg: 'gentle rain green field soft light' },
  { surah: 44, name: 'الدخان', en: 'Ad-Dukhan',   start: 38, end: 39,   mood: 'حكمة الخلق', bg: 'sky clouds heaven majestic light' },
  { surah: 45, name: 'الجاثية', en: 'Al-Jathiyah', start: 3, end: 5,    mood: 'تفكر بالكون', bg: 'sky clouds day night timelapse' },
  { surah: 50, name: 'ق',      en: 'Qaf',         start: 16, end: 18,   mood: 'قرب الله',   bg: 'quiet desert night stars close up' },
  { surah: 50, name: 'ق',      en: 'Qaf',         start: 6, end: 11,    mood: 'تدبر السماء', bg: 'blue sky clouds stars vast heaven' },
  { surah: 51, name: 'الذاريات', en: 'Adh-Dhariyat', start: 47, end: 49, mood: 'خلق الكون', bg: 'universe expanding stars galaxy' },
  { surah: 52, name: 'الطور',  en: 'At-Tur',      start: 35, end: 37,   mood: 'يقين',       bg: 'mountain peak clouds majestic sky' },
  { surah: 54, name: 'القمر',  en: 'Al-Qamar',    start: 49, end: 55,   mood: 'قدر',        bg: 'moon night sky glow silver serene' },
  { surah: 55, name: 'الرحمن', en: 'Ar-Rahman',   start: 1,  end: 13,   mood: 'جمال',       bg: 'lush green nature garden paradise waterfall' },
  { surah: 55, name: 'الرحمن', en: 'Ar-Rahman',   start: 19, end: 25,   mood: 'عجائب',      bg: 'ocean waves meeting horizon blue' },
  { surah: 55, name: 'الرحمن', en: 'Ar-Rahman',   start: 33, end: 36,   mood: 'تحدي',       bg: 'space stars galaxy vast night sky' },
  { surah: 56, name: 'الواقعة', en: 'Al-Waqiah',  start: 1,  end: 10,   mood: 'خشوع',       bg: 'dramatic sky storm powerful clouds' },
  { surah: 56, name: 'الواقعة', en: 'Al-Waqiah',  start: 68, end: 74,   mood: 'نعمة الماء', bg: 'clean water pouring nature fresh' },
  { surah: 57, name: 'الحديد', en: 'Al-Hadid',    start: 20, end: 20,   mood: 'زوال الدنيا', bg: 'green field wind time passing golden' },
  { surah: 57, name: 'الحديد', en: 'Al-Hadid',    start: 4,  end: 4,    mood: 'إحاطة',      bg: 'earth from space aerial vast blue' },
  { surah: 59, name: 'الحشر',  en: 'Al-Hashr',    start: 21, end: 24,   mood: 'عظمة',       bg: 'mountains majestic clouds powerful' },
  { surah: 62, name: 'الجمعة', en: 'Al-Jumuah',   start: 9,  end: 10,   mood: 'سعي',        bg: 'sunset mosque silhouette peaceful' },
  { surah: 65, name: 'الطلاق', en: 'At-Talaq',    start: 2,  end: 3,    mood: 'توكل',       bg: 'sunrise trust hope calm light' },
  { surah: 67, name: 'الملك',  en: 'Al-Mulk',     start: 1,  end: 5,    mood: 'عظمة',       bg: 'night sky stars majestic cosmos' },
  { surah: 67, name: 'الملك',  en: 'Al-Mulk',     start: 15, end: 19,   mood: 'تسخير الأرض', bg: 'birds flying sky freedom nature clouds' },
  { surah: 68, name: 'القلم',  en: 'Al-Qalam',    start: 1,  end: 4,    mood: 'خلق عظيم',   bg: 'calm writing ink light peaceful' },
  { surah: 70, name: 'المعارج', en: 'Al-Maarij', start: 19, end: 23,    mood: 'صلاة',       bg: 'mosque prayer light peaceful serene' },
  { surah: 73, name: 'المزمل', en: 'Al-Muzzammil', start: 1, end: 8,   mood: 'قيام الليل', bg: 'night sky stars quiet mosque' },
  { surah: 76, name: 'الإنسان', en: 'Al-Insan',   start: 5,  end: 12,   mood: 'شكر',        bg: 'flowing river spring water green nature' },
  { surah: 78, name: 'النبأ',  en: 'An-Naba',     start: 6,  end: 16,   mood: 'قدرة',       bg: 'mountains dramatic landscape sky' },
  { surah: 79, name: 'النازعات', en: 'An-Naziat', start: 27, end: 33,   mood: 'إعجاز',      bg: 'night sky stars universe cosmos' },
  { surah: 80, name: 'عبس',    en: 'Abasa',       start: 24, end: 32,   mood: 'تدبر الطعام', bg: 'farmland crops golden harvest nature' },
  { surah: 82, name: 'الانفطار', en: 'Al-Infitar', start: 6, end: 8,    mood: 'تذكير',      bg: 'quiet desert sunset reflective' },
  { surah: 84, name: 'الانشقاق', en: 'Al-Inshiqaq', start: 16, end: 19, mood: 'قسم',        bg: 'sunset twilight sky red orange dramatic' },
  { surah: 85, name: 'البروج', en: 'Al-Buruj',    start: 1,  end: 3,    mood: 'قسم بالسماء', bg: 'stars galaxy night sky cosmic' },
  { surah: 86, name: 'الطارق', en: 'At-Tariq',    start: 1,  end: 4,    mood: 'نجم ثاقب',   bg: 'shooting star night sky bright' },
  { surah: 87, name: 'الأعلى', en: 'Al-Ala',      start: 1,  end: 5,    mood: 'تسبيح',      bg: 'green pasture nature growth peaceful' },
  { surah: 88, name: 'الغاشية', en: 'Al-Ghashiyah', start: 17, end: 20, mood: 'تفكر بالخلق', bg: 'camel desert mountains sky nature' },
  { surah: 89, name: 'الفجر',  en: 'Al-Fajr',     start: 27, end: 30,   mood: 'اطمئنان',    bg: 'dawn morning fog misty light calm' },
  { surah: 90, name: 'البلد',  en: 'Al-Balad',    start: 4,  end: 17,   mood: 'عقبة الخير', bg: 'mountain climb path golden light' },
  { surah: 91, name: 'الشمس',  en: 'Ash-Shams',   start: 1,  end: 10,   mood: 'تزكية النفس', bg: 'sunrise golden sunshine warm beautiful' },
  { surah: 93, name: 'الضحى',  en: 'Ad-Duha',     start: 1,  end: 11,   mood: 'أمل',        bg: 'golden sunrise warm beautiful hope' },
  { surah: 94, name: 'الشرح',  en: 'Ash-Sharh',   start: 1,  end: 8,    mood: 'تفاؤل',      bg: 'sunrise hope horizon dawn sky' },
  { surah: 96, name: 'العلق',  en: 'Al-Alaq',     start: 1,  end: 5,    mood: 'علم',        bg: 'soft light book calm reading nature' },
  { surah: 99, name: 'الزلزلة', en: 'Az-Zalzalah', start: 1, end: 8,    mood: 'يوم القيامة', bg: 'dramatic earth cracks intense sky' },
  { surah: 100, name: 'العاديات', en: 'Al-Adiyat', start: 1, end: 5,    mood: 'قسم بالخيل', bg: 'horses running desert dust dramatic' },
  { surah: 103, name: 'العصر',  en: 'Al-Asr',     start: 1,  end: 3,    mood: 'حكمة',       bg: 'sunset golden hour warm light time' },
];

/** Pick a curated passage and dynamically set endAyah to match the target duration exactly. */
export async function pickSmartPassage(targetSeconds: number, reciterEdition: string): Promise<SmartPassage> {
  const pool = CURATED_PASSAGES;
  const longMediumSurahs = pool.filter(p => p.surah <= 78);
  const shortSurahs = pool.filter(p => p.surah > 78);
  
  let selectedPool = pool;
  if (longMediumSurahs.length > 0 && shortSurahs.length > 0) {
    // 90% chance to pick from long/medium surahs, 10% chance for short surahs
    selectedPool = Math.random() < 0.9 ? longMediumSurahs : shortSurahs;
  }

  // Next, heavily prefer passages from the middle/end of the Surah (start > 1)
  const middlePassages = selectedPool.filter(p => p.start > 1);
  const startPassages = selectedPool.filter(p => p.start === 1);

  let finalPool = selectedPool;
  if (middlePassages.length > 0 && startPassages.length > 0) {
    // 95% chance to pick from the middle of the Surah, 5% to start from Ayah 1
    finalPool = Math.random() < 0.95 ? middlePassages : startPassages;
  } else if (middlePassages.length > 0) {
    finalPool = middlePassages;
  } else if (startPassages.length > 0) {
    finalPool = startPassages;
  }

  const p = finalPool[Math.floor(Math.random() * finalPool.length)];

  let computedEnd = p.start;
  try {
    const { endAyah } = await calcEndAyah(p.surah, p.start, reciterEdition, targetSeconds);
    computedEnd = endAyah;
  } catch (err) {
    console.error('Failed to fetch ayah durations, using fallback endAyah', err);
    computedEnd = p.end;
  }

  return {
    surahNumber: p.surah,
    surahName: p.name,
    surahEnglishName: p.en,
    startAyah: p.start,
    endAyah: computedEnd,
    mood: p.mood,
    backgroundQuery: p.bg,
  };
}

// ───── Keyword extraction from Arabic ayah text (per-segment backgrounds) ──
const KEYWORD_RULES: Array<{ pattern: RegExp; keywords: string }> = [
  { pattern: /السماء|السماوات|عنان|سقف/, keywords: 'sky clouds blue heaven above' },
  { pattern: /البحر|الأنهار|نهر|بحار|الماء|الأنهار|الأنهر/, keywords: 'ocean waves river water flowing blue' },
  { pattern: /الجنة|جنات|الفردوس|عدن|نعيم/, keywords: 'lush garden paradise green flowers beautiful' },
  { pattern: /النور|ضياء|أضاء|مشكاة|سراج/, keywords: 'golden light rays glow sunrise luminous' },
  { pattern: /الليل|الظلام|أمسى|العتمة/, keywords: 'night stars dark peaceful sky serene' },
  { pattern: /الجبال|جبل|الجبل|الرواسي/, keywords: 'mountains majestic peaks landscape nature' },
  { pattern: /الشمس|ضحاها/, keywords: 'sunrise golden sunshine warm beautiful' },
  { pattern: /القمر|قمر|هلال/, keywords: 'moon night peaceful sky glow silver' },
  { pattern: /النجوم|الكواكب|نجم|الثريا/, keywords: 'stars night sky cosmos universe milky way' },
  { pattern: /المطر|غيث|الغيث|سحاب/, keywords: 'rain drops water nature refresh clouds' },
  { pattern: /الريح|الرياح|عصف/, keywords: 'wind nature trees movement breeze' },
  { pattern: /الزرع|حرث|النبات|الثمرات|البستان/, keywords: 'green crops fields farmland nature harvest' },
  { pattern: /الفجر|الصبح|صبح|بكرة/, keywords: 'dawn morning fog misty sunrise tranquil' },
  { pattern: /المساء|العصر|الغروب|أصيل/, keywords: 'sunset golden hour warm evening twilight' },
  { pattern: /الطير|طيور|الغراب|الهدهد/, keywords: 'birds flying sky freedom nature' },
  { pattern: /الأرض|أرض|التراب/, keywords: 'earth nature landscape aerial view' },
  { pattern: /النار|جهنم|اللهب/, keywords: 'golden fire dramatic light warm glow' },
  { pattern: /الصحراء|الرمال|رمل/, keywords: 'desert sand dunes golden landscape' },
  { pattern: /الغابة|الأشجار|شجر|الخضراء/, keywords: 'forest trees green lush nature' },
  { pattern: /الكون|الفضاء|المجرة/, keywords: 'space galaxy universe cosmic stars' },
];

const DEFAULT_THEMES = [
  // ── Mountains & Valleys ──
  'majestic mountains aerial view drone cinematic',
  'snowy peaks winter cold freezing landscape',
  'foggy mountain mysterious dark pine forest',
  'green valley flowing river aerial landscape nature',
  'volcano dramatic dark ash landscape majestic',
  // ── Oceans & Water ──
  'ocean waves crashing slow motion relaxing coast',
  'deep blue sea underwater calm rays of light',
  'tropical beach palm trees sunset golden hour',
  'calm lake reflection mirror water morning fog',
  'rain pouring on green leaves macro slow motion',
  'waterfall lush green jungle rainforest amazing',
  'underwater coral reef colorful fish beautiful',
  // ── Skies & Cosmos ──
  'starry night sky milky way time lapse universe',
  'galaxy outer space cosmic beautiful journey',
  'clouds moving fast sky timelapse heavenly',
  'sunset horizon orange golden light beautiful',
  'sunrise morning dawn light rays breaking clouds',
  'northern lights aurora borealis green sky night',
  // ── Forests & Flora ──
  'deep green forest sunlight shining through trees',
  'autumn leaves falling orange red forest drone',
  'spring blooming flowers macro sunny day nature',
  'bamboo forest tall trees calm wind relaxing',
  'macro dew drops on grass morning fresh nature',
  'sunflower field moving wind sunny clear sky',
  // ── Deserts & Landscapes ──
  'desert sand dunes golden hour beautiful cinematic',
  'canyon red rocks desert landscape drone view',
  'aerial view winding road through green hills',
  'icebergs freezing cold ocean majestic nature',
  // ── Atmospheric & Mood ──
  'cinematic dark moody lighting nature abstract',
  'golden light dust floating sun rays warm calm',
  'silhouette birds flying sunset slow motion',
  'lightning storm dramatic dark clouds thunder',
  'gentle breeze moving grass meadow relaxing',
  'beautiful natural wonders of the world 4k cinematic'
];

const EASTERN_ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Convert a number to Eastern Arabic-Indic numerals (as used in the Mus'haf). */
export function toEasternArabicNumeral(n: number): string {
  return String(n).split('').map((d) => EASTERN_ARABIC_DIGITS[parseInt(d, 10)] ?? d).join('');
}

/** Return Pexels search keywords based on Arabic ayah content. */
export function getBackgroundKeywords(arabicText: string): string {
  for (const { pattern, keywords } of KEYWORD_RULES) {
    if (pattern.test(arabicText)) return keywords;
  }
  return DEFAULT_THEMES[Math.floor(Math.random() * DEFAULT_THEMES.length)];
}

// ───── Featured reciters (verified identifiers from alquran.cloud) ────────
export const FEATURED_RECITERS: SmartReciter[] = [
  { identifier: 'ar.alafasy',            name: 'مشاري العفاسي',   arabicName: 'مشاري راشد العفاسي',        featured: true },
  { identifier: 'ar.abdulbasitmurattal', name: 'عبد الباسط',      arabicName: 'عبد الباسط عبد الصمد',      featured: true },
  { identifier: 'ar.minshawi',           name: 'المنشاوي',        arabicName: 'محمد صديق المنشاوي',        featured: true },
  { identifier: 'ar.hudhaify',           name: 'الحذيفي',         arabicName: 'علي الحذيفي',               featured: true },
  { identifier: 'ar.shaatree',           name: 'الشاطري',         arabicName: 'أبو بكر الشاطري',           featured: true },
  { identifier: 'ar.mahermuaiqly',       name: 'ماهر المعيقلي',   arabicName: 'ماهر بن حمد المعيقلي',      featured: true },
  { identifier: 'ar.husary',             name: 'الحصري',          arabicName: 'محمود خليل الحصري',         featured: true },
  { identifier: 'ar.muhammadayyoub',     name: 'محمد أيوب',       arabicName: 'محمد أيوب',                 featured: true },
  { identifier: 'ar.muhammadjibreel',    name: 'محمد جبريل',      arabicName: 'محمد جبريل',                featured: true },
  { identifier: 'ar.saoodshuraym',       name: 'سعود الشريم',     arabicName: 'سعود بن إبراهيم الشريم',    featured: true },
  { identifier: 'ar.abdurrahmaansudais', name: 'السديس',          arabicName: 'عبد الرحمن السديس',         featured: true },
  { identifier: 'ar.ahmedajamy',         name: 'أحمد العجمي',     arabicName: 'أحمد بن علي العجمي',        featured: true },
  { identifier: 'ar.hanirifai',          name: 'هاني الرفاعي',    arabicName: 'هاني الرفاعي',              featured: true },
  { identifier: 'ar.parhizgar',          name: 'شهریار پرهیزگار', arabicName: 'شهریار پرهیزگار',           featured: false },
  { identifier: 'ar.walkalsheikh',       name: 'وليد الشيخ',      arabicName: 'وليد الشيخ',                featured: false },
  { identifier: 'ar.aymanswoaid',        name: 'أيمن سويد',       arabicName: 'أيمن سويد',                 featured: false },
];

export function pickSmartReciter(): SmartReciter {
  const featured = FEATURED_RECITERS.filter((r) => r.featured);
  return featured[Math.floor(Math.random() * featured.length)];
}

// ───── Smart splitting of long ayahs ───────────────────────────────────────
// Arabic Quranic pause/waqf marks that indicate a natural breathing point.
const WAQF_MARKS = /[ۖۗۘۙۚۛ]/;
// Characters count threshold above which we consider splitting worthwhile.
const SPLIT_THRESHOLD = 70;
const MIN_PART_LENGTH = 25;

/**
 * Split a long ayah into 2 natural reading segments when it clearly has a
 * pause/waqf mark or a natural break near the middle. Returns a single-item
 * array (unsplit) when the ayah is short or too tightly bound in meaning to
 * split without breaking comprehension.
 */
export function splitAyahForDisplay(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= SPLIT_THRESHOLD) return [trimmed];

  const words = trimmed.split(/\s+/);
  const mid = Math.floor(trimmed.length / 2);

  // 1) Prefer splitting exactly at a waqf mark closest to the middle.
  let bestIdx = -1;
  let bestDist = Infinity;
  let runningLen = 0;
  for (let i = 0; i < words.length; i++) {
    runningLen += words[i].length + 1;
    if (WAQF_MARKS.test(words[i])) {
      const dist = Math.abs(runningLen - mid);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
  }

  // 2) Fallback: split at the word boundary nearest the middle.
  if (bestIdx === -1) {
    runningLen = 0;
    for (let i = 0; i < words.length; i++) {
      runningLen += words[i].length + 1;
      const dist = Math.abs(runningLen - mid);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
  }

  const part1 = words.slice(0, bestIdx + 1).join(' ').trim();
  const part2 = words.slice(bestIdx + 1).join(' ').trim();

  if (!part1 || !part2 || part1.length < MIN_PART_LENGTH || part2.length < MIN_PART_LENGTH) {
    return [trimmed];
  }

  return [part1, part2];
}
