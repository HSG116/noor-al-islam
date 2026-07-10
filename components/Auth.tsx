import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CountrySelector } from './CountrySelector';
import { CitySelector } from './CitySelector';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle, User, Check } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
  onBack: () => void;
  onGuest?: () => void;
}

const LOGO_URL = "./logo.webp";

export const Auth: React.FC<AuthProps> = ({ onSuccess, onBack, onGuest }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { console.log('✅ Already logged in'); onSuccess(); }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      if (!email.trim()) { setError('يرجى إدخال البريد الإلكتروني'); return; }
      if (!password) { setError('يرجى إدخال كلمة المرور'); return; }
      setLoading(true);
      setStep('جاري تسجيل الدخول...');
      try {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          console.error('❌ signInWithPassword error:', err);
          if (err.message?.includes('Invalid login credentials')) {
            throw new Error('بريد إلكتروني أو كلمة مرور غير صحيحة');
          }
          if (err.message?.includes('Email logins are disabled')) {
            throw new Error('تسجيل الدخول بالبريد معطل في Supabase. فعّل Email provider في Dashboard.');
          }
          throw new Error(err.message);
        }
        console.log('✅ Login success');
        setStep('تم! جارِ التوجيه...');
        onSuccess();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setStep(null);
      }
      return;
    }

    // --- SIGNUP ---
    if (!fullName.trim()) { setError('يرجى إدخال اسمك'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('يرجى إدخال بريد إلكتروني صحيح'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (password !== confirmPassword) { setError('كلمات المرور غير متطابقة'); return; }

    setLoading(true);
    setStep('جاري إنشاء الحساب...');

    try {
      console.log('📝 signUp with:', email);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, country, city } },
      });
      console.log('📝 signUp result:', { user: !!data?.user, session: !!data?.session, error: signUpError });

      if (signUpError?.message?.includes('User already registered')) {
        throw new Error('هذا البريد مسجل مسبقاً. لا يمكن إنشاء حسابين لنفس البريد. سجل دخولك.');
      }
      if (signUpError) throw new Error(signUpError.message);

      // Save profile (non-blocking)
      if (data?.user) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id, email, full_name: fullName, country, city,
          }, { onConflict: 'id' });
          await supabase.from('users').upsert({
            id: data.user.id, name: fullName, email,
          }, { onConflict: 'id' });
          console.log('✅ Profile & user saved');
        } catch (e) {
          console.warn('⚠ Data save skipped:', e);
        }
      }

      // Case 1: Already has session (email confirmation is OFF)
      if (data?.session) {
        console.log('✅ Session from signUp, logging in...');
        setStep('تم إنشاء الحساب! جارِ التوجيه...');
        onSuccess();
        return;
      }

      // Case 2: No session - email confirmation might be ON
      setStep('جاري تسجيل الدخول التلقائي...');
      await new Promise(r => setTimeout(r, 800));

      console.log('🔄 Trying signInWithPassword after signUp...');
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      console.log('🔄 signInWithPassword result:', { error: loginError });

      if (loginError) {
        const msg = loginError.message || '';
        console.error('❌ Auto-login failed:', msg);
        if (msg.includes('Email not confirmed') || msg.includes('Invalid login credentials') || msg.includes('email_not_confirmed')) {
          throw new Error(
            'تم إنشاء الحساب ✅\n\n' +
            'لكن لا يمكنني تسجيل الدخول تلقائياً لأن "تأكيد البريد الإلكتروني" مفعّل في Supabase.\n\n' +
            'الحل:\n' +
            '1. اذهب إلى Supabase Dashboard\n' +
            '2. Authentication ← Settings\n' +
            '3. أوقف "Confirm email"\n' +
            '4. ثم جرب تسجيل الدخول مرة أخرى'
          );
        }
        throw new Error(msg);
      }

      console.log('✅ Auto-login success!');
      setStep('تم! جارِ التوجيه...');
      onSuccess();
    } catch (err: any) {
      console.error('❌ Signup error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setStep(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 pb-20">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>

        <button onClick={onBack} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10">
          <ArrowRight size={24} />
        </button>

        <div className="flex justify-center mb-6 mt-4">
          <img src={LOGO_URL} alt="Logo" className="w-24 h-auto drop-shadow-xl" />
        </div>

        <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
          {isLogin ? 'تسجيل الدخول' : 'حساب جديد'}
        </h2>
        <p className="text-center text-gray-400 mb-8 text-sm">
          {isLogin ? 'مرحباً بعودتك' : 'انضم إلينا'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs p-4 rounded-xl mb-6 text-right whitespace-pre-line leading-relaxed">
            <span className="font-bold flex items-center gap-2 mb-1">
              <AlertCircle size={14} />
              {error.includes('تم إنشاء الحساب') ? 'تم إنشاء الحساب' : 'خطأ'}
            </span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative group">
                <User className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-emerald-400" size={20} />
                <input type="text" placeholder="الاسم الكامل" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 text-right placeholder:text-gray-600 text-white" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <CountrySelector value={country} onChange={setCountry} />
              {country && <CitySelector countryCode={country} value={city} onChange={setCity} />}
            </>
          )}

          <div className="relative group">
            <Mail className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-emerald-400" size={20} />
            <input type="email" placeholder="البريد الإلكتروني" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 text-right placeholder:text-gray-600 text-white" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="relative group">
            <Lock className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-emerald-400" size={20} />
            <input type="password" placeholder="كلمة المرور" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 text-right placeholder:text-gray-600 text-white" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {!isLogin && (
            <div className="relative group">
              {password && confirmPassword && password === confirmPassword ? (
                <Check className="absolute right-4 top-3.5 text-emerald-400" size={20} />
              ) : (
                <Lock className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-emerald-400" size={20} />
              )}
              <input type="password" placeholder="تأكيد كلمة المرور"
                className={`w-full bg-black/20 border rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:bg-black/30 text-right placeholder:text-gray-600 text-white ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'}`}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading && <Loader2 className="animate-spin" size={20} />}
            {step || (isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب')}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6 opacity-60">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-gray-400 font-medium">أو</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <button type="button" onClick={async () => {
          setError(null);
          setLoading(true);
          setStep('جاري الاتصال بـ Google...');
          try {
            const { error: err } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: window.location.origin },
            });
            if (err) {
              if (err.message?.includes('User already registered') || err.message?.includes('already exists')) {
                throw new Error('هذا البريد مسجل مسبقاً بحساب يدوي. استخدم تسجيل الدخول العادي.');
              }
              throw new Error(err.message);
            }
          } catch (err: any) {
            setError(err.message);
            setLoading(false);
            setStep(null);
          }
        }} disabled={loading}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl transition-all flex items-center justify-center gap-3 text-sm font-bold shadow-lg disabled:opacity-50">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <div className="flex items-center gap-4 my-4 opacity-40">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-gray-500 font-medium">خيارات أخرى</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <button type="button" onClick={() => { if (onGuest) onGuest(); else onSuccess(); }}
          className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white py-3 rounded-xl transition-all text-sm">
          الدخول كزائر
        </button>

        <div className="mt-6 text-center">
          <button onClick={() => { setError(null); setIsLogin(!isLogin); setPassword(''); setConfirmPassword(''); }}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            {isLogin ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب؟ سجل دخولك'}
          </button>
        </div>
      </div>
    </div>
  );
};
