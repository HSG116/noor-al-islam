
import { supabase } from '../supabaseClient';
import { UserProgress } from '../types';

const LOCAL_KEY = 'noor_hafiz_progress';

export const progressService = {
  async getAll(userId?: string): Promise<UserProgress[]> {
    if (userId) {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error fetching progress:", error.message);
        return [];
      }
      return data || [];
    } else {
      const local = localStorage.getItem(LOCAL_KEY);
      return local ? JSON.parse(local) : [];
    }
  },

  async getSurahStatus(userId: string | undefined, surahId: number): Promise<UserProgress['status']> {
    // Optimization: Try to get just the specific status instead of loading all
    if (userId) {
        const { data, error } = await supabase
            .from('user_progress')
            .select('status')
            .eq('user_id', userId)
            .eq('surah_id', surahId)
            .maybeSingle(); // maybeSingle avoids error if no row exists
        
        if (error) console.error("Error fetching surah status:", error.message);
        return data?.status || 'not_started';
    }

    const list = await this.getAll();
    const item = list.find(i => i.surah_id === surahId);
    return item?.status || 'not_started';
  },

  async updateStatus(userId: string | undefined, surahId: number, status: UserProgress['status']): Promise<void> {
    const timestamp = new Date().toISOString();
    
    if (userId) {
      try {
        // Supabase Storage
        // Check if exists first using maybeSingle
        const { data: existing, error: fetchError } = await supabase
            .from('user_progress')
            .select('id')
            .eq('user_id', userId)
            .eq('surah_id', surahId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
            const { error: updateError } = await supabase
                .from('user_progress')
                .update({ status, updated_at: timestamp })
                .eq('id', existing.id);
            
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from('user_progress')
                .insert({
                    user_id: userId,
                    surah_id: surahId,
                    status,
                    updated_at: timestamp
                });
            
            if (insertError) throw insertError;
        }
      } catch (e: any) {
          console.error("FAILED TO SAVE PROGRESS TO DB:", e.message || e);
          // Don't alert aggressively to avoid UX disruption, just log
      }
    } else {
      // Local Storage (Guest Mode)
      const list = await this.getAll();
      const existingIndex = list.findIndex(i => i.surah_id === surahId);
      
      if (existingIndex >= 0) {
        list[existingIndex] = { ...list[existingIndex], status, updated_at: timestamp };
      } else {
        list.push({
          id: crypto.randomUUID(),
          user_id: 'guest',
          surah_id: surahId,
          status,
          last_ayah: 0,
          updated_at: timestamp
        });
      }
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    }
  }
};
