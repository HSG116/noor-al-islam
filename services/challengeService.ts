
import { supabase } from '../supabaseClient';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    days_duration: number;
    total_pages: number;
    points_reward: number;
    category: 'khatma' | 'azkar' | 'tasbeeh';
    start_page?: number;
    end_page?: number;
    challenge_type?: string;
    tier?: 'major' | 'minor';
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

export type AzkarType = 'morning' | 'evening' | 'sleep' | 'post_prayer' | 'ruqya';

export const AZKAR_TYPES: AzkarType[] = ['morning', 'evening', 'sleep', 'post_prayer', 'ruqya'];

export const challengeService = {
    // جلب كل التحديات المتاحة
    async getAvailableChallenges() {
        const { data } = await supabase.from('challenges').select('*');
        return data as Challenge[];
    },

    // اشتراك المستخدم في تحدي
    async joinChallenge(userId: string, challengeId: string) {
        // التحقق من نوع وتصنيف التحدي
        const { data: challengeInfo } = await supabase.from('challenges').select('category, tier').eq('id', challengeId).single();
        const categoryLabel = challengeInfo?.category === 'azkar' ? 'أذكار' : challengeInfo?.category === 'tasbeeh' ? 'تسبيح' : 'قرآني';
        const tier = challengeInfo?.tier || 'major';
        const tierLabel = tier === 'major' ? 'كبير' : 'صغير';

        // جلب التحديات النشطة الحالية
        const { data: activeChallenges } = await supabase
            .from('user_challenges')
            .select('id, challenge_id, status, challenges!inner(category, tier)')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (challengeInfo?.category === 'azkar') {
            // الأذكار: يمكن الاشتراك في أكثر من تحدي أذكار (لكل نوع تحدي مستقل)
            const sameChallengeActive = activeChallenges?.find((ac: any) => ac.challenge_id === challengeId);
            if (sameChallengeActive) {
                return { error: { message: `أنت مشترك بالفعل في هذا التحدي وهو نشط حالياً!` } };
            }
            // لا نمنع تكرار الأذكار لأن كل تحدي له نوعه (صباح/مساء، نوم، بعد الصلاة، رقية)
        } else if (challengeInfo?.category === 'tasbeeh') {
            // التسبيح: واحد فقط
            const sameCategoryActive = activeChallenges?.find((ac: any) => ac.challenges?.category === 'tasbeeh');
            if (sameCategoryActive) {
                if (sameCategoryActive.challenge_id === challengeId) {
                    return { error: { message: `أنت مشترك بالفعل في هذا التحدي وهو نشط حالياً!` } };
                }
                return { error: { message: `يوجد لديك تحدي ${categoryLabel} نشط لم تكمله بعد!` } };
            }
        } else {
            // التحديات القرآنية: تطبيق نظام المستويات (tiers)
            const activeMajor = activeChallenges?.filter((ac: any) => ac.challenges?.tier === 'major');
            const activeMinor = activeChallenges?.filter((ac: any) => ac.challenges?.tier === 'minor');

            if (tier === 'major') {
                if (activeMajor && activeMajor.length >= 1) {
                    if (activeMajor[0].challenge_id === challengeId) {
                        return { error: { message: `أنت مشترك بالفعل في هذا التحدي وهو نشط حالياً!` } };
                    }
                    return { error: { message: `لديك بالفعل تحدي ${tierLabel} نشط. يجب عليك إكماله أو إلغاؤه أولاً قبل البدء بتحدي كبير جديد.` } };
                }
            } else {
                if (activeMinor && activeMinor.length >= 2) {
                    return { error: { message: `لا يمكنك الاشتراك في أكثر من ${activeMinor.length} تحديات صغيرة في نفس الوقت. أكمل أو ألغ أحدها أولاً.` } };
                }
                if (activeMajor && activeMajor.find((ac: any) => ac.challenge_id === challengeId)) {
                    return { error: { message: `أنت مشترك بالفعل في هذا التحدي وهو نشط حالياً!` } };
                }
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
        const { data: userChalls } = await supabase
            .from('user_challenges')
            .select('*, challenge_details:challenges(*)')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (!userChalls || userChalls.length === 0) return [];

        // Try matching by challenge_details.category from the join
        const withCategory = (userChalls || []).filter((uc: any) => {
            if (uc.challenge_details?.category === category) return true;
            return false;
        });

        if (withCategory.length > 0) return withCategory as UserChallenge[];

        // Fallback: get challenge IDs from challenges table and match
        const { data: challs } = await supabase.from('challenges').select('id, category');
        if (!challs) return [];
        const catIds = challs.filter((c: any) => c.category === category).map((c: any) => c.id);
        if (catIds.length === 0) return [];

        const matched = (userChalls || []).filter((uc: any) => catIds.includes(uc.challenge_id));

        // Enrich matched results with challenge data
        const enriched = await Promise.all(matched.map(async (uc: any) => {
            if (!uc.challenge_details) {
                const { data: c } = await supabase.from('challenges').select('*').eq('id', uc.challenge_id).maybeSingle();
                uc.challenge_details = c;
            }
            return uc;
        }));

        return enriched as UserChallenge[];
    },

    // تسجيل قراءة صفحة مع نظام حماية (للختمة)
    async recordPageRead(userId: string, pageNumber: number, durationSeconds: number) {
        let pointsAdded = 10;
        let challengeUpdated = false;
        let completedChallenges: { title: string; reward: number }[] = [];

        const KAHF_PAGES = [292,293,294,295,296,297,298,299,300,301,302,303,304];
        const today = new Date();
        const isFriday = today.getDay() === 5;

        try {
            // 1. Anti-cheat check
            if (durationSeconds < 2) {
                const { data: profile } = await supabase.from('profiles').select('cheat_warnings').eq('id', userId).maybeSingle();
                const newWarnings = (profile?.cheat_warnings || 0) + 1;
                if (newWarnings >= 5) {
                    await supabase.from('profiles').update({ cheat_warnings: 5, status: 'banned' }).eq('id', userId);
                    return { error: 'تم حظر حسابك', warnings: 5, isBanned: true };
                }
                await supabase.from('profiles').update({ cheat_warnings: newWarnings }).eq('id', userId);
                return { error: `⚠️ تحذير ${newWarnings}/5`, warnings: newWarnings };
            }

            // 2. Update active khatma challenges (كل التحديات النشطة)
            const activeKhatmas = await this.getActiveChallengesByCategory(userId, 'khatma');
            if (activeKhatmas.length === 0) {
                return { error: 'لا يوجد تحدي نشط لتسجيل القراءة فيه', success: false };
            }
            for (const ac of activeKhatmas) {
                let challenge = ac.challenge_details;
                if (!challenge) {
                    const { data: c } = await supabase.from('challenges').select('*').eq('id', ac.challenge_id).maybeSingle();
                    challenge = c;
                }
                const total = challenge?.total_pages || 604;
                const reward = challenge?.points_reward || 0;
                const title = challenge?.title || 'تحدي قرآني';
                const ctype = challenge?.challenge_type || 'pages';
                const startPage = challenge?.start_page || 1;
                const endPage = challenge?.end_page || 604;

                // تحقق من نطاق الصفحات: هل الصفحة ضمن نطاق التحدي؟
                if (pageNumber < startPage || pageNumber > endPage) continue;

                // تحقق خاص لتحدي سورة الكهف: لازم يكون يوم جمعة والصفحة ضمن الكهف
                if (ctype === 'friday_kahf') {
                    if (!isFriday) continue;
                    if (!KAHF_PAGES.includes(pageNumber)) continue;
                }

                const newPagesCompleted = (ac.pages_completed || 0) + 1;
                const isFinished = newPagesCompleted >= total;
                const { error: updateError } = await supabase.from('user_challenges')
                    .update({ last_page_read: pageNumber, pages_completed: newPagesCompleted, status: isFinished ? 'completed' : 'active' })
                    .eq('id', ac.id)
                    .eq('user_id', userId);
                if (updateError) {
                    console.error('فشل تحديث التحدي:', updateError);
                    return { error: 'فشل تحديث التحدي في قاعدة البيانات: ' + updateError.message, success: false };
                }
                challengeUpdated = true;
                if (isFinished) {
                    pointsAdded += reward;
                    completedChallenges.push({ title, reward });
                }
            }

            if (!challengeUpdated) {
                return { error: 'هذه الصفحة خارج نطاق التحدي الحالي', success: false };
            }

            // 3. Award points (try profiles first, fallback to users)
            try {
                const { data: p } = await supabase.from('profiles').select('total_points').eq('id', userId).maybeSingle();
                if (p) {
                    await supabase.from('profiles').update({ total_points: (p.total_points || 0) + pointsAdded }).eq('id', userId);
                }
            } catch {}
            try {
                const { data: u } = await supabase.from('users').select('total_points').eq('id', userId).maybeSingle();
                if (u) {
                    await supabase.from('users').update({ total_points: (u.total_points || 0) + pointsAdded }).eq('id', userId);
                }
            } catch {}

            // 4. Log to reading_logs (non-critical)
            try {
                await supabase.from('reading_logs').insert({ user_id: userId, page_number: pageNumber, read_duration_seconds: durationSeconds });
            } catch (e) {
                console.warn('Failed to insert reading_logs (RLS policy missing?):', e);
            }

            return { success: true, pointsAdded, challengeUpdated, completedChallenges };
        } catch (e) {
            console.error('recordPageRead error:', e);
            return { error: 'فشل تسجيل الصفحة، حاول مرة أخرى', success: false };
        }
    },

    // تسجيل إكمال ذكر فردي (يستخدم من صفحة الأذكار عند إكمال كل ذكر)
    async recordAzkarItem(userId: string, categoryType: AzkarType, itemId: number, metadata?: any) {
        const today = new Date().toISOString().split('T')[0];
        // منع التسجيل المكرر لنفس الذكر في نفس اليوم (نجلب كل سجلات اليوم ونطابق في JS)
        try {
            const { data: existing } = await supabase
                .from('activity_logs')
                .select('id, metadata')
                .eq('user_id', userId)
                .eq('activity_type', 'azkar_item')
                .eq('activity_subtype', categoryType)
                .gte('created_at', today)
                .limit(50);

            if (existing) {
                const alreadyDone = existing.some((r: any) => r.metadata?.item_id === itemId);
                if (alreadyDone) return { success: true, alreadyRecorded: true };
            }
        } catch (e) {
            console.warn('recordAzkarItem check failed, proceeding:', e);
        }

        try {
            const { error } = await supabase.from('activity_logs').insert({
                user_id: userId,
                activity_type: 'azkar_item',
                activity_subtype: categoryType,
                amount: 1,
                metadata: { item_id: itemId, ...metadata }
            });
            if (error) console.error('recordAzkarItem insert error:', error);
        } catch (e) {
            console.error('recordAzkarItem insert failed:', e);
        }

        return { success: true, alreadyRecorded: false };
    },

    // ========== Azkar Type Mapping Helpers ==========
    _azkarTypeMatches(type: AzkarType, challengeTitle: string): boolean {
        if ((type === 'morning' || type === 'evening') && challengeTitle.includes('الصباح والمساء')) return true;
        if (type === 'sleep' && challengeTitle.includes('النوم')) return true;
        if (type === 'post_prayer' && challengeTitle.includes('بعد الصلاة')) return true;
        if (type === 'ruqya' && challengeTitle.includes('الرقية')) return true;
        return false;
    },

    // تسجيل إكمال ورد أذكار كامل (يدوياً أو تلقائياً عند إكمال كل الأذكار في فئة)
    async recordAzkarCompletion(userId: string, type: AzkarType) {
        const today = new Date().toISOString().split('T')[0];
        let completedChallenges: { title: string; reward: number }[] = [];
        // منع التكرار: تحقق من وجود تسجيل كامل لهذا النوع اليوم
        try {
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
        } catch (e) {
            console.warn('recordAzkarCompletion check failed:', e);
        }

        // تسجيل إكمال الفئة
        try {
            const { error } = await supabase.from('activity_logs').insert({
                user_id: userId,
                activity_type: 'azkar',
                activity_subtype: type,
                amount: 1
            });
            if (error) console.error('Failed to insert azkar completion:', error);
        } catch (e) {
            console.error('Failed to insert azkar completion:', e);
        }

        // تحديث تقدم التحديات المناسبة
        const activeAzkarChallenges = await this.getActiveChallengesByCategory(userId, 'azkar');
        let pointsAdded = 50;

        if (activeAzkarChallenges.length > 0) {
            for (const activeChallenge of activeAzkarChallenges) {
                const title = activeChallenge.challenge_details?.title || '';
                if (!this._azkarTypeMatches(type, title)) continue;

                const newUnitsCompleted = activeChallenge.pages_completed + 1;
                const totalNeeded = activeChallenge.challenge_details?.total_pages || 60;
                const isFinished = newUnitsCompleted >= totalNeeded;

                try {
                    const { error } = await supabase.from('user_challenges')
                        .update({
                            pages_completed: newUnitsCompleted,
                            status: isFinished ? 'completed' : 'active'
                        })
                        .eq('id', activeChallenge.id)
                        .eq('user_id', userId);
                    if (error) console.error('Failed to update azkar challenge:', error);
                } catch (e) {
                    console.error('Failed to update azkar challenge:', e);
                }

                if (isFinished && activeChallenge.challenge_details) {
                    pointsAdded += activeChallenge.challenge_details.points_reward;
                    completedChallenges.push({
                        title: activeChallenge.challenge_details.title,
                        reward: activeChallenge.challenge_details.points_reward
                    });
                }
            }
        }

        await this._awardPoints(userId, pointsAdded);

        return { success: true, pointsAdded, completedChallenges };
    },

    // ── Helper: award points (profiles fallback to users) ──
    async _awardPoints(userId: string, amount: number) {
        try {
            const { data: p } = await supabase.from('profiles').select('total_points').eq('id', userId).maybeSingle();
            if (p) { await supabase.from('profiles').update({ total_points: (p.total_points || 0) + amount }).eq('id', userId); return; }
        } catch {}
        try {
            const { data: u } = await supabase.from('users').select('total_points').eq('id', userId).maybeSingle();
            if (u) { await supabase.from('users').update({ total_points: (u.total_points || 0) + amount }).eq('id', userId); }
        } catch {}
    },

    // تسجيل عدد تسبيحات
    async recordTasbeehCount(userId: string, amount: number) {
        let completedChallenges: { title: string; reward: number }[] = [];
        try {
            await supabase.from('activity_logs').insert({
                user_id: userId,
                activity_type: 'tasbeeh',
                amount: amount,
                metadata: { session_total: amount }
            });
        } catch (e) { console.warn('activity_logs insert failed:', e); }

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
                completedChallenges.push({
                    title: activeChallenge.challenge_details.title,
                    reward: activeChallenge.challenge_details.points_reward
                });
            }
        }

        await this._awardPoints(userId, pointsAdded);

        return { success: true, pointsAdded, completedChallenges };
    },

    // جلب كل التحديات النشطة للمستخدم (من جميع الفئات)
    async getUserActiveChallenges(userId: string) {
        const { data } = await supabase
            .from('user_challenges')
            .select('*, challenge_details:challenges(*)')
            .eq('user_id', userId)
            .eq('status', 'active');
        return (data || []) as UserChallenge[];
    },

    // إلغاء أو ترك التحدي
    async leaveChallenge(userId: string, challengeId: string) {
        const { error } = await supabase
            .from('user_challenges')
            .update({ status: 'cancelled' })
            .eq('user_id', userId)
            .eq('challenge_id', challengeId)
            .eq('status', 'active');
        return { error };
    },

    // جلب التحديات المنجزة للمستخدم
    async getCompletedChallenges(userId: string) {
        const { data } = await supabase
            .from('user_challenges')
            .select('*, challenge_details:challenges(*)')
            .eq('user_id', userId)
            .eq('status', 'completed');
        return (data || []) as UserChallenge[];
    },

    // ========== Friday Surat Al-Kahf Tracking ==========
    async checkFridayKahfStatus(userId: string) {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 5 = Friday
        const todayStr = today.toISOString().split('T')[0];

        // Check if today is Friday
        if (dayOfWeek !== 5) return { isFriday: false, kahfRead: false };

        // Check if user read any ayah from surah 18 today
        const { data: logs } = await supabase
            .from('reading_logs')
            .select('page_number')
            .eq('user_id', userId)
            .gte('created_at', todayStr)
            .lte('created_at', todayStr + 'T23:59:59.999Z');

        // Surah 18 (Al-Kahf) spans pages 292-304 in standard mushaf
        const KAHF_PAGES = [292,293,294,295,296,297,298,299,300,301,302,303,304];
        const kahfRead = logs?.some(log => KAHF_PAGES.includes(log.page_number)) || false;

        return { isFriday: true, kahfRead, today: todayStr };
    },

    async applyFridayPenalty(userId: string) {
        const status = await this.checkFridayKahfStatus(userId);
        if (!status.isFriday) return { message: 'اليوم ليس جمعة' };
        if (status.kahfRead) return { message: 'تم قراءة سورة الكهف ✅', passed: true };

        // Penalty: deduct 100 points if they didn't read
        const { data: user } = await supabase
            .from('profiles')
            .select('total_points')
            .eq('id', userId)
            .single();

        if (user) {
            const newPoints = Math.max(0, user.total_points - 100);
            await supabase.from('profiles')
                .update({ total_points: newPoints })
                .eq('id', userId);
            await supabase.from('activity_logs').insert({
                user_id: userId,
                activity_type: 'penalty',
                activity_subtype: 'friday_kahf',
                amount: -100,
                metadata: { reason: 'عدم قراءة سورة الكهف يوم الجمعة' }
            });
        }
        return { message: 'تم خصم 100 نقطة لعدم قراءة سورة الكهف', penalty: 100, passed: false };
    },

    // ========== Auto Penalty System ==========
    async checkAndApplyDailyPenalties(userId: string) {
        const today = new Date().toISOString().split('T')[0];
        const results: string[] = [];

        // 1. Friday Kahf check
        const kahfStatus = await this.checkFridayKahfStatus(userId);
        if (kahfStatus.isFriday && !kahfStatus.kahfRead) {
            const { data: existingPenalty } = await supabase
                .from('activity_logs')
                .select('id')
                .eq('user_id', userId)
                .eq('activity_type', 'penalty')
                .eq('activity_subtype', 'friday_kahf')
                .gte('created_at', today)
                .limit(1);

            if (!existingPenalty || existingPenalty.length === 0) {
                await this.applyFridayPenalty(userId);
                results.push('خصم 100 نقطة: عدم قراءة سورة الكهف');
            }
        }

        // 2. Check active challenge deadlines
        const activeChallenges = await this.getUserActiveChallenges(userId);
        for (const uc of activeChallenges) {
            if (!uc.challenge_details) continue;
            const start = new Date(uc.start_date);
            const end = new Date(start);
            end.setDate(end.getDate() + uc.challenge_details.days_duration);

            if (new Date() > end) {
                // Deadline passed - auto-fail
                await supabase.from('user_challenges')
                    .update({ status: 'failed' })
                    .eq('id', uc.id);

                // Penalty: lose points
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('total_points')
                    .eq('id', userId)
                    .single();

                if (profile) {
                    const penalty = Math.min(200, Math.floor(uc.challenge_details.points_reward * 0.5));
                    const newPoints = Math.max(0, profile.total_points - penalty);
                    await supabase.from('profiles')
                        .update({ total_points: newPoints })
                        .eq('id', userId);
                    results.push(`خصم ${penalty} نقطة: فشل في تحدي "${uc.challenge_details.title}"`);
                }
            }
        }

        return results;
    },

    // ========== Auto-track Reading for Active Challenges ==========
    async autoTrackPageRead(userId: string, pageNumber: number, durationSeconds: number) {
        // First do the normal recording
        const result = await this.recordPageRead(userId, pageNumber, durationSeconds);
        return result;
    },

    // جلب حالة جميع التحديات النشطة مع التقدم المحسوب
    async getDetailedActiveChallenges(userId: string) {
        const active = await this.getUserActiveChallenges(userId);
        const [kahfStatus, fridayCheck] = await Promise.all([
            this.checkFridayKahfStatus(userId),
            supabase.from('profiles').select('total_points, cheat_warnings').eq('id', userId).single(),
        ]);

        const today = new Date().toISOString().split('T')[0];
        const azkarProgress: Record<AzkarType, boolean> = {
            morning: false, evening: false, sleep: false, post_prayer: false, ruqya: false,
        };
        let azkarItemCounts: Record<AzkarType, number> = {
            morning: 0, evening: 0, sleep: 0, post_prayer: 0, ruqya: 0,
        };

        const [azkarLogs, azkarItemLogs] = await Promise.all([
            supabase.from('activity_logs').select('activity_subtype').eq('user_id', userId).eq('activity_type', 'azkar').gte('created_at', today),
            supabase.from('activity_logs').select('activity_subtype, count').eq('user_id', userId).eq('activity_type', 'azkar_item').gte('created_at', today),
        ]);

        if (azkarLogs.data) {
            for (const key of Object.keys(azkarProgress) as AzkarType[]) {
                azkarProgress[key] = azkarLogs.data.some(l => l.activity_subtype === key);
            }
        }

        if (azkarItemLogs.data) {
            for (const key of Object.keys(azkarItemCounts) as AzkarType[]) {
                azkarItemCounts[key] = azkarItemLogs.data.filter(l => l.activity_subtype === key).length;
            }
        }

        const { data: tasbeehToday } = await supabase
            .from('activity_logs')
            .select('amount')
            .eq('user_id', userId)
            .eq('activity_type', 'tasbeeh')
            .gte('created_at', today);

        const tasbeehCount = tasbeehToday?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;

        return {
            activeChallenges: active,
            fridayKahf: kahfStatus,
            todayAzkar: azkarProgress,
            todayAzkarItems: azkarItemCounts,
            todayTasbeeh: tasbeehCount,
            profile: fridayCheck.data || { total_points: 0, cheat_warnings: 0 },
        };
    },

    // ========== Tasbeeh Daily Progress ==========
    async getTasbeehDailyProgress(userId: string) {
        const today = new Date().toISOString().split('T')[0];
        let todayCount = 0;
        try {
            const { data } = await supabase
                .from('activity_logs')
                .select('amount')
                .eq('user_id', userId)
                .eq('activity_type', 'tasbeeh')
                .gte('created_at', today);
            if (data) todayCount = data.reduce((sum, r) => sum + (r.amount || 0), 0);
        } catch (e) { console.warn('getTasbeehDailyProgress error:', e); }
        return todayCount;
    },

    // ========== Azkar Daily Progress ==========
    async getAzkarDailyProgress(userId: string) {
        const today = new Date().toISOString().split('T')[0];
        const progress: Record<AzkarType, boolean> = {
            morning: false, evening: false, sleep: false, post_prayer: false, ruqya: false,
        };
        const itemCounts: Record<AzkarType, number> = {
            morning: 0, evening: 0, sleep: 0, post_prayer: 0, ruqya: 0,
        };

        const [azkarLogs, azkarItemLogs] = await Promise.all([
            supabase.from('activity_logs').select('activity_subtype').eq('user_id', userId).eq('activity_type', 'azkar').gte('created_at', today),
            supabase.from('activity_logs').select('activity_subtype').eq('user_id', userId).eq('activity_type', 'azkar_item').gte('created_at', today),
        ]);

        if (azkarLogs.data) {
            for (const key of Object.keys(progress) as AzkarType[]) {
                progress[key] = azkarLogs.data.some(l => l.activity_subtype === key);
            }
        }
        if (azkarItemLogs.data) {
            for (const key of Object.keys(itemCounts) as AzkarType[]) {
                itemCounts[key] = azkarItemLogs.data.filter(l => l.activity_subtype === key).length;
            }
        }

        return { progress, itemCounts };
    },

    // ========== Azkar & Tasbeeh Recording ==========
    async recordAzkarMorning(userId: string) {
        return this.recordAzkarCompletion(userId, 'morning');
    },

    async recordAzkarEvening(userId: string) {
        return this.recordAzkarCompletion(userId, 'evening');
    },

    async recordAzkarSleep(userId: string) {
        return this.recordAzkarCompletion(userId, 'sleep');
    },

    async recordAzkarPostPrayer(userId: string) {
        return this.recordAzkarCompletion(userId, 'post_prayer');
    },

    async recordAzkarRuqya(userId: string) {
        return this.recordAzkarCompletion(userId, 'ruqya');
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
