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
    ayahs: data.ayahs.map((a: any) => ({ number: a.number, numberInSurah: a.numberInSurah, text: a.text })),
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
