import React, { useState, useRef, useEffect } from 'react';
import { getMemorizationAdvice } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Bot, Send, Sparkles, User } from 'lucide-react';

export const AIAssistant: React.FC = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'السلام عليكم! أنا "رفيق الحفاظ". كيف يمكنني مساعدتك اليوم في رحلة حفظ القرآن؟', timestamp: new Date() }
    ]);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const responseText = await getMemorizationAdvice(userMsg.text);
        
        const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: new Date() };
        setMessages(prev => [...prev, botMsg]);
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto h-[80vh] flex flex-col p-4 animate-in slide-in-from-bottom duration-500">
             <div className="flex items-center gap-3 mb-4 p-4 glass-panel rounded-2xl bg-gradient-to-r from-emerald-900/40 to-slate-900/40">
                <div className="bg-emerald-500/20 p-2 rounded-full">
                    <Sparkles className="text-emerald-400" size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-white">رفيق الحفاظ (AI)</h3>
                    <p className="text-xs text-gray-400">مساعد ذكي مدعوم بتقنية Gemini</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-emerald-600' : 'bg-slate-600'}`}>
                            {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-emerald-600/20 border border-emerald-500/20 rounded-tr-none text-white' 
                            : 'bg-white/5 border border-white/10 rounded-tl-none text-gray-200'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اسأل عن خطة حفظ، متشابهات، أو نصيحة..."
                    className="w-full bg-glass-200 border border-white/10 rounded-full py-4 pr-6 pl-14 focus:outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-all text-right shadow-lg"
                    disabled={loading}
                />
                <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="absolute left-2 top-2 p-2 bg-emerald-600 rounded-full text-white disabled:opacity-50 hover:bg-emerald-500 transition-colors"
                >
                    <Send size={20} className={loading ? 'opacity-0' : ''} />
                </button>
            </form>
        </div>
    );
};
