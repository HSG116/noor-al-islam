
import { supabase } from '../supabaseClient';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    days_duration: number;
    total_pages: number;
    points_reward: number;
}

export interface UserChallenge {
    id: string;
    challenge_id: string;
    last_page_read: number;
    pages_completed: number;
    status: string;
    start_date: string;
    challenge_details?: Challenge;
}

export const challengeService = {
    // جلب كل التحديات المتاحة
    async getAvailableChallenges() {
        const { data } = await supabase.from('challenges').select('*');
        return data as Challenge[];
    },

    // اشتراك المستخدم في تحدي
    async joinChallenge(userId: string, challengeId: string) {
        const { data, error } = await supabase
            .from('user_challenges')
            .upsert({ user_id: userId, challenge_id: challengeId, status: 'active' })
            .select()
            .single();

        // تحديث ملف المستخدم بالتحدي الحالي
        await supabase.from('profiles').update({ current_challenge_id: challengeId }).eq('id', userId);

        return { data, error };
    },

    // جلب التحدي الحالي للمستخدم
    async getActiveUserChallenge(userId: string) {
        const { data } = await supabase
            .from('user_challenges')
            .select('*, challenge_details:challenges(*)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();
        return data as UserChallenge | null;
    },

    // تسجيل قراءة صفحة مع نظام حماية
    async recordPageRead(userId: string, pageNumber: number, durationSeconds: number) {
        // 1. نظام الحماية (أقل من 5 ثواني للصفحة يعتبر غش)
        if (durationSeconds < 5) {
            const { data: profile } = await supabase.from('profiles').select('cheat_warnings').eq('id', userId).single();
            const newWarnings = (profile?.cheat_warnings || 0) + 1;

            await supabase.from('profiles').update({ cheat_warnings: newWarnings }).eq('id', userId);

            return { error: '⚠️ نظام الحماية: تمت القراءة بسرعة غير طبيعية! تحذير: ' + newWarnings + '/5', warnings: newWarnings };
        }

        // 2. تحديث التحدي
        const activeChallenge = await this.getActiveUserChallenge(userId);
        let pointsAdded = 10;

        if (activeChallenge) {
            const newPagesCompleted = activeChallenge.pages_completed + 1;
            const isFinished = activeChallenge.challenge_details && newPagesCompleted >= activeChallenge.challenge_details.total_pages;

            await supabase.from('user_challenges')
                .update({
                    last_page_read: pageNumber,
                    pages_completed: newPagesCompleted,
                    status: isFinished ? 'completed' : 'active'
                })
                .eq('id', activeChallenge.id);

            // إذا خلص التحدي، ضيف مكافأة التحدي الكبيرة
            if (isFinished && activeChallenge.challenge_details) {
                pointsAdded += activeChallenge.challenge_details.points_reward;
            }
        }

        // 3. إضافة نقاط
        const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', userId).single();
        await supabase.from('profiles').update({ total_points: (profile?.total_points || 0) + pointsAdded }).eq('id', userId);

        // 4. حفظ السجل
        await supabase.from('reading_logs').insert({ user_id: userId, page_number: pageNumber, read_duration_seconds: durationSeconds });

        return { success: true, pointsAdded: 10 };
    },

    // لوحة الشرف (Leaderboard)
    async getLeaderboard() {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, total_points, avatar_url')
            .order('total_points', { ascending: false })
            .limit(10);
        return data;
    }
};
