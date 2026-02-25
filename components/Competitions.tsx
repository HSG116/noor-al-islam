
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Target, Users, Zap, Calendar, Medal, Crown, ArrowRight, Flag, Loader2, Sparkles, User, LogIn, Sun, BookOpen } from 'lucide-react';
import { challengeService, Challenge } from '../services/challengeService';
import { supabase } from '../supabaseClient';

export const Competitions: React.FC<{ session: any }> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard'>('challenges');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const challs = await challengeService.getAvailableChallenges();
      setChallenges(challs || []);
      const players = await challengeService.getLeaderboard();
      setLeaderboard(players || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleJoin = async (challengeId: string) => {
    if (!session?.user) return alert('الرجاء تسجيل الدخول للمشاركة!');
    setJoiningId(challengeId);
    const { error } = await challengeService.joinChallenge(session.user.id, challengeId);
    if (error) alert('فشل الانضمام: ' + error.message);
    else alert('تم الانضمام بنجاح! توجه للمصحف للبدء.');
    setJoiningId(null);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 className="animate-spin text-emerald-500" size={48} />
      <p className="text-gray-400 font-bold">جاري تحميل التحديات...</p>
    </div>
  );

  if (!session?.user) {
    const handleGoogleLogin = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) alert('حدث خطأ أثناء تسجيل الدخول: ' + error.message);
    };

    return (
      <div className="w-full max-w-lg mx-auto px-4 py-20 text-center animate-in zoom-in duration-500">
        <div className="glass-panel p-8 md:p-12 rounded-[3.5rem] border border-emerald-500/20 shadow-[0_20px_60px_rgba(16,185,129,0.15)] flex flex-col items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>

          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full flex items-center justify-center text-emerald-400 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 mb-2 border border-emerald-500/20 shadow-inner">
            <User size={40} className="drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white drop-shadow-md">تسجيل الدخول</h2>
          <p className="text-gray-400 leading-relaxed text-sm md:text-base font-medium">
            عذراً يا صديقي، شارك في التحديات القرآنية وارفع اسمك في لوحة الشرف عبر تسجيل دخولك لتصلك الجوائز والمكافآت.
          </p>

          <button
            onClick={handleGoogleLogin}
            className="mt-6 flex items-center justify-center gap-4 w-full bg-white text-black py-4 px-6 rounded-2xl font-black text-sm hover:bg-emerald-50 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5 border border-white/20"
          >
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
    <div className="w-full max-w-5xl mx-auto px-4 pb-32 space-y-12">
      {/* Header */}
      <div className="text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest"
        >
          <Trophy size={14} className="animate-bounce" />
          <span>منظومة المسابقات الإسلامية</span>
        </motion.div>
        <h1 className="text-3xl md:text-5xl font-black text-white premium-text-gradient mt-4">سابقوا إلى <span className="text-emerald-500">مغفرة</span></h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-black/40 p-1 rounded-2xl border border-white/5 flex gap-2">
          <button onClick={() => setActiveTab('challenges')} className={`px-8 py-3 rounded-xl font-black text-xs md:text-sm transition-all ${activeTab === 'challenges' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>التحديات الكبرى</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`px-8 py-3 rounded-xl font-black text-xs md:text-sm transition-all ${activeTab === 'leaderboard' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>لوحة الشرف</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'challenges' ? (
          <motion.div
            key="challs"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {challenges.map((c, idx) => (
              <div key={c.id} className="glass-panel p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group hover:border-emerald-500/50 transition-all flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10 group-hover:bg-emerald-500/10 transition-colors"></div>
                <div className="flex flex-col h-full justify-between gap-6">
                  <div className="space-y-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner
                      ${c.category === 'azkar' ? 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500' :
                        c.category === 'tasbeeh' ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500' :
                          'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500'} group-hover:text-white`}>
                      {c.category === 'azkar' ? <Sun size={28} /> :
                        c.category === 'tasbeeh' ? <Target size={28} /> :
                          <BookOpen size={28} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border
                          ${c.category === 'azkar' ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' :
                            c.category === 'tasbeeh' ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' :
                              'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'}`}>
                          {c.category === 'azkar' ? 'تحدي أذكار' : c.category === 'tasbeeh' ? 'تحدي تسبيح' : 'تحدي ختمة'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white">{c.title}</h3>
                      <p className="text-xs text-gray-400 font-bold leading-relaxed">{c.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-gray-500">جائزة الإتمام</span>
                      <span className="text-emerald-400 flex items-center gap-1"><Zap size={14} fill="currentColor" /> {c.points_reward} نقطة</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (!session?.user) return alert('الرجاء تسجيل الدخول للمشاركة!');
                        setJoiningId(c.id);
                        const { error } = await challengeService.joinChallenge(session.user.id, c.id);
                        if (error) alert('فشل الانضمام: ' + error.message);
                        else {
                          const msg = c.category === 'azkar' ? 'تم الانضمام بنجاح! توجه للصفحة الرئيسية ثم الأذكار للبدء.' :
                            c.category === 'tasbeeh' ? 'تم الانضمام بنجاح! توجه لصفحة المسبحة للبدء.' :
                              'تم الانضمام بنجاح! توجه للمصحف للبدء.';
                          alert(msg);
                        }
                        setJoiningId(null);
                      }}
                      disabled={joiningId === c.id}
                      className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                      {joiningId === c.id ? <Loader2 className="animate-spin" /> : <><Flag size={18} /> ابدأ التحدي الآن</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="leader"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl"
          >
            <div className="p-8 bg-emerald-500/10 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/5 rounded-2xl text-emerald-400"><Medal size={24} /></div>
                <h2 className="text-2xl font-black text-white">ترتيب المتصدرين</h2>
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">Hall of Honor</span>
            </div>

            <div className="divide-y divide-white/5">
              {leaderboard.map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${idx === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/40' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-white/5 text-gray-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="w-12 h-12 rounded-2xl border-2 border-emerald-500/20 overflow-hidden bg-slate-800">
                      {player.avatar_url ? <img src={player.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-emerald-400"><User size={20} /></div>}
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm md:text-base group-hover:text-emerald-400 transition-colors">{player.full_name || 'قارئ مجهول'}</h4>
                      {idx === 0 && <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-1"><Crown size={10} /> القرّاء المتميزون</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-black text-sm md:text-lg flex items-center justify-end gap-1"><Zap size={16} fill="currentColor" /> {player.total_points}</div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">نقطة تم جمعها</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
