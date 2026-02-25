import React from 'react';
import { motion } from 'motion/react';
import { Download, MessageCircle, Send, Heart, ExternalLink } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-10 pb-24 md:pb-10 px-4 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

            <div className="max-w-6xl mx-auto flex flex-col items-center">
                {/* Logo & Brand Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-8 text-center"
                >
                    <div className="relative mb-4 inline-block">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>
                        <img src="./logo.png" alt="Noor Al Islam" className="w-16 h-16 relative z-10 mx-auto" />
                    </div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-100 to-emerald-400 bg-clip-text text-transparent">
                        نور الإسلام
                    </h2>
                    <p className="text-emerald-100/60 text-sm mt-2 max-w-xs mx-auto">
                        رفيقك الإيماني في كل زمان ومكان
                    </p>
                </motion.div>

                {/* Download Button Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mb-12 w-full max-w-md"
                >
                    <a
                        href="/noor_al_islam.apk"
                        download
                        className="group relative flex items-center justify-center gap-4 bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-3xl shadow-2xl shadow-emerald-500/20 overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

                        <div className="bg-white/20 p-3 rounded-2xl">
                            <Download className="text-white animate-bounce" size={24} />
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-emerald-100/80 font-medium">تحميل التطبيق الرسمي</p>
                            <h3 className="text-lg font-bold text-white leading-tight">Android APK</h3>
                        </div>

                        <div className="mr-auto bg-black/20 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-100 backdrop-blur-sm">
                            v1.0.0
                        </div>
                    </a>
                </motion.div>

                {/* Social Links Section */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {/* TikTok Link */}
                    <SocialLink
                        href="https://www.tiktok.com/@noor_al__islam"
                        label="تيك توك"
                        icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" /></svg>}
                        color="hover:bg-black"
                    />

                    {/* WhatsApp Channel Link */}
                    <SocialLink
                        href="https://whatsapp.com/channel/0029VauX49o6WaKrquKvGJ3j"
                        label="قناة نَعيمُ الجَنَةِ ||•🤍"
                        icon={<MessageCircle size={20} />}
                        color="hover:bg-[#25D366]"
                    />
                </div>

                {/* Bottom copyright section */}
                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8 text-emerald-100/40 text-sm">
                    <div className="flex items-center gap-2 order-2 md:order-1">
                        <span>حقوق الطبع والنشر © {currentYear} نور الإسلام</span>
                        <span className="hidden md:inline">•</span>
                        <span>جميع الحقوق محفوظة</span>
                    </div>

                    <div className="flex items-center gap-1 order-1 md:order-2">
                        <span>صُنع بكل</span>
                        <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" />
                        <span>بواسطة</span>
                        <a
                            href="https://hsg-new.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors mx-1 underline underline-offset-4 decoration-emerald-500/30"
                        >
                            HSG
                        </a>
                        <span>لنشر الخير والهدى</span>
                    </div>
                </div>
            </div>

            {/* Subtle bottom gradients */}
            <div className="absolute -bottom-24 left-1/4 w-96 h-48 bg-emerald-500/10 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-24 right-1/4 w-96 h-48 bg-teal-500/10 blur-[100px] rounded-full"></div>
        </footer>
    );
};

const SocialLink = ({ href, icon, label, color }: { href: string, icon: any, label: string, color: string }) => (
    <motion.a
        whileHover={{ y: -5, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-emerald-100 transition-all duration-300 ${color}`}
    >
        <div className="text-emerald-400 group-hover:text-white">{icon}</div>
        <span className="text-sm font-bold">{label}</span>
        <ExternalLink size={14} className="opacity-30" />
    </motion.a>
);

export default Footer;
