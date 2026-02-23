
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  ChevronLeft, 
  Sparkles, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  Medal, 
  Crown,
  User as UserIcon,
  LogIn,
  LogOut,
  Loader2,
  PlusCircle,
  BookOpen,
  Disc,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { 
  getUserProfile,
  getDailyQuiz, 
  submitQuizAnswer, 
  subscribeToLeaderboard,
  submitUserQuiz,
  startChallenge,
  CompetitionUser,
  Quiz
} from '../services/competitionService';

export const Competitions: React.FC<{ 
  onBack: () => void, 
  user: User | null, 
  profile: CompetitionUser | null,
  onProfileUpdate: (p: CompetitionUser) => void
}> = ({ onBack, user, profile, onProfileUpdate }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'quiz' | 'leaderboard' | 'add-quiz' | 'challenges'>('quiz');
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (user) {
      // Fetch quiz and leaderboard only once when user is confirmed
      getDailyQuiz().then(q => {
        setQuiz(q);
      }).catch(err => console.error("Error fetching quiz:", err));

      const unsubLeaderboard = subscribeToLeaderboard((data) => {
        setLeaderboard(data);
      });

      return () => unsubLeaderboard();
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeSubView === 'quiz' && quiz && !isAnswered && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [activeSubView, quiz, isAnswered, timeLeft]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Login failed", err);
      setAuthError(`خطأ في تسجيل الدخول: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Add Quiz State
  const [newQuiz, setNewQuiz] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correctIndex: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [subMessage, setSubMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddQuiz = async () => {
    if (!user || !profile) return;
    if (!newQuiz.question_text || newQuiz.options.some(o => !o)) {
      setSubMessage({ type: 'error', text: 'يرجى ملء جميع الحقول' });
      return;
    }

    setSubmitting(true);
    setSubMessage(null);
    try {
      await submitUserQuiz(user.id, profile.name, {
        date: new Date().toISOString().split('T')[0],
        question_text: newQuiz.question_text,
        type: 'text',
        options_array: newQuiz.options,
        correct_answer_index: newQuiz.correctIndex
      });
      setSubMessage({ type: 'success', text: 'تمت إضافة الفزورة بنجاح! شكراً لمساهمتك.' });
      setNewQuiz({ question_text: '', options: ['', '', '', ''], correctIndex: 0 });
    } catch (err: any) {
      setSubMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (index: number) => {
    if (isAnswered || !user || !quiz) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    const isCorrect = index === quiz.correct_answer_index;
    const points = isCorrect ? Math.max(10, timeLeft * 5) : 0;
    
    if (isCorrect) setScore(points);
    await submitQuizAnswer(user.id, points, isCorrect);
    
    // Refresh profile
    try {
      const p = await getUserProfile(user.id);
      onProfileUpdate(p);
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
    </div>
  );

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center space-y-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full animate-pulse"></div>
          <Trophy size={100} className="relative text-emerald-400 animate-float" />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-white premium-text-gradient">مسابقات رمضان التفاعلية</h2>
          <p className="text-gray-400 text-lg">سجل دخولك للمشاركة في فوازير رمضان اليومية، جمع النقاط، وتصدر لوحة الشرف!</p>
          
          {authError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold"
            >
              {authError}
            </motion.div>
          )}
        </div>
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-emerald-900/40 active:scale-95 mx-auto"
        >
          <LogIn size={24} />
          تسجيل الدخول بجوجل
        </button>
        <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors font-bold">العودة للرئيسية</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-32 space-y-8">
      {/* Header */}
      <div className="glass-panel p-4 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onBack} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-emerald-600 transition-all">
            <ChevronLeft size={20} className="rotate-180" />
          </button>
          <div className="text-right">
            <h2 className="text-2xl font-black text-white premium-text-gradient">مسابقات رمضان</h2>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={12} />
              <span>أهلاً بك، {profile?.name}</span>
            </div>
          </div>
        </div>

        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'quiz', label: 'فزورة اليوم' },
            { id: 'challenges', label: 'التحديات' },
            { id: 'leaderboard', label: 'لوحة الشرف' },
            { id: 'add-quiz', label: 'أضف فزورة' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubView(tab.id as any)}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-[10px] md:text-xs transition-all whitespace-nowrap ${activeSubView === tab.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button onClick={handleLogout} className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
          <LogOut size={20} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubView === 'quiz' ? (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Quiz Content */}
            <div className="lg:col-span-2 space-y-6">
              {quiz ? (
                <div className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white/10 shadow-2xl space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -z-10"></div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/40 border border-white/5 text-emerald-400">
                      <Timer size={20} className={timeLeft < 10 ? 'animate-pulse text-red-500' : ''} />
                      <span className={`text-xl font-black ${timeLeft < 10 ? 'text-red-500' : ''}`}>{timeLeft} ثانية</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">سؤال اليوم</span>
                      <p className="text-gray-400 text-xs font-bold">{new Date().toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-black text-white text-right leading-tight">
                    {quiz.question_text}
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {quiz.options_array.map((option, idx) => (
                      <button
                        key={idx}
                        disabled={isAnswered || timeLeft === 0}
                        onClick={() => handleAnswer(idx)}
                        className={`
                          group p-6 rounded-[2rem] border text-right transition-all duration-300 flex items-center justify-between gap-4
                          ${isAnswered 
                            ? idx === quiz.correct_answer_index 
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                              : idx === selectedOption 
                                ? 'bg-red-500/20 border-red-500 text-red-400' 
                                : 'bg-white/5 border-white/5 opacity-50'
                            : 'bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-white/10'
                          }
                        `}
                      >
                        <div className="flex-1 text-lg font-bold">{option}</div>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isAnswered && idx === quiz.correct_answer_index ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'}`}>
                          {isAnswered && idx === quiz.correct_answer_index ? <CheckCircle2 size={16} /> : <span className="text-xs">{idx + 1}</span>}
                        </div>
                      </button>
                    ))}
                  </div>

                  {isAnswered && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-6 rounded-[2rem] border text-center space-y-2 ${selectedOption === quiz.correct_answer_index ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                    >
                      {selectedOption === quiz.correct_answer_index ? (
                        <>
                          <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-xl">
                            <Sparkles />
                            <span>إجابة صحيحة!</span>
                          </div>
                          <p className="text-emerald-500/70 font-bold">لقد حصلت على {score} نقطة سرعة</p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-center gap-2 text-red-400 font-black text-xl">
                            <XCircle />
                            <span>للأسف، إجابة خاطئة</span>
                          </div>
                          <p className="text-red-500/70 font-bold">حاول مرة أخرى في فزورة الغد!</p>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="glass-panel p-12 rounded-[3rem] border border-white/10 text-center space-y-4">
                  <Construction size={64} className="mx-auto text-amber-500 opacity-50" />
                  <h3 className="text-2xl font-black text-white">لا توجد فزورة متاحة اليوم</h3>
                  <p className="text-gray-400">يرجى العودة لاحقاً للمشاركة في مسابقاتنا.</p>
                </div>
              )}
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6">
                <h4 className="text-xl font-black text-white text-right border-b border-white/5 pb-4">إحصائياتك</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><Trophy size={20} /></div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-500 uppercase">مجموع النقاط</p>
                      <p className="text-xl font-black text-white">{profile?.total_points}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400"><Medal size={20} /></div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-500 uppercase">سلسلة الانتصارات</p>
                      <p className="text-xl font-black text-white">{profile?.streak_days} أيام</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-4">
                <h4 className="text-xl font-black text-white text-right border-b border-white/5 pb-4">شاراتك</h4>
                {profile?.badges_array.length === 0 ? (
                  <p className="text-center text-gray-500 text-xs font-bold py-4">لم تحصل على شارات بعد</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {profile?.badges_array.map((badge, i) => (
                      <div key={i} className="aspect-square bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Sparkles size={24} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : activeSubView === 'leaderboard' ? (
          <motion.div 
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-panel p-6 md:p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400 shadow-inner"><Crown size={24} /></div>
                <h3 className="text-2xl font-black text-white">لوحة الشرف</h3>
              </div>
              <p className="text-gray-500 text-xs font-bold">أفضل 50 متسابقاً</p>
            </div>

            <div className="space-y-3">
              {leaderboard.map((entry, idx) => (
                <div 
                  key={entry.uid}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${entry.uid === user.uid ? 'bg-emerald-600/20 border-emerald-500 shadow-lg' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-black/40 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={entry.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.uid}`} alt={entry.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-black text-white text-base">{entry.name}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{entry.streak_days} أيام متتالية</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-black text-emerald-400">{entry.total_points}</p>
                    <p className="text-[10px] text-gray-500 font-black uppercase">نقطة</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : activeSubView === 'add-quiz' ? (
          <motion.div 
            key="add-quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 md:p-12 rounded-[3rem] border border-white/10 shadow-2xl space-y-8"
          >
            <div className="text-right space-y-2">
              <h3 className="text-2xl font-black text-white">أضف فزورة رمضانية</h3>
              <p className="text-gray-400 text-sm font-bold">ساهم في إثراء المسابقات بفوازيرك الخاصة (مرة كل يومين)</p>
            </div>

            {subMessage && (
              <div className={`p-4 rounded-2xl border ${subMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} text-center font-bold`}>
                {subMessage.text}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-right text-xs font-black text-emerald-500 uppercase tracking-widest">نص السؤال</label>
                <textarea 
                  value={newQuiz.question_text}
                  onChange={(e) => setNewQuiz({...newQuiz, question_text: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-right outline-none focus:ring-2 focus:ring-emerald-500/20 h-24"
                  placeholder="مثال: من هو الصحابي الذي لقب بذي النورين؟"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newQuiz.options.map((opt, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="block text-right text-[10px] font-black text-gray-500">الخيار {idx + 1}</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newQuiz.options];
                          updated[idx] = e.target.value;
                          setNewQuiz({...newQuiz, options: updated});
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-4 pl-12 text-white text-right outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button 
                        onClick={() => setNewQuiz({...newQuiz, correctIndex: idx})}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${newQuiz.correctIndex === idx ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-600'}`}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleAddQuiz}
                disabled={submitting}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'نشر الفزورة'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="challenges"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 text-right">
              <div className="p-4 bg-emerald-500/10 rounded-3xl w-fit ml-auto text-emerald-400"><BookOpen size={32} /></div>
              <h3 className="text-2xl font-black text-white">تحدي ختم الأجزاء</h3>
              <p className="text-gray-400 text-sm font-bold leading-relaxed">اختر الجزء الذي تريد ختمه اليوم، وسنقوم بنقلك مباشرة للمصحف. عند الانتهاء ستحصل على 100 نقطة وشارة مميزة!</p>
              <div className="grid grid-cols-5 gap-2">
                {[...Array(30)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      // Logic to navigate to Quran Part i+1
                      alert(`سيتم نقلك للجزء ${i+1} في المصحف. عند الانتهاء اضغط على "إنهاء المهمة" هناك.`);
                      onBack(); // Go back to home to navigate
                    }}
                    className="aspect-square rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xs font-black hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 text-right">
              <div className="p-4 bg-amber-500/10 rounded-3xl w-fit ml-auto text-amber-400"><Disc size={32} /></div>
              <h3 className="text-2xl font-black text-white">تحدي التسبيح</h3>
              <p className="text-gray-400 text-sm font-bold leading-relaxed">أكمل 1000 تسبيحة اليوم لتحصل على لقب "بطل التسبيح" و100 نقطة إضافية في رصيدك.</p>
              <button 
                onClick={() => alert('سيتم نقلك للمسبحة الآن..')}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl"
              >
                ابدأ التسبيح الآن
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Construction = ({ size, className }: { size: number, className: string }) => (
  <div className={className}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="8" rx="1" />
      <path d="M17 14v7" />
      <path d="M7 14v7" />
      <path d="M17 3v3" />
      <path d="M7 3v3" />
      <path d="M10 14 2.3 6.3" />
      <path d="m14 14 7.7-7.7" />
      <path d="m8 6 8 8" />
    </svg>
  </div>
);
