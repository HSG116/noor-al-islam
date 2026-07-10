
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';
import { getAllChats, deleteChat as deleteChatLog } from '../services/chatService';
import { Loader2, Users, Trophy, Target, Calendar, Brain, Activity, BookOpen, Zap, User, Mail, Shield, BadgeCheck, Medal, Flame, Crown, ChevronLeft, Download, Search, Layers, Sparkles, Sun, Plus, Edit3, Trash2, X, Save, AlertCircle, MessageSquare } from 'lucide-react';

interface AdminStats {
  totalUsers: number; totalPoints: number; totalChallenges: number; completedChallenges: number;
  totalQuizzes: number; totalAnswers: number; totalActivityLogs: number;
  totalWeeklyComps: number; totalWeeklyParticipants: number; avgStreak: number;
}

interface ModalState { show: boolean; type: 'quiz' | 'weekly' | 'challenge'; edit?: any; }

const emptyQuiz = { date: new Date().toISOString().split('T')[0], question_text: '', type: 'text', options_array: ['', '', '', ''], correct_answer_index: 0 };
const emptyWeekly = { title: '', description: '', topic: 'quran', start_date: '', end_date: '', points_reward: 500, is_active: true };
const emptyChallenge = { title: '', description: '', days_duration: 30, total_pages: 1, points_reward: 100, category: 'khatma' };

