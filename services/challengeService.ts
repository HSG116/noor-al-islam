
import { supabase } from '../supabaseClient';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    days_duration: number;
    total_pages: number;
    points_reward: number;
    category: 'khatma' | 'azkar' | 'tasbeeh';
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
        // التحقق من نوع التحدي لتحديد الرسالة المناسبة
        const { data: challengeInfo } = await supabase.from('challenges').select('category').eq('id', challengeId).single();
        const categoryLabel = challengeInfo?.category === 'azkar' ? 'أذكار' : challengeInfo?.category === 'tasbeeh' ? 'تسبيح' : 'قرآني';

        // التحقق من وجود تحدي نشط لنفس النوع
        const { data: activeChallenges } = await supabase
            .from('user_challenges')
            .select('id, challenge_id, status, challenges(category)')
            .eq('user_id', userId)
            .eq('status', 'active');

        const sameCategoryActive = activeChallenges?.find((ac: any) => ac.challenges?.category === challengeInfo?.category);

        if (sameCategoryActive) {
            if (sameCategoryActive.challenge_id === challengeId) {
                return { error: { message: `أنت مشترك بالفعل في هذا التحدي وهو نشط حالياً!` } };
            } else {
                return { error: { message: `يوجد لديك تحدي ${categoryLabel} نشط لم تكمله بعد! يجب عليك إكمال تحديك الحالي قبل البدء بتحدي جديد من نفس الفئة.` } };
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
            // إضافة اشتراك جديد تماما
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
            // تحديث ملف المستخدم بالتحدي الحالي (للختمة فقط أو بشكل عام)
            if (challengeInfo?.category === 'khatma') {
                await supabase.from('profiles').update({ current_challenge_id: challengeId }).eq('id', userId);
            }
        }

        return { data: resultData, error: resultError };
    },

    // جلب التحديات النشطة للمستخدم حسب الفئة
    async getActiveChallengesByCategory(userId: string, category: string) {
        const { data } = await supabase
            .from('user_challenges')
            .select('*, challenge_details:challenges(*)')
            .eq('user_id', userId)
            .eq('status', 'active');

        return (data || []).filter((uc: any) => uc.challenge_details?.category === category) as UserChallenge[];
    },

    // تسجيل قراءة صفحة مع نظام حماية (للختمة)
    async recordPageRead(userId: string, pageNumber: number, durationSeconds: number) {
        if (durationSeconds < 2) {
            const { data: profile } = await supabase.from('profiles').select('cheat_warnings').eq('id', userId).single();
            const newWarnings = (profile?.cheat_warnings || 0) + 1;

            if (newWarnings >= 5) {
                await supabase.from('profiles').update({ cheat_warnings: 5, status: 'banned' }).eq('id', userId);
                return { error: '🚫 تم حظر حسابك لتجاوزك عدد التحذيرات المسموح بها!', warnings: 5, isBanned: true };
            }

            await supabase.from('profiles').update({ cheat_warnings: newWarnings }).eq('id', userId);
            return { error: `⚠️ يرجى القراءة بتأنٍ! تحذير رقم: ${newWarnings}/5`, warnings: newWarnings };
        }

        const activeKhatmas = await this.getActiveChallengesByCategory(userId, 'khatma');
        let pointsAdded = 10;

        if (activeKhatmas.length > 0) {
            const activeChallenge = activeKhatmas[0];
            const newPagesCompleted = activeChallenge.pages_completed + 1;
            const isFinished = activeChallenge.challenge_details && newPagesCompleted >= activeChallenge.challenge_details.total_pages;

            await supabase.from('user_challenges')
                .update({
                    last_page_read: pageNumber,
                    pages_completed: newPagesCompleted,
                    status: isFinished ? 'completed' : 'active'
                })
                .eq('id', activeChallenge.id);

            if (isFinished && activeChallenge.challenge_details) {
                pointsAdded += activeChallenge.challenge_details.points_reward;
            }
        }

        const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', userId).single();
        await supabase.from('profiles').update({ total_points: (profile?.total_points || 0) + pointsAdded }).eq('id', userId);
        await supabase.from('reading_logs').insert({ user_id: userId, page_number: pageNumber, read_duration_seconds: durationSeconds });

        return { success: true, pointsAdded };
    },

    // تسجيل إكمال ورد أذكار (صباح أو مساء)
    async recordAzkarCompletion(userId: string, type: 'morning' | 'evening') {
        // حماية من التكرار السريع (مرة واحدة لكل نوع في اليوم)
        const today = new Date().toISOString().split('T')[0];
        const { data: existing } = await supabase
            .from('activity_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('activity_type', 'azkar')
            .eq('activity_subtype', type)
            .gte('created_at', today)
            .limit(1);

        if (existing && existing.length > 0) {
            return { error: 'لقد سجلت إتمام هذا الذكر اليوم بالفعل!' };
        }

        await supabase.from('activity_logs').insert({
            user_id: userId,
            activity_type: 'azkar',
            activity_subtype: type,
            amount: 1
        });

        const activeAzkarChallenges = await this.getActiveChallengesByCategory(userId, 'azkar');
        let pointsAdded = 50;

        if (activeAzkarChallenges.length > 0) {
            // ملاحظة: الأذكار تحسب باليوم، نحتاج للتأكد هل تم إكمال الصباح والمساء معاً؟
            // للتبسيط، كل إكمال يزيد التقدم 0.5 (بحيث إكمال الاثنين يعطي يوم كامل) 
            // أو ببساطة نزيد 1 كل مرة والهدف يتضاعف. سنستخدم زيادة 1 والهدف هو عدد مرات الإكمال الإجمالي.

            const activeChallenge = activeAzkarChallenges[0];
            const newUnitsCompleted = activeChallenge.pages_completed + 1;
            const isFinished = activeChallenge.challenge_details && newUnitsCompleted >= (activeChallenge.challenge_details.total_pages * 2);

            await supabase.from('user_challenges')
                .update({
                    pages_completed: newUnitsCompleted,
                    status: isFinished ? 'completed' : 'active'
                })
                .eq('id', activeChallenge.id);

            if (isFinished && activeChallenge.challenge_details) {
                pointsAdded += activeChallenge.challenge_details.points_reward;
            }
        }

        const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', userId).single();
        await supabase.from('profiles').update({ total_points: (profile?.total_points || 0) + pointsAdded }).eq('id', userId);

        return { success: true, pointsAdded };
    },

    // تسجيل عدد تسبيحات
    async recordTasbeehCount(userId: string, amount: number) {
        await supabase.from('activity_logs').insert({
            user_id: userId,
            activity_type: 'tasbeeh',
            amount: amount,
            metadata: { session_total: amount }
        });

        const activeTasbeehChallenges = await this.getActiveChallengesByCategory(userId, 'tasbeeh');
        let pointsAdded = Math.floor(amount / 10); // نقطة لكل 10 تسبيحات

        if (activeTasbeehChallenges.length > 0) {
            const activeChallenge = activeTasbeehChallenges[0];
            const newTotalCount = activeChallenge.pages_completed + amount;
            const isFinished = activeChallenge.challenge_details && newTotalCount >= activeChallenge.challenge_details.total_pages;

            await supabase.from('user_challenges')
                .update({
                    pages_completed: newTotalCount,
                    status: isFinished ? 'completed' : 'active'
                })
                .eq('id', activeChallenge.id);

            if (isFinished && activeChallenge.challenge_details) {
                pointsAdded += activeChallenge.challenge_details.points_reward;
            }
        }

        const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', userId).single();
        await supabase.from('profiles').update({ total_points: (profile?.total_points || 0) + pointsAdded }).eq('id', userId);

        return { success: true, pointsAdded };
    },

    // لوحة الشرف
    async getLeaderboard() {
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, total_points, avatar_url')
            .order('total_points', { ascending: false })
            .limit(10);
        return data;
    }
};
