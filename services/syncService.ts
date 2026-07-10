import { supabase } from '../supabaseClient';

export interface UserSyncData {
  quran_last_page: number;
  quran_last_surah: string;
  quran_bookmarks: Record<string, any>;
  quran_tafseer: string;
  tasbih_current: number;
  tasbih_laps: number;
  tasbih_total: number;
  tasbih_history: number[];
  radio_favorites: string[];
  azkar_progress: Record<string, any>;
}

const DEFAULT_SYNC_DATA: UserSyncData = {
  quran_last_page: 1,
  quran_last_surah: '',
  quran_bookmarks: {},
  quran_tafseer: 'ar.muyassar',
  tasbih_current: 0,
  tasbih_laps: 0,
  tasbih_total: 0,
  tasbih_history: [],
  radio_favorites: [],
  azkar_progress: {},
};

export const syncService = {
  async loadFromServer(userId: string): Promise<UserSyncData | null> {
    try {
      const { data, error } = await supabase
        .from('user_sync_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        quran_last_page: data.quran_last_page ?? 1,
        quran_last_surah: data.quran_last_surah ?? '',
        quran_bookmarks: data.quran_bookmarks ?? {},
        quran_tafseer: data.quran_tafseer ?? 'ar.muyassar',
        tasbih_current: data.tasbih_current ?? 0,
        tasbih_laps: data.tasbih_laps ?? 0,
        tasbih_total: data.tasbih_total ?? 0,
        tasbih_history: data.tasbih_history ?? [],
        radio_favorites: data.radio_favorites ?? [],
        azkar_progress: data.azkar_progress ?? {},
      };
    } catch (e) {
      console.error('Sync load error:', e);
      return null;
    }
  },

  async saveToServer(userId: string, data: Partial<UserSyncData>) {
    try {
      const { error } = await supabase
        .from('user_sync_data')
        .upsert({
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) console.error('Sync save error:', error);
      return !error;
    } catch (e) {
      console.error('Sync save error:', e);
      return false;
    }
  },

  mergeFromServer(serverData: UserSyncData | null, localOnly?: boolean) {
    if (!serverData || localOnly) return;

    const keys: (keyof UserSyncData)[] = [
      'quran_last_page', 'quran_last_surah', 'quran_bookmarks', 'quran_tafseer',
      'tasbih_current', 'tasbih_laps', 'tasbih_total', 'tasbih_history',
      'radio_favorites', 'azkar_progress',
    ];

    for (const key of keys) {
      const val = serverData[key];
      if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0) && !(typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0)) {
        localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }
    }
  },

  pushLocalToServer(userId: string) {
    const data: Partial<UserSyncData> = {};

    const getLocal = (key: string) => {
      try {
        const v = localStorage.getItem(key);
        if (v === null) return undefined;
        if (key === 'quran_bookmarks' || key === 'tasbih_history' || key === 'radio_favorites' || key === 'azkar_progress') {
          return JSON.parse(v);
        }
        if (key === 'quran_last_page' || key === 'tasbih_current' || key === 'tasbih_laps' || key === 'tasbih_total') {
          return parseInt(v) || 0;
        }
        return v;
      } catch { return undefined; }
    };

    const quranLastPage = getLocal('quran_last_page');
    if (quranLastPage && quranLastPage > 1) data.quran_last_page = quranLastPage;

    const quranLastSurah = getLocal('quran_last_surah');
    if (quranLastSurah) data.quran_last_surah = quranLastSurah;

    const bookmarks = getLocal('quran_bookmarks');
    if (bookmarks && Object.keys(bookmarks).length > 0) data.quran_bookmarks = bookmarks;

    const tafseer = getLocal('quran_tafseer');
    if (tafseer) data.quran_tafseer = tafseer;

    const tasbihTotal = getLocal('tasbih_total');
    if (tasbihTotal && tasbihTotal > 0) {
      data.tasbih_current = getLocal('tasbih_current') || 0;
      data.tasbih_laps = getLocal('tasbih_laps') || 0;
      data.tasbih_total = tasbihTotal;
    }

    const history = getLocal('tasbih_history');
    if (history && history.length > 0) data.tasbih_history = history;

    const favs = getLocal('radio_favorites');
    if (favs && favs.length > 0) data.radio_favorites = favs;

    if (Object.keys(data).length > 0) {
      this.saveToServer(userId, data);
    }
  },

  async syncAll(userId: string) {
    const serverData = await this.loadFromServer(userId);
    if (serverData) {
      this.mergeFromServer(serverData);
    }
    this.pushLocalToServer(userId);
  },
};
