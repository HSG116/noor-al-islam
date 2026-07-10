
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Trophy, Star, Target, Users, Zap, Calendar, Medal, Crown, ArrowRight, Flag, Loader2, Sparkles, User, LogIn, Sun, BookOpen, Brain, Clock, Gift, Flame, Shield, CheckCircle, ChevronLeft, Layers, BadgeCheck, Award, TrendingUp, Timer, XCircle, RefreshCw, BarChart3, Activity, Hourglass } from 'lucide-react';
import { challengeService, Challenge, UserChallenge, AzkarType, AZKAR_TYPES } from '../services/challengeService';
import { supabase } from '../supabaseClient';
import { submitDailyAnswer, getActiveWeeklyCompetition, joinWeeklyCompetition, getUserWeeklyStats, getWeeklyLeaderboard } from '../services/competitionService';
import { getTodaysQuizWithAnswer, submitAnswer, getQuestionCycle, getTodayQuestion } from '../services/dailyQuestionsService';

const LEVEL_COLORS = ['from-emerald-500 to-teal-500', 'from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-rose-500 to-red-500'];
const ORANGE = 'from-amber-500 to-orange-500';
const EMERALD = 'from-emerald-500 to-teal-500';
const BLUE = 'from-blue-500 to-cyan-500';
const PURPLE = 'from-purple-500 to-pink-600';

const MiniLoader = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="animate-spin text-emerald-500" size={28} />
  </div>
);

const tabs = [
  { key: 'daily', label: 'التحدي اليومي', icon: Brain },
  { key: 'challenges', label: 'التحديات الكبرى', icon: Target },
  { key: 'achievements', label: 'إنجازاتي', icon: Award },
  { key: 'leaderboard', label: 'المتصدرون', icon: Crown },
  { key: 'weekly', label: 'مسابقة الأسبوع', icon: Calendar },
];

const categoryMeta: Record<string, { icon: any; grad: string; label: string }> = {
  khatma: { icon: BookOpen, grad: EMERALD, label: 'قرآني' },
  azkar: { icon: Sun, grad: ORANGE, label: 'أذكار' },
  tasbeeh: { icon: Star, grad: BLUE, label: 'تسبيح' },
};