export const Admin: React.FC<{ email: string; onBack: () => void }> = ({ email, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [weeklyComps, setWeeklyComps] = useState<any[]>([]);
  const [weeklyParticipants, setWeeklyParticipants] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [expandedChat, setExpandedChat] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<ModalState>({ show: false, type: 'quiz' });
  const [form, setForm] = useState<any>(emptyQuiz);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const tabs = [
    { key: 'overview', label: 'نظرة عامة', icon: Layers },
    { key: 'users', label: 'المستخدمون', icon: Users },
    { key: 'challenges', label: 'التحديات', icon: Target },
    { key: 'weekly', label: 'مسابقات الأسبوع', icon: Calendar },
    { key: 'quizzes', label: 'الأسئلة اليومية', icon: Brain },
    { key: 'activity', label: 'سجل النشاطات', icon: Activity },
    { key: 'chats', label: 'الدردشات', icon: MessageSquare },
  ];

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersData, challengesData, userChalls, weeklyData, weeklyPart, quizzesData, answersData, logsData] = await Promise.all([
        supabase.from('users').select('*').order('total_points', { ascending: false }),
        supabase.from('challenges').select('*'),
        supabase.from('user_challenges').select('*, challenge:challenges(*)'),
        supabase.from('weekly_competitions').select('*').order('start_date', { ascending: false }),
        supabase.from('weekly_participants').select('*, user:users(name, email, avatar_url)'),
        supabase.from('daily_quizzes').select('*').order('date', { ascending: false }),
        supabase.from('quiz_answers').select('*, quiz:daily_quizzes(*)').order('answered_at', { ascending: false }),
        supabase.from('activity_logs').select('*, user:users(name, email)').order('created_at', { ascending: false }).limit(100),
      ]);
      setUsers(usersData.data || []);
      setChallenges(challengesData.data || []);
      setUserChallenges(userChalls.data || []);
      setWeeklyComps(weeklyData.data || []);
      setWeeklyParticipants(weeklyPart.data || []);
      setQuizzes(quizzesData.data || []);
      setQuizAnswers(answersData.data || []);
      setActivityLogs(logsData.data || []);
      const chatData = await getAllChats();
      setChatLogs(chatData);
      const u = usersData.data || [];
      setStats({
        totalUsers: u.length, totalPoints: u.reduce((s: number, x: any) => s + (x.total_points || 0), 0),
        totalChallenges: challengesData.data?.length || 0, completedChallenges: userChalls.data?.filter((x: any) => x.status === 'completed').length || 0,
        totalQuizzes: quizzesData.data?.length || 0, totalAnswers: answersData.data?.length || 0,
        totalActivityLogs: logsData.data?.length || 0, totalWeeklyComps: weeklyData.data?.length || 0,
        totalWeeklyParticipants: weeklyPart.data?.length || 0,
        avgStreak: u.length > 0 ? Math.round(u.reduce((s: number, x: any) => s + (x.streak_days || 0), 0) / u.length) : 0,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${filename}.csv`; a.click();
  };

  const openAdd = (type: 'quiz' | 'weekly' | 'challenge') => {
    if (type === 'quiz') setForm({ ...emptyQuiz, date: new Date().toISOString().split('T')[0] });
    else if (type === 'weekly') setForm({ ...emptyWeekly, start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] });
    else setForm({ ...emptyChallenge });
    setModal({ show: true, type });
  };

  const openEdit = (type: 'quiz' | 'weekly' | 'challenge', data: any) => {
    setForm({ ...data });
    setModal({ show: true, type, edit: data });
  };

  const closeModal = () => { setModal({ show: false, type: 'quiz' }); setConfirmDelete(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const table = modal.type === 'quiz' ? 'daily_quizzes' : modal.type === 'weekly' ? 'weekly_competitions' : 'challenges';
      if (modal.edit) {
        await supabase.from(table).update(form).eq('id', modal.edit.id);
      } else {
        await supabase.from(table).insert(form);
      }
      closeModal();
      await loadAll();
    } catch (e: any) { alert('خطأ: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (type: string, id: string) => {
    setConfirmDelete(null);
    try {
      const table = type === 'quiz' ? 'daily_quizzes' : type === 'weekly' ? 'weekly_competitions' : 'challenges';
      await supabase.from(table).delete().eq('id', id);
      await loadAll();
    } catch (e: any) { alert('خطأ: ' + e.message); }
  };

  const Modal = () => {
    if (!modal.show) return null;
    const isQuiz = modal.type === 'quiz';
    const isWeekly = modal.type === 'weekly';
    const title = modal.edit ? 'تعديل' : 'إضافة';
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel w-full max-w-lg rounded-[2rem] border border-white/10 p-6 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-white">{title} {isQuiz ? 'سؤال يومي' : isWeekly ? 'مسابقة أسبوعية' : 'تحدي'}</h2>
            <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"><X size={16} /></button>
          </div>
          <div className="space-y-4" dir="rtl">
            {isQuiz && (
              <>
                <div><label className="text-[10px] font-black text-gray-400 block mb-1">التاريخ</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                <div><label className="text-[10px] font-black text-gray-400 block mb-1">السؤال</label><textarea value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                {form.options_array?.map((opt: string, i: number) => (
                  <div key={i}><label className="text-[10px] font-black text-gray-400 block mb-1">الخيار {String.fromCharCode(65 + i)}</label>
                    <div className="flex gap-2"><input value={opt} onChange={e => { const o = [...form.options_array]; o[i] = e.target.value; setForm({ ...form, options_array: o }); }} className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" />
                      <button onClick={() => { const idx = form.correct_answer_index === i ? 0 : i; setForm({ ...form, correct_answer_index: idx }); }} className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${form.correct_answer_index === i ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 text-gray-400 border-white/10'}`}>صح</button>
                    </div></div>
                ))}
              </>
            )}
            {isWeekly && (
              <>
                <div><label className="text-[10px] font-black text-gray-400 block mb-1">العنوان</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                <div><label className="text-[10px] font-black text-gray-400 block mb-1">الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-black text-gray-400 block mb-1">تاريخ البداية</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                  <div><label className="text-[10px] font-black text-gray-400 block mb-1">تاريخ النهاية</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-black text-gray-400 block mb-1">الجائزة (نقاط)</label><input type="number" value={form.points_reward} onChange={e => setForm({ ...form, points_reward: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                  <div><label className="text-[10px] font-black text-gray-400 block mb-1">الموضوع</label>
                    <select value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40">
                      <option value="quran">قرآني</option><option value="azkar">أذكار</option><option value="tasbeeh">تسبيح</option><option value="general">عام</option>
                    </select></div>
                </div>
              </>
            )}
            {!isQuiz && !isWeekly && (
              <>
                <div><label className="text-[10px] font-black text-gray-400 block mb-1">العنوان</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                <div><label className="text-[10px] font-black text-gray-400 block mb-1">الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-[10px] font-black text-gray-400 block mb-1">المدة (أيام)</label><input type="number" value={form.days_duration} onChange={e => setForm({ ...form, days_duration: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                  <div><label className="text-[10px] font-black text-gray-400 block mb-1">الصفحات</label><input type="number" value={form.total_pages} onChange={e => setForm({ ...form, total_pages: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                  <div><label className="text-[10px] font-black text-gray-400 block mb-1">الجائزة</label><input type="number" value={form.points_reward} onChange={e => setForm({ ...form, points_reward: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40" /></div>
                </div>
                <div><label className="text-[10px] font-black text-gray-400 block mb-1">الفئة</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/40">
                    <option value="khatma">ختمة</option><option value="azkar">أذكار</option><option value="tasbeeh">تسبيح</option>
                  </select></div>
              </>
            )}
            <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-l from-emerald-500 to-teal-600 text-white py-3.5 rounded-2xl font-black text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {modal.edit ? 'حفظ التعديلات' : 'إضافة'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="relative"><Loader2 className="animate-spin text-emerald-500" size={48} /><div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" style={{ animationDuration: '3s' }}></div></div>
      <p className="text-gray-400 font-bold">جاري تحميل لوحة التحكم...</p>
    </div>
  );

  if (email !== 'cpshzt@gmail.com') return (
    <div className="w-full max-w-lg mx-auto px-4 py-20 text-center">
      <div className="glass-panel p-10 rounded-[2.5rem] border border-red-500/20"><Shield size={64} className="mx-auto text-red-400 mb-4" /><h2 className="text-2xl font-black text-white mb-2">غير مصرح</h2><p className="text-gray-400 text-sm font-bold">لوحة الإدارة متاحة فقط لحساب المشرف المخصص.</p></div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 md:px-4 pb-32 space-y-6">
      <AnimatePresence><Modal /></AnimatePresence>

      <div className="flex items-center justify-between pt-4 md:pt-6">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-500 flex items-center justify-center text-gray-400 hover:text-white transition-all"><ChevronLeft size={20} /></button>
        <div className="text-center flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black mb-2"><Shield size={10} /> لوحة الإدارة</div>
          <h1 className="text-2xl md:text-4xl font-black text-white premium-text-gradient">مرحباً بك يا <span className="text-emerald-400">مشرف</span></h1>
          <p className="text-gray-500 text-xs font-bold mt-1">إدارة كاملة لكل بيانات التطبيق</p>
        </div>
        <div className="w-10 h-10"></div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          {[
            { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'from-emerald-500 to-teal-600', detail: `${stats.totalPoints.toLocaleString()} نقطة` },
            { label: 'التحديات', value: stats.totalChallenges, icon: Target, color: 'from-blue-500 to-cyan-600', detail: `${stats.completedChallenges} مكتملة` },
            { label: 'المسابقات الأسبوعية', value: stats.totalWeeklyComps, icon: Calendar, color: 'from-purple-500 to-pink-600', detail: `${stats.totalWeeklyParticipants} مشارك` },
            { label: 'الأسئلة اليومية', value: stats.totalQuizzes, icon: Brain, color: 'from-amber-500 to-orange-600', detail: `${stats.totalAnswers} إجابة` },
            { label: 'معدل السلسلة', value: stats.avgStreak, icon: Flame, color: 'from-rose-500 to-red-600', detail: `${stats.totalActivityLogs} نشاط` },
          ].map((s, i) => { const Icon = s.icon; return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-2xl p-3 md:p-5 border border-white/5 text-center group hover:border-emerald-500/20 transition-all">
              <div className={`w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 bg-gradient-to-br ${s.color} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><Icon size={16} className="text-white" /></div>
              <p className="text-lg md:text-2xl font-black text-white">{s.value}</p>
              <p className="text-[8px] md:text-[10px] text-gray-400 font-black mt-0.5">{s.label}</p>
              <p className="text-[7px] md:text-[9px] text-gray-600 font-bold">{s.detail}</p>
            </motion.div>
          );})}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map(tab => { const Icon = tab.icon; const isActive = activeTab === tab.key; return (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl font-black text-[10px] md:text-xs whitespace-nowrap transition-all shrink-0 ${isActive ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'}`}>
            <Icon size={12} /> {tab.label}
          </button>
        );})}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Users size={16} className="text-emerald-400" /> المستخدمون</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">إجمالي المستخدمين</span><span className="text-white font-black">{stats?.totalUsers}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">إجمالي النقاط</span><span className="text-emerald-400 font-black">{stats?.totalPoints.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">متوسط النقاط</span><span className="text-white font-black">{stats ? Math.round(stats.totalPoints / (stats.totalUsers || 1)) : 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">متوسط السلسلة</span><span className="text-amber-400 font-black">{stats?.avgStreak} يوم</span></div>
              </div>
            </div>
            <div className="glass-panel rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Target size={16} className="text-blue-400" /> التحديات</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">إجمالي التحديات</span><span className="text-white font-black">{stats?.totalChallenges}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">مشترك فيها</span><span className="text-white font-black">{userChallenges.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">مكتملة</span><span className="text-emerald-400 font-black">{stats?.completedChallenges}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">نسبة الإكمال</span><span className="text-amber-400 font-black">{userChallenges.length ? Math.round((stats?.completedChallenges || 0) / userChallenges.length * 100) : 0}%</span></div>
              </div>
            </div>
            <div className="glass-panel rounded-[2rem] p-6 border border-white/5">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Brain size={16} className="text-purple-400" /> الأسئلة والنشاطات</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">الأسئلة اليومية</span><span className="text-white font-black">{stats?.totalQuizzes}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">الإجابات</span><span className="text-white font-black">{stats?.totalAnswers}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">سجل النشاطات</span><span className="text-white font-black">{stats?.totalActivityLogs}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">مسابقات أسبوعية</span><span className="text-white font-black">{stats?.totalWeeklyComps}</span></div>
              </div>
            </div>
          </div>
          <div className="glass-panel rounded-[2rem] p-6 border border-white/5">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Crown size={16} className="text-amber-400" /> أفضل 5 متصدرين</h3>
            <div className="divide-y divide-white/5">
              {users.slice(0, 5).map((u, i) => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-white/5 text-gray-500'}`}>{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-white/10">{u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={14} /></div>}</div>
                    <div><p className="text-white font-bold text-xs">{u.name || 'مستخدم'}</p><p className="text-gray-600 text-[9px]">{u.email || ''}</p></div>
                  </div>
                  <span className="text-emerald-400 font-black text-xs">{u.total_points || 0} <span className="text-gray-600 text-[9px]">نقطة</span></span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث عن مستخدم..." className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-9 pl-3 text-xs text-white placeholder-gray-600 font-bold outline-none focus:border-emerald-500/40 transition-all" />
            </div>
            <button onClick={() => exportCSV(users, 'users')} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl text-gray-400 hover:text-white text-[10px] font-black border border-white/5 transition-all"><Download size={12} /> تصدير</button>
          </div>
          <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead><tr className="border-b border-white/5 text-[10px] md:text-xs text-gray-400 font-black"><th className="p-3 md:p-4">#</th><th className="p-3 md:p-4">المستخدم</th><th className="p-3 md:p-4">البريد</th><th className="p-3 md:p-4">النقاط</th><th className="p-3 md:p-4">السلسلة</th><th className="p-3 md:p-4">الشارات</th><th className="p-3 md:p-4">آخر دخول</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {users.filter(u => !searchTerm || u.name?.includes(searchTerm) || u.email?.includes(searchTerm)).map((u, i) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-all text-[10px] md:text-xs">
                      <td className="p-3 md:p-4 text-gray-500 font-bold">{i + 1}</td>
                      <td className="p-3 md:p-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-800 border border-white/10 shrink-0">{u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><User size={12} /></div>}</div><span className="text-white font-bold">{u.name || '—'}</span></div></td>
                      <td className="p-3 md:p-4 text-gray-400">{u.email || '—'}</td>
                      <td className="p-3 md:p-4"><span className="text-emerald-400 font-black">{u.total_points || 0}</span></td>
                      <td className="p-3 md:p-4"><span className="text-amber-400 font-black flex items-center gap-1"><Flame size={10} /> {u.streak_days || 0}</span></td>
                      <td className="p-3 md:p-4"><span className="text-gray-400">{(u.badges_array || []).length}</span></td>
                      <td className="p-3 md:p-4 text-gray-500">{u.last_login ? new Date(u.last_login).toLocaleDateString('ar-SA') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Challenges */}
      {activeTab === 'challenges' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => openAdd('challenge')} className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-l from-emerald-500 to-teal-600 rounded-xl text-white text-[10px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={14} /> إضافة تحدي</button>
            <button onClick={() => exportCSV(challenges, 'challenges')} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl text-gray-400 hover:text-white text-[10px] font-black border border-white/5 transition-all"><Download size={12} /> تصدير</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map(c => (
              <div key={c.id} className="glass-panel rounded-[1.5rem] p-5 border border-white/5 hover:border-emerald-500/20 transition-all relative group">
                <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit('challenge', c)} className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"><Edit3 size={12} /></button>
                  <button onClick={() => setConfirmDelete(c.id)} className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"><Trash2 size={12} /></button>
                </div>
                {confirmDelete === c.id && (
                  <div className="absolute inset-0 bg-black/80 rounded-[1.5rem] flex items-center justify-center z-10">
                    <div className="text-center"><p className="text-white text-xs font-bold mb-3">تأكيد الحذف؟</p><div className="flex gap-2"><button onClick={() => handleDelete('challenge', c.id)} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black">نعم</button><button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl text-[10px] font-black">إلغاء</button></div></div>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.category === 'khatma' ? 'bg-emerald-500/10 text-emerald-400' : c.category === 'azkar' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {c.category === 'khatma' ? <BookOpen size={18} /> : c.category === 'azkar' ? <Sun size={18} /> : <Target size={18} />}
                  </div>
                  <div><h4 className="text-white font-black text-xs">{c.title}</h4><p className="text-gray-500 text-[9px]">{c.category}</p></div>
                </div>
                <div className="space-y-1 text-[10px] text-gray-400 font-bold"><p>الوصف: {c.description}</p><p>المدة: {c.days_duration} يوم | الصفحات: {c.total_pages} | الجائزة: {c.points_reward} نقطة</p></div>
              </div>
            ))}
          </div>
          <div className="glass-panel rounded-[2rem] p-5 md:p-6 border border-white/5">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2"><Users size={16} className="text-blue-400" /> مشاركات المستخدمين ({userChallenges.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-[10px] md:text-xs">
                <thead><tr className="border-b border-white/5 text-gray-400 font-black"><th className="p-2 md:p-3">المستخدم</th><th className="p-2 md:p-3">التحدي</th><th className="p-2 md:p-3">الحالة</th><th className="p-2 md:p-3">التقدم</th><th className="p-2 md:p-3">تاريخ البداية</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {userChallenges.slice(0, 50).map(uc => (
                    <tr key={uc.id} className="hover:bg-white/5">
                      <td className="p-2 md:p-3 text-gray-400">{uc.user_id?.slice(0, 8)}...</td>
                      <td className="p-2 md:p-3 text-white font-bold">{uc.challenge?.title || '—'}</td>
                      <td className="p-2 md:p-3"><span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${uc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : uc.status === 'active' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>{uc.status === 'completed' ? 'مكتمل' : uc.status === 'active' ? 'نشط' : uc.status}</span></td>
                      <td className="p-2 md:p-3 text-gray-400">{uc.pages_completed || 0} / {uc.challenge?.total_pages || '?'}</td>
                      <td className="p-2 md:p-3 text-gray-500">{uc.start_date ? new Date(uc.start_date).toLocaleDateString('ar-SA') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly */}
      {activeTab === 'weekly' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <button onClick={() => openAdd('weekly')} className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-l from-purple-500 to-pink-600 rounded-xl text-white text-[10px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={14} /> إضافة مسابقة</button>
          {weeklyComps.map(w => (
            <div key={w.id} className="glass-panel rounded-[2rem] p-5 md:p-6 border border-purple-500/10 relative group">
              <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => openEdit('weekly', w)} className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"><Edit3 size={12} /></button>
                <button onClick={() => setConfirmDelete(w.id)} className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"><Trash2 size={12} /></button>
              </div>
              {confirmDelete === w.id && (
                <div className="absolute inset-0 bg-black/80 rounded-[2rem] flex items-center justify-center z-20">
                  <div className="text-center"><p className="text-white text-xs font-bold mb-3">تأكيد الحذف؟</p><div className="flex gap-2"><button onClick={() => handleDelete('weekly', w.id)} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black">نعم</button><button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl text-[10px] font-black">إلغاء</button></div></div>
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg"><Calendar size={18} className="text-white" /></div>
                  <div><h4 className="text-white font-black text-sm">{w.title}</h4><p className="text-gray-400 text-[10px] font-bold">{w.description}</p></div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${w.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>{w.is_active ? 'نشط' : 'منتهي'}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] md:text-xs mb-4">
                <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-gray-500 font-bold">البداية</p><p className="text-white font-black">{new Date(w.start_date).toLocaleDateString('ar-SA')}</p></div>
                <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-gray-500 font-bold">النهاية</p><p className="text-white font-black">{new Date(w.end_date).toLocaleDateString('ar-SA')}</p></div>
                <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-gray-500 font-bold">الجائزة</p><p className="text-emerald-400 font-black">{w.points_reward} نقطة</p></div>
                <div className="bg-white/5 rounded-xl p-3 text-center"><p className="text-gray-500 font-bold">الموضوع</p><p className="text-white font-black">{w.topic}</p></div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <h5 className="text-[10px] font-black text-gray-400 mb-2 flex items-center gap-1"><Users size={10} /> المشاركات ({weeklyParticipants.filter(p => p.competition_id === w.id).length})</h5>
                <div className="space-y-1.5">
                  {weeklyParticipants.filter(p => p.competition_id === w.id).slice(0, 10).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2"><div className="w-5 h-5 rounded overflow-hidden bg-slate-800">{p.user?.avatar_url ? <img src={p.user.avatar_url} className="w-full h-full object-cover" /> : <User size={10} className="m-auto text-gray-500" />}</div><span className="text-gray-300 font-bold">{p.user?.name || 'مشارك'}</span></div>
                      <span className="text-purple-400 font-black">{p.score || 0} نقطة</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Quizzes */}
      {activeTab === 'quizzes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => openAdd('quiz')} className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-l from-amber-500 to-orange-600 rounded-xl text-white text-[10px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all"><Plus size={14} /> إضافة سؤال</button>
            <button onClick={() => exportCSV(quizzes, 'daily_quizzes')} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl text-gray-400 hover:text-white text-[10px] font-black border border-white/5 transition-all"><Download size={12} /> تصدير</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {quizzes.map(q => (
              <div key={q.id} className="glass-panel rounded-[1.5rem] p-4 md:p-5 border border-white/5 relative group">
                <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => openEdit('quiz', q)} className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"><Edit3 size={12} /></button>
                  <button onClick={() => setConfirmDelete(q.id)} className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"><Trash2 size={12} /></button>
                </div>
                {confirmDelete === q.id && (
                  <div className="absolute inset-0 bg-black/80 rounded-[1.5rem] flex items-center justify-center z-20">
                    <div className="text-center"><p className="text-white text-xs font-bold mb-3">تأكيد الحذف؟</p><div className="flex gap-2"><button onClick={() => handleDelete('quiz', q.id)} className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black">نعم</button><button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl text-[10px] font-black">إلغاء</button></div></div>
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2"><Brain size={14} className="text-purple-400" /><span className="text-[10px] text-gray-500 font-bold">{new Date(q.date).toLocaleDateString('ar-SA')}</span></div>
                </div>
                <p className="text-xs md:text-sm text-white font-bold mb-2">{q.question_text}</p>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {q.options_array?.map((opt: string, idx: number) => (
                    <div key={idx} className={`text-[9px] md:text-[10px] px-2.5 py-1.5 rounded-lg font-bold ${idx === q.correct_answer_index ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-400 border border-white/5'}`}>{String.fromCharCode(65 + idx)}. {opt}</div>
                  ))}
                </div>
                {(() => {
                  const ans = quizAnswers.filter(a => a.quiz_id === q.id);
                  if (!ans.length) return null;
                  const correct = ans.filter(a => a.is_correct).length;
                  return (<div className="border-t border-white/5 mt-2 pt-2 flex gap-3 text-[9px] text-gray-500 font-bold"><span>الإجابات: {ans.length}</span><span className="text-emerald-400">صحيحة: {correct}</span><span className="text-red-400">خاطئة: {ans.length - correct}</span><span className="text-amber-400">نسبة: {Math.round(correct / ans.length * 100)}%</span></div>);
                })()}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Activity */}
      {activeTab === 'activity' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <button onClick={() => exportCSV(activityLogs, 'activity_logs')} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl text-gray-400 hover:text-white text-[10px] font-black border border-white/5 transition-all"><Download size={12} /> تصدير</button>
          <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {activityLogs.map((log, i) => (
                <div key={log.id || i} className="flex items-center justify-between p-3 md:p-4 hover:bg-white/5 transition-all text-[10px] md:text-xs">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`w-2 h-2 rounded-full ${log.activity_type === 'azkar' ? 'bg-amber-500' : log.activity_type === 'tasbeeh' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                    <div><span className="text-white font-bold">{log.activity_type} {log.activity_subtype ? `(${log.activity_subtype})` : ''}</span><span className="text-gray-500 mr-2">{log.user?.name || log.user_id?.slice(0, 8)}</span></div>
                  </div>
                  <div className="text-gray-500"><span className="ml-3">{log.amount}</span>{new Date(log.created_at).toLocaleDateString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
              {activityLogs.length === 0 && <p className="text-center py-10 text-gray-500 font-bold">لا توجد نشاطات</p>}
            </div>
          </div>
        </motion.div>
      )}

      {/* Chats */}
      {activeTab === 'chats' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500 font-bold">{chatLogs.length} محادثة</p>
            <button onClick={() => exportCSV(chatLogs.map(c => ({ id: c.id, email: c.email, name: c.name, user_id: c.user_id, messages_count: (c.messages || []).length, created_at: c.created_at, updated_at: c.updated_at })), 'chat_logs')} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl text-gray-400 hover:text-white text-[10px] font-black border border-white/5 transition-all"><Download size={12} /> تصدير</button>
          </div>

          {/* Expanded chat viewer */}
          <AnimatePresence>
            {expandedChat && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel rounded-[2rem] p-4 md:p-6 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setExpandedChat(null)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl text-gray-400 hover:text-white text-[10px] font-black transition-all"><ChevronLeft size={14} /> رجوع</button>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <MessageSquare size={14} className="text-emerald-400" />
                    {expandedChat.name || expandedChat.email || 'محادثة'}
                  </h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar p-2">
                  {(expandedChat.messages || []).map((msg: any, i: number) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-start flex-row-reverse' : ''}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] md:text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-500/20 text-emerald-300 rounded-bl-lg'
                          : 'bg-white/5 text-gray-300 border border-white/5 rounded-br-lg'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[8px] font-black ${msg.role === 'user' ? 'text-emerald-400' : 'text-gray-500'}`}>
                            {msg.role === 'user' ? 'مستخدم' : 'المستشار'}
                          </span>
                        </div>
                        <div dir="auto">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {(expandedChat.messages || []).length === 0 && <p className="text-center text-gray-500 py-10 text-xs font-bold">محادثة فارغة</p>}
                </div>
                <div className="mt-3 text-[9px] text-gray-600 flex items-center gap-3">
                  <span>{new Date(expandedChat.created_at).toLocaleDateString('ar-SA')}</span>
                  <span>•</span>
                  <span>{(expandedChat.messages || []).length} رسالة</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat list */}
          {!expandedChat && (
            <div className="space-y-2">
              {chatLogs.map((chat) => {
                const msgs: any[] = chat.messages || [];
                const lastUserMsg = msgs.filter(m => m.role === 'user').pop();
                const date = new Date(chat.updated_at || chat.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                return (
                  <motion.button
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setExpandedChat(chat)}
                    className="w-full text-right glass-panel p-4 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/10">
                        <MessageSquare size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
                            <User size={10} />
                          </div>
                          <span className="text-white font-bold text-xs truncate">{chat.name || chat.email || 'زائر'}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">{lastUserMsg?.content || 'بداية محادثة'}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[8px] text-gray-600">
                          <span>{date}</span>
                          <span>•</span>
                          <span>{msgs.filter(m => m.role === 'user').length} سؤال</span>
                          <span>•</span>
                          <span>{chat.email || '—'}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black text-center ${chat.user_id ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                          {chat.user_id ? 'مسجل' : 'زائر'}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
              {chatLogs.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">لا توجد محادثات</p>
                  <p className="text-[10px] mt-1">المحادثات ستظهر هنا عند استخدام المستخدمين للمستشار الإسلامي</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
