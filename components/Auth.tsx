
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import emailjs from '@emailjs/browser';
import { CountrySelector } from './CountrySelector';
import { CitySelector } from './CitySelector';
import { Mail, Lock, Loader2, ArrowRight, UserCircle, AlertCircle, ShieldCheck, KeyRound, User, Check, RefreshCw, LogIn, Info } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
  onBack: () => void;
  onGuest?: () => void;
}

const LOGO_URL = "./logo.png";

export const Auth: React.FC<AuthProps> = ({ onSuccess, onBack, onGuest }) => {
  const [step, setStep] = useState<'auth' | 'verify'>('auth');
  const [isLogin, setIsLogin] = useState(true);

  // Inputs
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState(''); // NEW: City State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Logic State
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(() => sessionStorage.getItem('signup_otp'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forceLoginMode, setForceLoginMode] = useState(false);

  // Resend Timer State
  const [timer, setTimer] = useState(0);

  // EmailJS Config
  const SERVICE_ID = "service_lidz4ln";
  const TEMPLATE_ID = "template_jrk5l6d";
  const PUBLIC_KEY = "dujmsUrIdYmjNe4jL";

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const clearSession = () => {
    sessionStorage.removeItem('signup_otp');
    setGeneratedOtp(null);
  };

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const normalizeArabicNumbers = (str: string) => {
    return str
      .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
      .replace(/[^0-9]/g, '');
  };

  const sendEmail = async (otpCode: string) => {
    const messageBody = `مرحباً ${fullName}،\n\nرمز التحقق الخاص بك هو: ${otpCode}\n\nاستخدم هذا الرمز لإكمال التسجيل في نور الإسلام.`;

    const templateParams = {
      to_name: fullName,
      to_email: email,
      email: email,
      passcode: otpCode,
      message: messageBody,
      otp: otpCode,
      code: otpCode,
      verification_code: otpCode,
      my_code: otpCode,
      number: otpCode,
      text: messageBody,
      content: messageBody,
      notes: `Your Code is: ${otpCode}`,
      reply_to: 'no-reply@noor-islam.com',
    };

    console.log("Sending Email Params:", templateParams);
    return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setForceLoginMode(false);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        clearSession();
        onSuccess();
      } else {
        // --- SIGNUP FLOW ---

        // 1. Validations
        if (!fullName.trim()) throw new Error("يرجى إدخال اسمك");
        if (!country) throw new Error("يرجى اختيار دولتك");
        if (!city) throw new Error("يرجى اختيار مدينتك لتحديد مواقيت الصلاة بدقة");
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) throw new Error("يرجى إدخال بريد إلكتروني صحيح");
        if (password.length < 6) throw new Error("يجب أن تكون كلمة المرور 6 أحرف على الأقل");
        if (password !== confirmPassword) throw new Error("كلمات المرور غير متطابقة");

        // 2. CHECK IF USER ALREADY EXISTS
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (existingUser) {
          setForceLoginMode(true);
          throw new Error("هذا البريد الإلكتروني مسجل بالفعل. لا يمكن إنشاء أكثر من حساب بنفس البريد.");
        }

        // 3. Generate OTP
        const otp = generateOTP();
        console.log("DEBUG: New OTP Generated:", otp);

        setGeneratedOtp(otp);
        sessionStorage.setItem('signup_otp', otp);

        // 4. Send Email
        try {
          await sendEmail(otp);
          setStep('verify');
          setTimer(60);
        } catch (emailError: any) {
          console.error("EmailJS Error:", emailError);
          if (emailError.text?.includes("service")) {
            throw new Error("خطأ في خدمة البريد. يرجى التحقق من إعدادات الخدمة.");
          }
          throw new Error("فشل إرسال البريد الإلكتروني. يرجى التأكد من صحة البريد والمحاولة مجدداً.");
        }
      }
    } catch (err: any) {
      let msg = err.message || 'حدث خطأ غير متوقع';
      if (msg.includes('Email logins are disabled')) {
        msg = 'تسجيل الدخول معطل. يرجى تفعيل "Enable Email provider" في إعدادات Supabase.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'البريد الإلكتروني غير مفعل. يرجى التحقق من بريدك أو تشغيل كود SQL لتفعيل الحسابات.';
      } else if (msg.includes('User already registered')) {
        msg = 'هذا البريد الإلكتروني مسجل بالفعل.';
        setForceLoginMode(true);
      }
      setError(msg);
      if (isLogin) setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    const currentOtp = generatedOtp || sessionStorage.getItem('signup_otp');
    if (!currentOtp || timer > 0) return;
    setLoading(true);
    setError(null);
    try {
      console.log("DEBUG: Resending OTP:", currentOtp);
      await sendEmail(currentOtp);
      setTimer(60);
      setOtpInput('');
      alert(`تم إعادة إرسال الرمز إلى ${email}`);
    } catch (err) {
      setError("فشل إعادة الإرسال، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setForceLoginMode(false);

    const cleanInput = normalizeArabicNumbers(otpInput).trim();
    const currentOtp = generatedOtp || sessionStorage.getItem('signup_otp');

    console.log(`DEBUG: Verifying...`);

    try {
      if (!currentOtp) {
        throw new Error("انتهت صلاحية الجلسة. يرجى العودة للخلف والمحاولة مجدداً.");
      }

      if (cleanInput !== currentOtp) {
        throw new Error("رمز التحقق غير صحيح، يرجى التأكد من الكود في بريدك الإلكتروني");
      }

      // 1. Attempt Sign Up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            country: country, // Sending Country
            city: city // Sending City
          }
        }
      });

      if (signUpError && !signUpError.message.includes('User already registered')) {
        throw signUpError;
      }

      let session = signUpData.session;
      let user = signUpData.user;

      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error("الحساب موجود ولكن البريد غير مفعل. (تأكد من تشغيل كود SQL).");
          }
          if (signInError.message.includes('Invalid login credentials')) {
            setForceLoginMode(true);
            throw new Error("هذا البريد مسجل مسبقاً بكلمة مرور مختلفة. يرجى تسجيل الدخول.");
          }
          throw signInError;
        }
        session = signInData.session;
        user = signInData.user;
      }

      // 3. Manual Profile Backup (including country & city)
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: email,
            full_name: fullName,
            country: country,
            city: city
          }, { onConflict: 'id' });

        if (profileError) {
          console.error("Profile creation warning:", profileError);
        }
      }

      clearSession();
      onSuccess();

    } catch (err: any) {
      let msg = err.message || 'فشل التحقق';
      if (msg.includes('User already registered')) {
        setForceLoginMode(true);
        setError("الحساب مسجل بالفعل.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- VERIFICATION STEP UI ---
  if (step === 'verify') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in duration-500">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden border border-emerald-500/20 shadow-2xl shadow-emerald-900/20">

          <div className="flex justify-center mb-4">
            <img src={LOGO_URL} alt="Logo" className="w-20 h-auto drop-shadow-lg" />
          </div>

          <button onClick={() => { setStep('auth'); clearSession(); }} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
            <ArrowRight size={24} />
          </button>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 border border-blue-500/20 animate-pulse">
              <ShieldCheck size={32} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2 text-white">التحقق من الهوية</h2>
          <p className="text-center text-gray-400 mb-8 text-sm leading-relaxed">
            تم إرسال رمز التحقق إلى بريدك الإلكتروني:
            <br />
            <span className="text-emerald-400 font-mono bg-emerald-900/20 px-2 py-1 rounded mt-2 inline-block ltr">{email}</span>
          </p>

          <form onSubmit={handleVerification} className="space-y-6">
            <div className="relative group">
              <KeyRound className="absolute right-4 top-3.5 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
              <input
                type="text"
                dir="ltr"
                placeholder="------"
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 transition-all text-center tracking-[0.5em] font-mono text-2xl text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-sm placeholder:opacity-30"
                value={otpInput}
                onChange={(e) => {
                  const val = normalizeArabicNumbers(e.target.value);
                  if (val.length <= 6) setOtpInput(val);
                }}
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={timer > 0 || loading}
                className={`text-xs flex items-center justify-center gap-1 mx-auto transition-colors ${timer > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-emerald-400 hover:text-emerald-300'}`}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                {timer > 0 ? `إعادة الإرسال متاحة خلال ${timer} ثانية` : 'لم يصلك الرمز؟ إعادة الإرسال'}
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs p-3 rounded-lg text-center flex flex-col gap-2 animate-in bounce-in">
                <div className="flex items-center justify-center gap-2 font-bold">
                  <AlertCircle size={14} />
                  <span>تنبيه</span>
                </div>
                <span>{error}</span>
                {forceLoginMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep('auth');
                      setIsLogin(true);
                      setError(null);
                      clearSession();
                    }}
                    className="mt-2 bg-red-500/20 hover:bg-red-500/30 text-white text-xs py-2 px-4 rounded-full transition-all flex items-center justify-center gap-1 mx-auto"
                  >
                    <LogIn size={12} />
                    الذهاب لتسجيل الدخول
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otpInput.length !== 6}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              تأكيد الحساب
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setStep('auth'); clearSession(); }}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              تغيير البريد الإلكتروني
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGIN / REGISTER UI ---
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in zoom-in duration-500 pb-20">

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden">
        {/* Decorative Glow */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>

        <button onClick={() => { onBack(); clearSession(); }} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-10">
          <ArrowRight size={24} />
        </button>

        <div className="flex justify-center mb-6 mt-4">
          <img src={LOGO_URL} alt="Logo" className="w-24 h-auto drop-shadow-xl animate-in zoom-in" />
        </div>

        <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
          {isLogin ? 'أهلاً بك مجدداً' : 'حساب جديد'}
        </h2>

        <p className="text-center text-gray-400 mb-8 text-sm">
          {isLogin ? 'استكمل رحلتك في حفظ كتاب الله' : 'انضم إلينا وابدأ حفظ القرآن الكريم مجاناً'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">

          {/* Name Field - Only for Signup */}
          {!isLogin && (
            <>
              <div className="relative group animate-in slide-in-from-top-2 duration-300">
                <User className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="اسمك الكريم"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 transition-all text-right placeholder:text-gray-600 text-white"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                />
              </div>

              {/* Country Selection - Only for Signup */}
              <CountrySelector value={country} onChange={setCountry} />

              {/* City Selection - Shows after country selected */}
              {country && (
                <CitySelector countryCode={country} value={city} onChange={setCity} />
              )}
            </>
          )}

          {/* Email Field */}
          <div className="relative group">
            <Mail className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input
              type="email"
              placeholder="البريد الإلكتروني"
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 transition-all text-right placeholder:text-gray-600 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative group">
            <Lock className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input
              type="password"
              placeholder="كلمة المرور"
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 transition-all text-right placeholder:text-gray-600 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {/* Confirm Password Field - Only for Signup */}
          {!isLogin && (
            <div className="relative group animate-in slide-in-from-top-2 duration-300">
              {password && confirmPassword && password === confirmPassword ? (
                <Check className="absolute right-4 top-3.5 text-emerald-400 transition-colors" size={20} />
              ) : (
                <Lock className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" size={20} />
              )}
              <input
                type="password"
                placeholder="تأكيد كلمة المرور"
                className={`w-full bg-black/20 border rounded-xl py-3 pr-12 pl-4 focus:outline-none focus:bg-black/30 transition-all text-right placeholder:text-gray-600 text-white
                    ${confirmPassword && password !== confirmPassword
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-white/10 focus:border-emerald-500/50'}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isLogin}
                minLength={6}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs p-3 rounded-lg text-center flex flex-col gap-2 animate-in bounce-in">
              <span className="font-bold flex items-center justify-center gap-2">
                <AlertCircle size={14} />
                تنبيه
              </span>
              <span className="opacity-80 font-mono text-[10px] break-all">{error}</span>
              {forceLoginMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                    setForceLoginMode(false);
                  }}
                  className="mt-1 bg-white/10 hover:bg-white/20 text-white py-1.5 px-3 rounded-lg transition-colors text-xs font-bold"
                >
                  التبديل إلى تسجيل الدخول
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {isLogin ? 'تسجيل الدخول' : 'التالي: التحقق من البريد'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6 opacity-60">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-gray-400 font-medium">خيارات أخرى</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              clearSession();
              if (onGuest) onGuest();
              else onSuccess(); // Fallback for old behavior
            }}
            className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <UserCircle size={18} />
            الدخول كزائر (المصحف فقط)
          </button>
          <p className="text-[10px] text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
            <Info size={12} className="text-orange-400" />
            <span className="text-gray-400">أنت تستخدم</span> <span className="text-orange-400 font-bold">40%</span> <span className="text-gray-400">فقط من خدمات الموقع</span>
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setError(null);
              setIsLogin(!isLogin);
              setStep('auth');
              setForceLoginMode(false);
              clearSession();
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {isLogin ? 'ليس لديك حساب؟ أنشئ حساباً مجانياً الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </div>

      </div>
    </div>
  );
};
