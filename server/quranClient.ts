// Thin wrapper around the free alquran.cloud API — no key required.
// Docs: https://alquran.cloud/api

const BASE = 'https://api.alquran.cloud/v1';

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface AyahText {
  number: number;
  numberInSurah: number;
  text: string;
  page: number;
}

export interface ReciterEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Quran API error ${res.status} for ${url}`);
  const json: any = await res.json();
  if (json.code !== 200) throw new Error(`Quran API returned code ${json.code}`);
  return json.data as T;
}

export async function listSurahs(): Promise<SurahMeta[]> {
  return getJson<SurahMeta[]>(`${BASE}/surah`);
}

export async function listReciters(): Promise<ReciterEdition[]> {
  const editions = await getJson<ReciterEdition[]>(`${BASE}/edition?format=audio&language=ar`);
  // Only keep per-ayah audio editions (type "versebyverse" covers per-ayah timing we need)
  return editions;
}

export async function getSurahAyahs(surahNumber: number, edition = 'quran-uthmani'): Promise<{ surah: SurahMeta; ayahs: AyahText[] }> {
  const data = await getJson<any>(`${BASE}/surah/${surahNumber}/${edition}`);
  return {
    surah: {
      number: data.number,
      name: data.name,
      englishName: data.englishName,
      englishNameTranslation: data.englishNameTranslation,
      numberOfAyahs: data.numberOfAyahs,
      revelationType: data.revelationType,
    },
    ayahs: data.ayahs.map((a: any) => ({ number: a.number, numberInSurah: a.numberInSurah, text: a.text, page: a.page })),
  };
}

export interface AyahAudio {
  numberInSurah: number;
  text: string;
  audioUrl: string;
}

export async function getAyahAudio(surahNumber: number, ayahNumber: number, reciterEdition: string): Promise<AyahAudio> {
  const data = await getJson<any>(`${BASE}/ayah/${surahNumber}:${ayahNumber}/${reciterEdition}`);
  return { numberInSurah: data.numberInSurah, text: data.text, audioUrl: data.audio };
}

const surahMetaCache = new Map<number, SurahMeta>();

/** Lightweight surah metadata (Arabic + English name) — cached in-memory since it never changes. */
export async function getSurahMeta(surahNumber: number): Promise<SurahMeta> {
  const cached = surahMetaCache.get(surahNumber);
  if (cached) return cached;
  const data = await getJson<any>(`${BASE}/surah/${surahNumber}`);
  const meta: SurahMeta = {
    number: data.number,
    name: data.name,
    englishName: data.englishName,
    englishNameTranslation: data.englishNameTranslation,
    numberOfAyahs: data.numberOfAyahs,
    revelationType: data.revelationType,
  };
  surahMetaCache.set(surahNumber, meta);
  return meta;
}

/** English translation text for a single ayah (default: Saheeh International). */
export async function getAyahTranslation(surahNumber: number, ayahNumber: number, edition = 'en.sahih'): Promise<string> {
  const data = await getJson<any>(`${BASE}/ayah/${surahNumber}:${ayahNumber}/${edition}`);
  return data.text as string;
}

// ─── Quran.com API for QCF2 page-specific font glyphs ────────────────────
// These fonts are glyph-based: each of the 604 font files contains custom
// glyphs for exactly one page of the Mushaf. The code_v2 field contains the
// special Unicode characters that map to those glyphs.

const QURAN_COM_BASE = 'https://api.quran.com/api/v4';

export interface QCFGlyph {
  verseKey: string;       // e.g. "1:1"
  codeV2: string;         // special Unicode glyphs for QCF2 font
  v2Page: number;         // 1-604, maps to QCF2{page}.ttf
  numberInSurah: number;  // parsed from verseKey
}

/**
 * Fetch QCF2 glyph codes for a range of ayahs in a surah.
 * Uses the Quran.com v4 API which provides code_v2 and v2_page.
 */
export async function getAyahCodeV2(
  surahNumber: number,
  startAyah: number,
  endAyah: number,
): Promise<QCFGlyph[]> {
  // Build verse_key filter for the range
  const keys = [];
  for (let i = startAyah; i <= endAyah; i++) {
    keys.push(`${surahNumber}:${i}`);
  }

  // Quran.com API supports fetching by chapter_number and filtering by verse_key
  const url = `${QURAN_COM_BASE}/quran/verses/code_v2?chapter_number=${surahNumber}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Quran.com API error ${res.status}`);
  const json: any = await res.json();

  const allVerses: QCFGlyph[] = (json.verses || [])
    .filter((v: any) => {
      const num = parseInt(v.verse_key.split(':')[1], 10);
      return num >= startAyah && num <= endAyah;
    })
    .map((v: any) => ({
      verseKey: v.verse_key,
      codeV2: v.code_v2,
      v2Page: v.v2_page,
      numberInSurah: parseInt(v.verse_key.split(':')[1], 10),
    }));

  return allVerses;
}