export const Competitions: React.FC<{ session: any }> = ({ session }) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['daily']));
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({ daily: true });

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [dailyQuiz, setDailyQuiz] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [questionCycle, setQuestionCycle] = useState<any>(null);

  const [weeklyComp, setWeeklyComp] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [joiningWeekly, setJoiningWeekly] = useState(false);

  const [achievements, setAchievements] = useState<any>(null);

  // Active challenges state (visible across all tabs)
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null);

  // Daily tracking state (azkar, tasbeeh, friday kahf)
  const [todayTracking, setTodayTracking] = useState<any>(null);
  const [recordingAzkar, setRecordingAzkar] = useState<string | null>(null);
  const [tasbeehInput, setTasbeehInput] = useState('');
  const [recordingTasbeeh, setRecordingTasbeeh] = useState(false);

  // Load detailed tracking on mount and refresh periodically
  const loadDetailedTracking = useCallback(async () => {
    if (!session?.user) { setLoadingActive(false); return; }
    try {
      const detailed = await challengeService.getDetailedActiveChallenges(session.user.id);
      setActiveChallenges(detailed.activeChallenges || []);
      setTodayTracking({
        fridayKahf: detailed.fridayKahf,
        azkar: detailed.todayAzkar,
        tasbeehCount: detailed.todayTasbeeh,
        totalPoints: detailed.profile.total_points,
        warnings: detailed.profile.cheat_warnings,
      });
    } catch (e) { console.error(e); }
    setLoadingActive(false);
  }, [session]);

  // Load active challenges + tracking once on mount
  useEffect(() => {
    loadDetailedTracking();
  }, [loadDetailedTracking]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(loadDetailedTracking, 60000);
    return () => clearInterval(interval);
  }, [loadDetailedTracking]);

  const handleAzkarRecord = async (type: AzkarType) => {
    if (!session?.user || recordingAzkar) return;
    setRecordingAzkar(type);
    const result = await challengeService.recordAzkarCompletion(session.user.id, type);
    if (result.error) { alert(result.error); }
    else { await loadDetailedTracking(); }
    setRecordingAzkar(null);
  };

  const handleTasbeehRecord = async () => {
    if (!session?.user || recordingTasbeeh) return;
    const count = parseInt(tasbeehInput) || 0;
    if (count < 1 || count > 10000) { alert('أدخل رقماً بين 1 و 10000'); return; }
    setRecordingTasbeeh(true);
    await challengeService.recordTasbeehCount(session.user.id, count);
    setTasbeehInput('');
    await loadDetailedTracking();
    setRecordingTasbeeh(false);
  };

  const handleLeave = async (challengeId: string) => {
    if (!session?.user || leavingId) return;
    setLeavingId(challengeId);
    const { error } = await challengeService.leaveChallenge(session.user.id, challengeId);
    if (error) { alert('حدث خطأ: ' + error.message); }
    else {
      await loadDetailedTracking();
    }
    setLeavingId(null);
    setConfirmLeave(null);
  };

  // --- Tab Loaders ---
  const loadDailyTab = useCallback(async () => {
    try {
      const cycle = getQuestionCycle();
      setQuestionCycle(cycle);

      // Try DB quiz first (admin override)
      const today = new Date().toISOString().split('T')[0];
      const [quizResult, userResult, challCount] = await Promise.all([
        supabase.from('daily_quizzes').select('*').eq('date', today).maybeSingle(),
        session?.user ? supabase.from('users').select('total_points, streak_days, badges_array').eq('id', session.user.id).single() : null,
        session?.user ? supabase.from('user_challenges').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('status', 'completed') : null,
      ]);

      if (quizResult?.data) {
        // Admin inserted a quiz for today
        let userAnswer = null;
        if (session?.user) {
          const { data: ans } = await supabase.from('quiz_answers').select('*').eq('user_id', session.user.id).eq('quiz_id', quizResult.data.id).maybeSingle();
          userAnswer = ans;
        }
        setDailyQuiz({ quiz: quizResult.data, userAnswer, isAuto: false });
      } else {
        // Use auto-generated question from the 300 bank
        const result = await getTodaysQuizWithAnswer(session?.user?.id || null);
        setDailyQuiz({ quiz: result.question, userAnswer: result.answered ? { is_correct: result.isCorrect, selected_answer: result.selectedAnswer } : null, isAuto: true });
      }

      if (userResult?.data) {
        const u = userResult.data;
        setAchievements({
          total_points: u?.total_points || 0, streak_days: u?.streak_days || 0,
          badges_array: u?.badges_array || [], completedChallenges: challCount?.count || 0,
        });
      }
    } catch (e) { console.error(e); }
    setTabLoading(p => ({ ...p, daily: false }));
  }, [session]);

  const loadChallengesTab = useCallback(async () => {
    try {
      const [challs, players] = await Promise.all([
        challengeService.getAvailableChallenges(),
        challengeService.getLeaderboard()
      ]);
      setChallenges(challs || []);
      setLeaderboard(players || []);
    } catch (e) { console.error(e); }
    setTabLoading(p => ({ ...p, challenges: false }));
  }, []);

  const loadAchievementsTab = useCallback(async () => {
    if (!session?.user) { setTabLoading(p => ({ ...p, achievements: false })); return; }
    try {
      const [userResult, completedChallCount, correctCount, completedList] = await Promise.all([
        supabase.from('users').select('total_points, streak_days, badges_array').eq('id', session.user.id).maybeSingle(),
        supabase.from('user_challenges').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('status', 'completed'),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('is_correct', true),
        challengeService.getCompletedChallenges(session.user.id),
      ]);
      const user = userResult.data;
      const level = Math.floor((user?.total_points || 0) / 500) + 1;
      setAchievements({
        total_points: user?.total_points || 0, streak_days: user?.streak_days || 0,
        badges_array: user?.badges_array || [], completedChallenges: completedChallCount.count || 0,
        correctAnswers: correctCount.count || 0, level, nextLevelPoints: level * 500,
        pointsToNextLevel: Math.max(0, level * 500 - (user?.total_points || 0)),
        completedList: completedList || [],
      });
    } catch (e) { console.error(e); }
    setTabLoading(p => ({ ...p, achievements: false }));
  }, [session]);

  const loadLeaderboardTab = useCallback(async () => {
    try {
      const players = await challengeService.getLeaderboard();
      setLeaderboard(players || []);
    } catch (e) { console.error(e); }
    setTabLoading(p => ({ ...p, leaderboard: false }));
  }, []);

  const loadWeeklyTab = useCallback(async () => {
    if (!session?.user) { setTabLoading(p => ({ ...p, weekly: false })); return; }
    try {
      const weekly = await getActiveWeeklyCompetition();
      setWeeklyComp(weekly);
      if (weekly) {
        const [stats, wlb] = await Promise.all([
          getUserWeeklyStats(session.user.id, weekly.id),
          getWeeklyLeaderboard(weekly.id),
        ]);
        setWeeklyStats(stats);
        setWeeklyLeaderboard(wlb);
      }
    } catch (e) { console.error(e); }
    setTabLoading(p => ({ ...p, weekly: false }));
  }, [session]);

  const tabLoaders: Record<string, () => Promise<void>> = {
    daily: loadDailyTab, challenges: loadChallengesTab,
    achievements: loadAchievementsTab, leaderboard: loadLeaderboardTab, weekly: loadWeeklyTab,
  };

  useEffect(() => { tabLoaders[activeTab]?.(); }, [activeTab]);

  const switchTab = (key: string) => {
    setActiveTab(key);
    if (!loadedTabs.has(key)) {
      setLoadedTabs(p => new Set(p).add(key));
      setTabLoading(p => ({ ...p, [key]: true }));
    }
  };

  const handleJoin = async (challengeId: string) => {
    if (!session?.user) return;
    const { error } = await challengeService.joinChallenge(session.user.id, challengeId);
    if (error) alert(error.message);
    else {
      const fresh = await challengeService.getUserActiveChallenges(session.user.id);
      setActiveChallenges(fresh || []);
    }
  };

  const handleDailyAnswer = async (idx: number) => {
    if (!session?.user || !dailyQuiz?.quiz || selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setSubmittingAnswer(true);
    try {
      if (dailyQuiz.isAuto) {
        const result = await submitAnswer(session.user.id, dailyQuiz.quiz.id, idx, dailyQuiz.quiz.c, 50);
        setAnswerResult(result.isCorrect);
        setDailyQuiz((prev: any) => prev ? { ...prev, userAnswer: { is_correct: result.isCorrect, selected_answer: idx } } : prev);
        if (result.isCorrect && achievements) setAchievements({ ...achievements, total_points: achievements.total_points + 50 });
      } else {
        const result = await submitDailyAnswer(session.user.id, dailyQuiz.quiz.id, idx, dailyQuiz.quiz.correct_answer_index);
        setAnswerResult(result.isCorrect);
        setDailyQuiz((prev: any) => prev ? { ...prev, userAnswer: { is_correct: result.isCorrect, selected_answer: idx } } : prev);
        if (result.isCorrect && achievements) setAchievements({ ...achievements, total_points: achievements.total_points + 50 });
      }
    } catch (e: any) { alert(e.message || 'حدث خطأ'); }
    setSubmittingAnswer(false);
  };

  const handleJoinWeekly = async () => {
    if (!session?.user || !weeklyComp) return;
    setJoiningWeekly(true);
    await joinWeeklyCompetition(session.user.id, weeklyComp.id);
    const stats = await getUserWeeklyStats(session.user.id, weeklyComp.id);
    setWeeklyStats(stats);
    setJoiningWeekly(false);
  };

  const progressPercent = (uc: UserChallenge) => {
    if (!uc.challenge_details) return 0;
    const target = uc.challenge_details.total_pages;
    return target > 0 ? Math.min(100, Math.round((uc.pages_completed / target) * 100)) : 0;
  };

  const daysLeft = (startDate: string, duration: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + duration);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // ==================== RENDER ====================
  if (!session?.user) {
    const handleGoogleLogin = async () => {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      if (error) alert('حدث خطأ أثناء تسجيل الدخول: ' + error.message);
    };
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-20 text-center animate-in zoom-in duration-500">
        <div className="relative glass-panel p-8 md:p-12 rounded-[3.5rem] border border-emerald-500/20 shadow-[0_20px_60px_rgba(16,185,129,0.15)] flex flex-col items-center gap-6 overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all"></div>
          <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-4xl shadow-2xl shadow-emerald-500/30 relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"><Trophy size={48} className="drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]" /></div>
          <div className="relative z-10 space-y-3"><h2 className="text-3xl md:text-4xl font-black text-white">ساحة المسابقات</h2><p className="text-gray-400 leading-relaxed text-sm md:text-base font-medium max-w-xs mx-auto">سجّل دخولك وانطلق في رحلة التنافس في الخيرات!</p></div>
          <button onClick={handleGoogleLogin} className="relative z-10 flex items-center justify-center gap-4 w-full bg-white text-black py-4 px-6 rounded-2xl font-black text-sm hover:bg-emerald-50 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 border border-white/20">
            <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            تسجيل الدخول باستخدام جوجل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 md:px-4 pb-32 space-y-4 md:space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative py-3 md:py-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-black mb-2 shadow-lg shadow-emerald-500/5">
          <Sparkles size={12} className="animate-pulse" /><span>منصة المسابقات والتنافس في الخيرات</span><Sparkles size={12} className="animate-pulse" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white premium-text-gradient leading-tight">سابقوا إلى <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-teal-300">مغفرة</span></h1>
      </motion.div>

      {/* Friday Kahf Banner - shows on Friday */}
      {todayTracking?.fridayKahf?.isFriday && (
        <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`glass-panel rounded-2xl md:rounded-3xl p-4 md:p-6 border overflow-hidden ${todayTracking.fridayKahf.kahfRead ? 'border-emerald-500/30 bg-gradient-to-l from-emerald-500/10 to-transparent' : 'border-amber-500/30 bg-gradient-to-l from-amber-500/10 to-transparent'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-xl shrink-0 ${todayTracking.fridayKahf.kahfRead ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
              {todayTracking.fridayKahf.kahfRead ? <CheckCircle size={24} className="text-white" /> : <BookOpen size={24} className="text-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-lg font-black text-white">📖 تحدي سورة الكهف</h3>
                {todayTracking.fridayKahf.kahfRead ? (
                  <span className="text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">تم ✅</span>
                ) : (
                  <span className="text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">لم تقرأ بعد ⚠️</span>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-gray-400 font-bold mt-0.5">
                {todayTracking.fridayKahf.kahfRead
                  ? 'أحسنت! قراءة سورة الكهف يوم الجمعة نور ما بين الجمعتين ✨'
                  : 'اليوم جمعة! اقرأ سورة الكهف قبل المغرب وإلا سيتم خصم 100 نقطة!'}
              </p>
            </div>
            {!todayTracking.fridayKahf.kahfRead && (
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-[9px] md:text-xs whitespace-nowrap">
                <Timer size={12} /> متبقي
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Active Challenges Banner - shows across all tabs */}
      {!loadingActive && activeChallenges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-[10px] md:text-xs font-black px-1">
            <Activity size={12} className="animate-pulse" /> التحديات النشطة
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {activeChallenges.map(uc => {
              const cat = uc.challenge_details?.category;
              const meta = categoryMeta[cat || 'khatma'] || categoryMeta.khatma;
              const Icon = meta.icon;
              const pct = progressPercent(uc);
              const remaining = daysLeft(uc.start_date, uc.challenge_details?.days_duration || 1);
              const isConfirming = confirmLeave === uc.challenge_id;

              return (
                <motion.div key={uc.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="glass-panel rounded-2xl p-3 md:p-4 border border-emerald-500/15 bg-gradient-to-l from-emerald-500/5 to-transparent group">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br ${meta.grad} rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs md:text-sm font-black text-white truncate">{uc.challenge_details?.title || 'تحدي'}</h4>
                        <div className="flex items-center gap-1">
                          <span className={`text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full ${cat === 'khatma' ? 'text-emerald-400 bg-emerald-500/10' : cat === 'azkar' ? 'text-amber-400 bg-amber-500/10' : 'text-blue-400 bg-blue-500/10'}`}>{meta.label}</span>
                          {cat === 'khatma' && uc.challenge_details?.tier && (
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${uc.challenge_details.tier === 'major' ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20' : 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'}`}>
                              {uc.challenge_details.tier === 'major' ? 'كبير' : 'صغير'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] md:text-[10px] text-gray-500 font-bold">
                        <span className="flex items-center gap-1"><BarChart3 size={10} /> {pct}%</span>
                        <span className="flex items-center gap-1"><Hourglass size={10} /> {remaining} يوم</span>
                        <span className="flex items-center gap-1"><Zap size={10} /> +{uc.challenge_details?.points_reward || 0}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                          className={`h-full rounded-full bg-gradient-to-l ${meta.grad}`} />
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleLeave(uc.challenge_id)} disabled={leavingId === uc.challenge_id}
                            className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all">
                            {leavingId === uc.challenge_id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          </button>
                          <button onClick={() => setConfirmLeave(null)} className="w-7 h-7 rounded-lg bg-white/10 text-gray-400 flex items-center justify-center hover:bg-white/20 transition-all">
                            <XCircle size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmLeave(uc.challenge_id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all" title="إلغاء التحدي">
                          <XCircle size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  {isConfirming && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-[8px] md:text-[9px] text-red-400 font-bold mt-1.5 pr-12">
                      هل تريد إلغاء هذا التحدي؟ سيتم حذف تقدمك!
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="sticky top-14 md:top-16 z-40 -mx-3 md:mx-0 px-3 md:px-0 py-2 bg-gradient-to-b from-[#0a0a1a] via-[#0a0a1a]/95 to-transparent backdrop-blur-xl">
        <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-none justify-start md:justify-center" dir="ltr">
          {tabs.map(tab => {
            const Icon = tab.icon; const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => switchTab(tab.key)}
                className={`relative flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs whitespace-nowrap transition-all duration-300 shrink-0
                  ${isActive ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/40 scale-105 md:scale-110' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'}`}>
                <Icon size={14} className={isActive ? 'animate-bounce' : ''} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'daily' && (
          <motion.div key="daily" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4 md:space-y-6">
            {tabLoading.daily ? <MiniLoader /> : (
              <>
                <div className="glass-panel rounded-[2.5rem] md:rounded-[3rem] border border-emerald-500/20 overflow-hidden shadow-2xl shadow-emerald-900/10">
                  <div className="relative p-6 md:p-10 bg-gradient-to-br from-emerald-600/20 via-teal-600/10 to-transparent">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
                      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl"></div>
                    </div>

                    {/* Header */}
                    <div className="relative z-10 mb-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-900/40 shrink-0 ring-2 ring-emerald-400/20 group-hover:scale-110 transition-transform duration-500">
                          <Brain size={30} className="text-white drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-emerald-400/80 text-[10px] md:text-xs font-black mb-0.5">
                            <Sparkles size={12} className="animate-pulse" />
                            <span>التحدي اليومي</span>
                            <Sparkles size={12} className="animate-pulse" />
                          </div>
                          <h2 className="text-2xl md:text-4xl font-black text-white premium-text-gradient leading-tight">سؤال اليوم</h2>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/10 rounded-2xl border border-emerald-500/20 shadow-lg">
                          <Zap size={16} className="text-emerald-400" fill="currentColor" />
                          <span className="text-emerald-400 font-black text-sm">50 نقطة</span>
                        </div>
                      </div>
                      {questionCycle && dailyQuiz?.isAuto !== false && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-2xl p-3 md:p-4 border border-emerald-500/10 shadow-inner">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shrink-0">
                            <Brain size={16} className="text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-emerald-400/90 font-black text-xs md:text-sm">سؤال اليوم</span>
                              <span className="text-emerald-400/70 font-black text-[10px] md:text-xs">{questionCycle.dayNumber} / {questionCycle.total}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(questionCycle.dayNumber / questionCycle.total) * 100}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {dailyQuiz?.userAnswer ? (
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="text-center py-8 md:py-14">
                        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                          className={`inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full mb-6 shadow-2xl ${
                            dailyQuiz.userAnswer.is_correct
                              ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 text-emerald-400 ring-[3px] ring-emerald-500/30'
                              : 'bg-gradient-to-br from-red-500/30 to-red-500/10 text-red-400 ring-[3px] ring-red-500/30'
                          }`}>
                          {dailyQuiz.userAnswer.is_correct ? <BadgeCheck size={52} className="drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" /> : <XCircle size={52} />}
                        </motion.div>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                          <h3 className={`text-3xl md:text-4xl font-black mb-2 ${dailyQuiz.userAnswer.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                            {dailyQuiz.userAnswer.is_correct ? 'إجابة صحيحة! 🎉' : 'إجابة خاطئة'}
                          </h3>
                          <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-sm md:text-base mt-2">
                            <Calendar size={14} />
                            <span>عد غداً لسؤال جديد</span>
                            <Calendar size={14} />
                          </div>
                        </motion.div>
                        {/* Show correct answer */}
                        {!dailyQuiz.userAnswer.is_correct && dailyQuiz.quiz && (
                          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                            className="mt-6 inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 rounded-2xl border border-emerald-500/20 shadow-lg">
                            <Brain size={18} className="text-emerald-400 shrink-0" />
                            <p className="text-emerald-400/90 text-sm md:text-base font-black">
                              {dailyQuiz.quiz.c !== undefined
                                ? String.fromCharCode(65 + dailyQuiz.quiz.c) + '. ' + dailyQuiz.quiz.o[dailyQuiz.quiz.c]
                                : String.fromCharCode(65 + dailyQuiz.quiz.correct_answer_index) + '. ' + dailyQuiz.quiz.options_array?.[dailyQuiz.quiz.correct_answer_index]}
                            </p>
                          </motion.div>
                        )}
                        {dailyQuiz.userAnswer.is_correct && (
                          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                            className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500/15 to-orange-500/10 rounded-2xl border border-amber-500/20 shadow-lg">
                            <Zap size={18} className="text-amber-400" fill="currentColor" />
                            <span className="text-amber-400 font-black text-sm md:text-base">+50 نقطة</span>
                          </motion.div>
                        )}
                      </motion.div>
                    ) : dailyQuiz?.quiz ? (
                      <div className="space-y-6 md:space-y-8">
                        {/* Question */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-gradient-to-br from-white/[0.07] to-white/[0.02] rounded-3xl md:rounded-[2.5rem] p-8 md:p-10 border border-emerald-500/10 shadow-2xl overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none"></div>
                          <div className="relative">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/10 rounded-xl border border-emerald-500/20 shadow-lg">
                                <span className="text-[9px] font-black text-emerald-400">{dailyQuiz.quiz.cat || 'إسلامي'}</span>
                              </div>
                              {dailyQuiz.isAuto && questionCycle && (
                                <div className="px-3 py-1 bg-gradient-to-r from-teal-500/20 to-cyan-500/10 rounded-xl border border-teal-500/20">
                                  <span className="text-[9px] font-black text-teal-400">يومي</span>
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <div className="absolute -top-4 -right-4 text-emerald-500/10 text-7xl font-black leading-none select-none">"</div>
                              <p className="text-lg md:text-3xl font-black text-white leading-relaxed text-center px-2 md:px-8">
                                {dailyQuiz.quiz.q || dailyQuiz.quiz.question_text}
                              </p>
                              <div className="absolute -bottom-8 -left-4 text-emerald-500/10 text-7xl font-black leading-none select-none rotate-180">"</div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {(dailyQuiz.quiz.o || dailyQuiz.quiz.options_array || []).map((opt: string, idx: number) => {
                            const isSelected = selectedAnswer === idx;
                            const showResult = answerResult !== null;
                            const correctIdx = dailyQuiz.quiz.c !== undefined ? dailyQuiz.quiz.c : dailyQuiz.quiz.correct_answer_index;
                            const isCorrect = idx === correctIdx;
                            let bgClass = 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-emerald-500/20';
                            if (showResult && isCorrect) bgClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10';
                            else if (showResult && isSelected && !isCorrect) bgClass = 'bg-red-500/20 border-red-500/50 text-red-400 ring-2 ring-red-500/20';
                            else if (isSelected) bgClass = 'bg-emerald-500/15 border-emerald-500/30';
                            return (
                              <motion.button
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08, type: 'spring', stiffness: 200 }}
                                onClick={() => handleDailyAnswer(idx)}
                                disabled={selectedAnswer !== null || submittingAnswer}
                                className={`group relative p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 text-right text-sm md:text-lg font-bold transition-all duration-300 ${bgClass} ${!showResult && !isSelected ? 'hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-900/20 active:scale-[0.98] cursor-pointer' : 'cursor-default'}`}
                              >
                                <div className="flex items-center gap-4">
                                  <span className={`w-10 h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-xs md:text-sm font-black transition-all duration-300 shrink-0 ${
                                    isSelected || (showResult && isCorrect)
                                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white scale-110 shadow-xl shadow-emerald-900/30'
                                      : showResult && isSelected && !isCorrect
                                      ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl'
                                      : 'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white'
                                  }`}>
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span className="flex-1 leading-relaxed">{opt}</span>
                                  {showResult && isCorrect && <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle size={20} className="text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" /></div>}
                                  {showResult && isSelected && !isCorrect && <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center"><XCircle size={20} className="text-red-400" /></div>}
                                </div>
                                {showResult && isCorrect && (
                                  <div className="absolute inset-0 rounded-2xl md:rounded-3xl border-2 border-emerald-500/20 pointer-events-none"></div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>

                        {submittingAnswer && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3 text-emerald-400 font-black py-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
                              <Loader2 size={18} className="animate-spin text-white" />
                            </div>
                            <span className="text-sm md:text-base">جاري التحقق من الإجابة...</span>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 md:py-16">
                        <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                          <Calendar size={36} className="text-gray-500" />
                        </div>
                        <p className="text-gray-500 font-bold text-lg">لا يوجد سؤال اليوم</p>
                        <p className="text-gray-600 text-sm">عد لاحقاً أو اطلب من المشرف إضافة سؤال</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Daily Tracking: Azkar + Tasbeeh */}
                {todayTracking && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {/* Azkar - جميع الأنواع الخمسة */}
                    <div className="glass-panel rounded-2xl md:rounded-3xl p-4 md:p-6 border border-amber-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"><Sun size={16} className="text-white" /></div>
                        <h3 className="text-sm md:text-base font-black text-white">الأذكار اليومية</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                        {([
                          { type: 'morning' as AzkarType, label: 'أذكار الصباح', icon: Sun },
                          { type: 'evening' as AzkarType, label: 'أذكار المساء', icon: Moon },
                          { type: 'sleep' as AzkarType, label: 'أذكار النوم', icon: Star },
                          { type: 'post_prayer' as AzkarType, label: 'بعد الصلاة', icon: Clock },
                          { type: 'ruqya' as AzkarType, label: 'الرقية', icon: Shield },
                        ]).map(({ type, label, icon: AzkarIcon }) => {
                          const isDone = todayTracking.azkar[type];
                          const isRecording = recordingAzkar === type;
                          return (
                            <button key={type} onClick={() => handleAzkarRecord(type)}
                              disabled={isRecording || isDone}
                              className={`p-2 md:p-3 rounded-xl font-black text-[8px] md:text-[10px] border transition-all flex flex-col items-center gap-1 ${
                                isDone
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                  : isRecording
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-amber-500/10 hover:border-amber-500/30'
                              }`}>
                              <AzkarIcon size={12} className="md:w-3.5 md:h-3.5" />
                              <span className="leading-tight text-center">{label}</span>
                              {isDone && <CheckCircle size={10} className="shrink-0" />}
                              {isRecording && <Loader2 size={10} className="animate-spin shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tasbeeh */}
                    <div className="glass-panel rounded-2xl md:rounded-3xl p-4 md:p-6 border border-blue-500/10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg"><Star size={16} className="text-white" /></div>
                        <div className="flex-1">
                          <h3 className="text-sm md:text-base font-black text-white">التسبيح</h3>
                          <p className="text-[8px] md:text-[9px] text-gray-500 font-bold">اليوم: {todayTracking.tasbeehCount} تسبيحة</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input type="number" value={tasbeehInput} onChange={e => setTasbeehInput(e.target.value)} placeholder="عدد التسبيحات"
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs md:text-sm font-bold text-right focus:outline-none focus:border-blue-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        <button onClick={handleTasbeehRecord} disabled={recordingTasbeeh || !tasbeehInput}
                          className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2.5 rounded-xl font-black text-[10px] md:text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-900/30">
                          {recordingTasbeeh ? <Loader2 size={14} className="animate-spin" /> : 'تسجيل'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {achievements && (
                  <div className="glass-panel rounded-2xl md:rounded-3xl p-4 md:p-6 border border-amber-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/30"><Flame size={20} className="text-white" /></div>
                      <div><p className="text-white font-black text-sm">سلسلة التحديات</p><p className="text-gray-400 text-[10px] font-bold">عدد الأيام المتتالية</p></div>
                    </div>
                    <div className="text-left"><span className="text-2xl md:text-3xl font-black text-amber-400">{achievements.streak_days}</span><span className="text-gray-500 text-xs font-bold mr-1">يوم</span></div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'challenges' && (
          <motion.div key="challenges" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-10">
            {tabLoading.challenges ? <MiniLoader /> : (() => {
              const sections = [
                { key: 'khatma', label: 'التحديات القرآنية', desc: 'اختم وتدبر وتأمل في كتاب الله', icon: BookOpen, grad: EMERALD },
                { key: 'azkar', label: 'التحديات الذكرية', desc: 'أذكار وأوراد يومية تزيد إيمانك', icon: Sun, grad: ORANGE },
                { key: 'tasbeeh', label: 'التحديات التسبيحية', desc: 'تسبيح وتهليل واستغفار يثقل ميزانك', icon: Star, grad: BLUE },
              ];
              return (
                <>
                  {sections.map(section => {
                    const filtered = challenges.filter(c => c.category === section.key);
                    if (!filtered.length) return null;
                    const SectionIcon = section.icon;
                    return (
                      <div key={section.key} className="space-y-4">
                        <div className="flex items-center gap-3 px-1">
                          <div className={`w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br ${section.grad} rounded-2xl flex items-center justify-center shadow-xl shrink-0`}><SectionIcon size={20} className="text-white" /></div>
                          <div><h2 className="text-lg md:text-2xl font-black text-white">{section.label}</h2><p className="text-[9px] md:text-xs text-gray-500 font-bold">{section.desc}</p></div>
                          <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent mr-3"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                          {filtered.map((c, idx) => {
                            const cfg = categoryMeta[c.category] || categoryMeta.khatma;
                            const Icon = cfg.icon;
                            const activeUc = activeChallenges.find(uc => uc.challenge_id === c.id);
                            const isActive = !!activeUc;
                            const pct = activeUc ? progressPercent(activeUc) : 0;
                            const remaining = activeUc ? daysLeft(activeUc.start_date, c.days_duration) : 0;

                            return (
                              <motion.div key={c.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                className={`group relative glass-panel rounded-[1.5rem] md:rounded-[2rem] border overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-emerald-900/10 ${isActive ? 'border-emerald-500/40 shadow-lg shadow-emerald-900/20' : 'border-white/10 hover:border-emerald-500/30'}`}>
                                <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${cfg.grad} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`}></div>
                                <div className="p-4 md:p-6 flex flex-col h-full gap-3 md:gap-4 relative">
                                  <div className="flex items-start justify-between">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${cfg.grad} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><Icon size={20} className="text-white" /></div>
                                    <div className="flex items-center gap-1.5">
                                      {isActive && (
                                        <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                          <Activity size={8} /> نشط
                                        </span>
                                      )}
                                      <span className={`text-[7px] font-black px-2 py-0.5 rounded-full border ${c.category === 'khatma' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : c.category === 'azkar' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' : 'border-blue-500/20 text-blue-400 bg-blue-500/5'}`}>{cfg.label}</span>
                                      {c.category === 'khatma' && (
                                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-full border ${c.tier === 'major' ? 'border-purple-500/20 text-purple-400 bg-purple-500/10' : 'border-cyan-500/20 text-cyan-400 bg-cyan-500/10'}`}>
                                          {c.tier === 'major' ? 'كبير' : 'صغير'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-1.5 flex-1">
                                    <h3 className="text-sm md:text-lg font-black text-white leading-tight">{c.title}</h3>
                                    <p className="text-[9px] md:text-[11px] text-gray-400 font-bold leading-relaxed line-clamp-2">{c.description}</p>
                                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black text-gray-500 pt-1">
                                      <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg"><Clock size={10} /> {c.days_duration} يوم</span>
                                      <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg"><BookOpen size={10} /> {c.total_pages.toLocaleString()} هدف</span>
                                    </div>
                                  </div>

                                  {/* Progress bar for active challenges */}
                                  {isActive && activeUc && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[8px] md:text-[9px] font-bold">
                                        <span className="text-emerald-400">تقدم: {pct}%</span>
                                        <span className="text-gray-500">متبقي {remaining} يوم</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                                          className={`h-full rounded-full bg-gradient-to-l ${cfg.grad}`} />
                                      </div>
                                    </div>
                                  )}

                                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-emerald-400 font-black text-[10px] md:text-xs flex items-center gap-1"><Zap size={12} fill="currentColor" /> +{c.points_reward} نقطة</span>
                                    {isActive ? (
                                      <span className="text-emerald-400 text-[9px] md:text-[10px] font-black flex items-center gap-1"><CheckCircle size={12} /> مشترك</span>
                                    ) : (
                                      <button onClick={() => handleJoin(c.id)}
                                        className={`px-4 py-2 rounded-xl font-black text-[9px] md:text-[10px] bg-gradient-to-r ${cfg.grad} text-white transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-1`}>
                                        <Flag size={12} /> ابدأ
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div key="achievements" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4 md:space-y-6">
            {tabLoading.achievements ? <MiniLoader /> : achievements ? (
              <>
                <div className="relative glass-panel rounded-[2.5rem] md:rounded-[3rem] border border-emerald-500/10 overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-full blur-3xl"></div>
                  <div className="relative z-10 p-6 md:p-10">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                      <div className="relative">
                        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${LEVEL_COLORS[(achievements.level - 1) % LEVEL_COLORS.length]} flex items-center justify-center shadow-2xl`}>
                          <span className="text-3xl md:text-5xl font-black text-white">{achievements.level}</span>
                        </div>
                        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-amber-500 rounded-full p-1.5 md:p-2 shadow-lg shadow-amber-900/40"><Crown size={12} className="text-white" /></div>
                      </div>
                      <div className="flex-1 text-center md:text-right space-y-3 w-full">
                        <h2 className="text-xl md:text-3xl font-black text-white">المستوى {achievements.level}</h2>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs md:text-sm font-bold"><span className="text-gray-400">نقاط المستوى</span><span className="text-emerald-400">{achievements.total_points} / {achievements.nextLevelPoints}</span></div>
                          <div className="w-full h-2.5 md:h-3 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${((achievements.total_points % 500) / 500) * 100}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                              className={`h-full rounded-full bg-gradient-to-l ${LEVEL_COLORS[(achievements.level - 1) % LEVEL_COLORS.length]}`} />
                          </div>
                          <p className="text-[10px] md:text-xs text-gray-500 font-bold">{achievements.pointsToNextLevel} نقطة للمستوى التالي</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { label: 'النقاط', value: achievements.total_points, icon: Zap, grad: EMERALD },
                    { label: 'التحديات المنجزة', value: achievements.completedChallenges, icon: Trophy, grad: ORANGE },
                    { label: 'إجابات صحيحة', value: achievements.correctAnswers || 0, icon: Brain, grad: BLUE },
                    { label: 'سلسلة الأيام', value: achievements.streak_days, icon: Flame, grad: 'from-rose-500 to-red-500' },
                  ].map((stat, idx) => { const StatIcon = stat.icon; return (
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                      className="glass-panel rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/5 text-center group hover:border-emerald-500/20 transition-all">
                      <div className={`w-10 h-10 md:w-14 md:h-14 mx-auto mb-3 bg-gradient-to-br ${stat.grad} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><StatIcon size={18} className="text-white" /></div>
                      <p className="text-xl md:text-3xl font-black text-white">{stat.value}</p>
                      <p className="text-[9px] md:text-xs text-gray-400 font-bold mt-1">{stat.label}</p>
                    </motion.div>
                  );})}
                </div>
                <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/5">
                  <h3 className="text-base md:text-xl font-black text-white mb-4 flex items-center gap-2"><Medal size={18} className="text-amber-400" /> الشارات والأوسمة</h3>
                  {achievements.badges_array?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {achievements.badges_array.map((badge: string, idx: number) => (
                        <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl text-amber-400 text-[10px] md:text-xs font-black">
                          <Medal size={12} /> {badge}
                        </motion.div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 text-sm font-bold">لم تحصل على أي شارة بعد.</p>}
                </div>

                {/* التحديات المنجزة - سجل الإنجاز */}
                {achievements.completedList?.length > 0 && (
                  <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/5">
                    <h3 className="text-base md:text-xl font-black text-white mb-4 flex items-center gap-2"><Trophy size={18} className="text-emerald-400" /> سجل التحديات المنجزة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {achievements.completedList.map((uc: UserChallenge, idx: number) => {
                        const meta = categoryMeta[uc.challenge_details?.category || 'khatma'];
                        return (
                          <motion.div key={uc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                            <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br ${meta.grad} rounded-xl flex items-center justify-center shrink-0`}>
                              {React.createElement(meta.icon, { size: 16, className: 'text-white' })}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm font-black text-white truncate">{uc.challenge_details?.title || 'تحدي'}</p>
                              <p className="text-[8px] md:text-[9px] text-gray-500 font-bold">{meta.label}</p>
                            </div>
                            <BadgeCheck size={16} className="text-emerald-400 shrink-0" />
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : <MiniLoader />}
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div key="leaderboard" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            {tabLoading.leaderboard ? <MiniLoader /> : (
              <div className="glass-panel rounded-[2.5rem] md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="relative p-6 md:p-8 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-b border-white/5">
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"><div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div></div>
                  <div className="relative z-10 flex items-center gap-3 md:gap-4">
                    <div className="p-3 md:p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl shadow-amber-900/30"><Crown size={24} className="text-white" /></div>
                    <div><h2 className="text-xl md:text-3xl font-black text-white">لوحة المتصدرين</h2><p className="text-gray-400 text-[10px] md:text-sm font-bold">أفضل المتنافسين في الخيرات</p></div>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {leaderboard.map((player, idx) => (
                    <motion.div key={player.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                      className={`flex items-center justify-between p-4 md:p-6 hover:bg-white/5 transition-all group ${idx === 0 ? 'bg-gradient-to-l from-amber-500/5 to-transparent' : ''}`}>
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-xs md:text-sm ${idx === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg' : idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-black' : idx === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' : 'bg-white/5 text-gray-500'}`}>{idx + 1}</div>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-2 border-emerald-500/20 overflow-hidden bg-slate-800 shadow-lg">{player.avatar_url ? <img src={player.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-emerald-400"><User size={16} /></div>}</div>
                        <div><h4 className="font-black text-white text-xs md:text-base group-hover:text-emerald-400 transition-colors">{player.full_name || 'قارئ مجهول'}</h4>{idx === 0 && <span className="text-[7px] md:text-[8px] font-black text-amber-500 flex items-center gap-1"><Crown size={8} /> المتصدر</span>}</div>
                      </div>
                      <div className="text-left"><div className="text-emerald-400 font-black text-sm md:text-lg flex items-center justify-end gap-1"><Zap size={14} fill="currentColor" /> {player.total_points}</div><span className="text-[8px] md:text-[9px] text-gray-600 font-bold">نقطة</span></div>
                    </motion.div>
                  ))}
                  {leaderboard.length === 0 && <div className="text-center py-16"><Users size={40} className="mx-auto text-gray-600 mb-4" /><p className="text-gray-500 font-bold">لا يوجد متصدرين بعد</p></div>}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'weekly' && (
          <motion.div key="weekly" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-4 md:space-y-6">
            {tabLoading.weekly ? <MiniLoader /> : weeklyComp ? (
              <>
                <div className="relative glass-panel rounded-[2.5rem] md:rounded-[3rem] border border-purple-500/20 overflow-hidden shadow-2xl shadow-purple-900/10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl"></div>
                  <div className="relative z-10 p-6 md:p-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-6 md:mb-8">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-900/40"><Calendar size={32} className="text-white" /></div>
                      <div className="flex-1"><div className="flex items-center gap-2 text-purple-400 text-[10px] font-black mb-1"><Sparkles size={12} className="animate-pulse" /> مسابقة الأسبوع</div><h2 className="text-xl md:text-3xl font-black text-white">{weeklyComp.title}</h2><p className="text-gray-400 text-xs md:text-sm font-bold mt-1">{weeklyComp.description}</p></div>
                      <div className="text-center md:text-left"><div className="text-2xl md:text-3xl font-black text-purple-400 flex items-center gap-2"><Zap size={20} fill="currentColor" /> {weeklyComp.points_reward}</div><p className="text-[9px] md:text-xs text-gray-500 font-bold">نقطة جائزة</p></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 md:mb-8">
                      {[
                        { label: 'البداية', value: new Date(weeklyComp.start_date).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' }) },
                        { label: 'النهاية', value: new Date(weeklyComp.end_date).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' }) },
                        { label: 'المتبقي', value: (() => { const d = new Date(weeklyComp.end_date); const n = new Date(); const diff = Math.max(0, Math.ceil((d.getTime() - n.getTime()) / (1000 * 60 * 60 * 24))); return `${diff} أيام`; })() },
                        { label: 'الموضوع', value: weeklyComp.topic === 'quran' ? 'قرآني' : weeklyComp.topic === 'azkar' ? 'أذكار' : 'عام' },
                      ].map((item, idx) => (<div key={idx} className="bg-white/5 rounded-2xl p-3 md:p-4 text-center border border-white/5"><p className="text-[9px] md:text-xs text-gray-500 font-bold mb-1">{item.label}</p><p className="text-xs md:text-base font-black text-white">{item.value}</p></div>))}
                    </div>
                    <div className="bg-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/5">
                      {weeklyStats ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3"><div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg"><BadgeCheck size={20} className="text-white" /></div><div><p className="text-white font-black text-sm">أنت مشترك 🎉</p><p className="text-gray-400 text-[10px] font-bold">نقاطك: {weeklyStats.score || 0}</p></div></div>
                          <span className="text-emerald-400 text-xs font-black flex items-center gap-1"><TrendingUp size={14} /> نشط</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3"><div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg"><Flag size={20} className="text-white" /></div><div><p className="text-white font-black text-sm">لم تنضم بعد</p><p className="text-gray-400 text-[10px] font-bold">انضم الآن وابدأ المنافسة!</p></div></div>
                          <button onClick={handleJoinWeekly} disabled={joiningWeekly} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-2xl font-black text-xs md:text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/40 flex items-center gap-2">
                            {joiningWeekly ? <Loader2 className="animate-spin" size={16} /> : <><ArrowRight size={16} /> انضم</>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/5">
                  <h3 className="text-base md:text-xl font-black text-white mb-4 flex items-center gap-2"><Users size={18} className="text-purple-400" /> ترتيب المشاركين</h3>
                  {weeklyLeaderboard.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {weeklyLeaderboard.map((p: any, idx: number) => (
                        <div key={p.id} className="flex items-center justify-between py-3 md:py-4">
                          <div className="flex items-center gap-3"><span className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-black text-[10px] md:text-xs ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/5 text-gray-500'}`}>{idx + 1}</span>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-white/10 overflow-hidden bg-slate-800">{p.user?.avatar_url ? <img src={p.user.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={14} /></div>}</div>
                            <span className="text-white font-bold text-xs md:text-sm">{p.user?.name || 'مشارك'}</span></div>
                          <span className="text-purple-400 font-black text-xs md:text-sm">{p.score || 0} نقطة</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 text-sm font-bold text-center py-8">لا يوجد مشاركين بعد.</p>}
                </div>
              </>
            ) : (
              <div className="glass-panel rounded-[2.5rem] p-10 md:p-16 text-center border border-white/5">
                <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center"><Calendar size={40} className="text-gray-500" /></div>
                <p className="text-gray-500 font-bold text-lg">لا توجد مسابقة أسبوعية نشطة حالياً</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
