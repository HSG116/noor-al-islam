import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';
import { syncService, UserSyncData } from '../services/syncService';
import { Session } from '@supabase/supabase-js';
import { User, Mail, MapPin, BookOpen, Sparkles, Radio, Target, LogOut, Calendar, Clock, Star, Shield, ChevronLeft, Loader2, Check, Award, BookmarkCheck, Edit2, X } from 'lucide-react';

interface ProfileProps {
  session: Session;
  onBack: () => void;
  onLogout: () => void;
  onGoToAdmin?: () => void;
}

const LOGO_URL = "./logo.webp";

const ADMIN_EMAIL = 'cpshzt@gmail.com';

const Profile: React.FC<ProfileProps> = ({ session, onBack, onLogout, onGoToAdmin }) => {
  const [syncData, setSyncData] = useState<UserSyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');
  const [profileData, setProfileData] = useState<{ full_name?: string; country?: string; city?: string; avatar_url?: string } | null>(null);

  const user = session.user;
  const meta = user.user_metadata;

  useEffect(() => {
    loadData();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('full_name, country, city, avatar_url').eq('id', user.id).single();
    if (data) setProfileData(data);
  };

  const avatarSrc = profileData?.avatar_url || meta?.avatar_url || meta?.picture || '';

  const loadData = async () => {
    setLoading(true);
    const data = await syncService.loadFromServer(user.id);
    if (data) {
      setSyncData(data);
    } else {
      syncService.pushLocalToServer(user.id);
      const reload = await syncService.loadFromServer(user.id);
      setSyncData(reload);
    }
    setLoading(false);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncStatus('syncing');
    syncService.pushLocalToServer(user.id);
    const data = await syncService.loadFromServer(user.id);
    if (data) setSyncData(data);
    setSyncStatus('done');
    setTimeout(() => setSyncStatus('idle'), 2000);
    setSyncing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const displayName = profileData?.full_name || meta?.full_name || user.email?.split('@')[0] || 'مستخدم';
  const displayCountry = profileData?.country || meta?.country || '';
  const displayCity = profileData?.city || meta?.city || '';

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };

  const statCards = [
    {
      icon: BookOpen,
      label: 'آخر قراءة',
      value: syncData?.quran_last_surah ? `${syncData.quran_last_surah} - صفحة ${syncData.quran_last_page}` : 'لم يبدأ بعد',
      color: 'from-teal-500 to-emerald-600', bg: 'bg-teal-500/10',
    },
    {
      icon: BookmarkCheck,
      label: 'العلامات المحفوظة',
      value: syncData?.quran_bookmarks ? `${Object.keys(syncData.quran_bookmarks).length} علامة` : '0 علامة',
      color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10',
    },
    {
      icon: Sparkles,
      label: 'إجمالي التسبيح',
      value: syncData?.tasbih_total ? `${syncData.tasbih_total.toLocaleString()} تسبيحة` : '0 تسبيحة',
      color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10',
    },
    {
      icon: Radio,
      label: 'المحطات المفضلة',
      value: syncData?.radio_favorites ? `${syncData.radio_favorites.length} محطة` : '0 محطة',
      color: 'from-purple-500 to-pink-600', bg: 'bg-purple-500/10',
    },
    {
      icon: Target,
      label: 'دورات التسبيح',
      value: syncData?.tasbih_laps ? `${syncData.tasbih_laps} دورة` : '0 دورة',
      color: 'from-rose-500 to-red-600', bg: 'bg-rose-500/10',
    },
    {
      icon: Calendar,
      label: 'تاريخ الاشتراك',
      value: formatDate(user.created_at),
      color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500/10',
    },
  ];

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-6 md:space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full"></div>
        <button onClick={onBack} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 hover:bg-emerald-500 flex items-center justify-center text-gray-400 hover:text-white transition-all mb-6 shadow-lg">
          <ChevronLeft size={20} className="md:w-6 md:h-6" />
        </button>
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="relative">
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover border-2 border-emerald-500/30 shadow-2xl" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl md:text-5xl font-black shadow-2xl shadow-emerald-900/40">
                {(displayName[0] || '?').toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-[#020617] flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          </div>
          <div className="text-center md:text-right flex-1 space-y-2">
            <h2 className="text-2xl md:text-4xl font-black text-white">{displayName}</h2>
            <div className="flex items-center justify-center md:justify-end gap-2 text-gray-400 text-sm">
              <Mail size={14} />
              <span dir="ltr" className="text-xs">{user.email}</span>
            </div>
            {(displayCountry || displayCity) && (
              <div className="flex items-center justify-center md:justify-end gap-2 text-gray-500 text-xs">
                <MapPin size={12} />
                <span>{displayCountry}{displayCity ? ` - ${displayCity}` : ''}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={handleManualSync} disabled={syncing}
              className={`px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center gap-2 ${syncStatus === 'done' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {syncStatus === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : syncStatus === 'done' ? <Check size={14} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-9-9" /><path d="M21 3v5h-5" /></svg>}
              {syncStatus === 'syncing' ? 'مزامنة...' : syncStatus === 'done' ? 'تمت المزامنة' : 'مزامنة'}
            </button>
            <button onClick={handleLogout}
              className="px-5 py-3 rounded-2xl font-black text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all shadow-lg flex items-center gap-2 border border-red-500/10">
              <LogOut size={14} /> خروج
            </button>
            {user.email === ADMIN_EMAIL && onGoToAdmin && (
              <button onClick={onGoToAdmin}
                className="px-5 py-3 rounded-2xl font-black text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-lg flex items-center gap-2 border border-emerald-500/10">
                <Shield size={14} /> الإدارة
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
        {statCards.map((card, idx) => (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={idx}
            className="glass-panel p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-all duration-500 shadow-xl group">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${card.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <card.icon size={20} className="md:w-6 md:h-6" />
            </div>
            <p className="text-[9px] md:text-xs text-gray-500 font-black uppercase mb-1">{card.label}</p>
            <p className="text-xs md:text-lg font-black text-white truncate">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {syncData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="glass-panel p-5 md:p-8 rounded-[2rem] border border-white/5 shadow-xl">
          <h3 className="text-sm md:text-lg font-black text-white mb-4 flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" />
            معلومات المزامنة
          </h3>
          <div className="space-y-2 text-[10px] md:text-sm text-gray-400">
            <p>✓ البيانات في السحابة محدثة وآمنة</p>
            <p>✓ جميع أجهزتك ستتزامن تلقائياً عند تسجيل الدخول</p>
            <p>✓ آخر تحديث: {new Date().toLocaleString('ar-SA')}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;
