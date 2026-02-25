
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
        // التحقق من وجود تحدي نشط لليوزر (ممنوع أخذ تحدي آخر إذا كان هنالك تحدي فعال)
        const { data: activeChallenges } = await supabase
            .from('user_challenges')
            .select('id, challenge_id, status')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (activeChallenges && activeChallenges.length > 0) {
            const currentActive = activeChallenges[0];
            if (currentActive.challenge_id === challengeId) {
                return { error: { message: 'أنت مشترك بالفعل في هذا التحدي وهو نشط حالياً!' } };
            } else {
                return { error: { message: 'يوجد لديك تحدي قرآني نشط لم تكمله بعد! يجب عليك إكمال تحديك الحالي قبل البدء بتحدي جديد.' } };
            }
        }

        // التحقق مما إذا كان المستخدم مشتركاً بالفعل (مثلاً أكمله ويريد إعادته أو مجمد)
        const { data: existing } = await supabase
            .from('user_challenges')
            .select('id, status')
            .eq('user_id', userId)
            .eq('challenge_id', challengeId)
            .limit(1);

        let resultData, resultError;

        if (existing && existing.length > 0) {
            // تحديث الحالة وتصفير التقدم لبدء التحدي من جديد
            const res = await supabase
                .from('user_challenges')
                .update({ status: 'active', last_page_read: 0, pages_completed: 0 })
                .eq('id', existing[0].id)
                .select()
                .single();
            resultData = res.data;
            resultError = res.error;
        } else {
            // إضافة اشتراك جديد تماما وتجنب مشكلة الـ duplicate مع fallback
            try {
                const res = await supabase
                    .from('user_challenges')
                    .insert({ user_id: userId, challenge_id: challengeId, status: 'active', last_page_read: 0, pages_completed: 0 })
                    .select()
                    .single();
                resultData = res.data;
                resultError = res.error;
            } catch (err: any) {
                resultError = err;
            }
        }

        if (!resultError) {
            // تحديث ملف المستخدم بالتحدي الحالي
            await supabase.from('profiles').update({ current_challenge_id: challengeId }).eq('id', userId);
        }

        return { data: resultData, error: resultError };
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
        // 1. نظام الحماية (تخطي الصفحة في أقل من 2 ثانية يعتبر غش)
        if (durationSeconds < 2) {
            const { data: profile } = await supabase.from('profiles').select('cheat_warnings').eq('id', userId).single();
            const newWarnings = (profile?.cheat_warnings || 0) + 1;

            if (newWarnings >= 5) {
                // Device ban will be enforced locally, but we still record 5 warnings in DB
                await supabase.from('profiles').update({ cheat_warnings: 5, status: 'banned' }).eq('id', userId);
                return { error: '🚫 تم حظر حسابك وجهازك بشكل نهائي لتجاوزك عدد التحذيرات المسموح بها في تخطي الصفحات!', warnings: 5, isBanned: true };
            }

            await supabase.from('profiles').update({ cheat_warnings: newWarnings }).eq('id', userId);
            return { error: `⚠️ نظام الحماية: يرجى قراءة الصفحة بتأنٍ! لا يمكنك تخطي الصفحة بهذه السرعة.\nتحذير رقم: ${newWarnings}/5`, warnings: newWarnings };
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
