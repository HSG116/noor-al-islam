import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Bot, Loader2, Trash2, MessageCircle, Check, Copy, Sparkles, History, LogIn, Clock, User, MessageSquare, ChevronLeft, Calendar } from 'lucide-react';
import { getRemaining, canSend, getGuestMessages, saveGuestMessages, incrementGuestCount, resetGuestCount, saveChat, getUserChats, getChatById, deleteChat, getTodayUserMsgCount } from '../services/chatService';

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

const DEEPSEEK_KEYS = [
  'sk-f606af64b454403684bec8eb477916e5',
  'sk-7ae88917fa654723b43323e950abd9d4',
  'sk-8d59f937022948ba94960876a0511848',
];
const API_URL = 'https://api.deepseek.com/chat/completions';
const SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي إسلامي اسمه "المستشار الإسلامي". يجب عليك في كل رد أن توضح أنك ذكاء اصطناعي وليس بشراً، وأن تستند إجاباتك إلى القرآن الكريم والسنة النبوية والإجماع والقياس. في نهاية كل رد، أضف تنبيهاً واضحاً بأن هذه معلومات استرشادية ويجب الرجوع إلى هيئة كبار العلماء أو دار الإفتاء السعودية أو دار الإفتاء في بلد المستخدم للحصول على الفتوى الرسمية. مثال: *تنبيه: أنا ذكاء اصطناعي للمساعدة فقط، يُرجى مراجعة هيئة كبار العلماء أو دار الإفتاء في بلدك للفتوى الرسمية.* استخدم تنسيق Markdown: **للنص العريض**، *للنص المائل*، \\\`للكود\\\`، # للعناوين، > للاقتباسات، - أو 1. للقوائم. كن مختصراً وواضحاً ومعتدلاً.`;

const fetchDeepSeek = async (messages: { role: string; content: string }[], keyIndex = 0): Promise<string> => {
  if (keyIndex >= DEEPSEEK_KEYS.length) throw new Error('جميع المفاتيح غير صالحة');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEYS[keyIndex]}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 800, temperature: 0.7 }),
  });
  if (res.status === 401) return fetchDeepSeek(messages, keyIndex + 1);
  if (!res.ok) throw new Error('فشل الاتصال');
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'عذراً، لم أتمكن من الإجابة. حاول مرة أخرى.';
};

const renderMd = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  const flushList = (key: string) => {
    if (listItems.length) {
      nodes.push(<div key={key} className="space-y-1 mr-4 my-1">{listItems}</div>);
      listItems = []; inList = false;
    }
  };
  const parseInline = (t: string, idx: number): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let pi = 0;
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let match; let last = 0;
    while ((match = regex.exec(t)) !== null) {
      if (match.index > last) parts.push(t.slice(last, match.index));
      if (match[2]) parts.push(<strong key={idx + '-' + pi++} className="text-emerald-300 font-black">{match[2]}</strong>);
      else if (match[4]) parts.push(<em key={idx + '-' + pi++} className="text-emerald-200/80 italic">{match[4]}</em>);
      else if (match[6]) parts.push(<code key={idx + '-' + pi++} className="bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-emerald-500/20">{match[6]}</code>);
      else if (match[8]) parts.push(<a key={idx + '-' + pi++} href={match[9]} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300 underline-offset-2">{match[8]}</a>);
      last = regex.lastIndex;
    }
    if (last < t.length) parts.push(t.slice(last));
    return parts.length ? <>{parts}</> : t;
  };
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === '') { flushList('l' + i); nodes.push(<div key={i} className="h-2" />); return; }
    if (/^#{1,3}\s/.test(trimmed)) {
      flushList('h' + i);
      const level = trimmed.match(/^#+/)![0].length;
      const text = trimmed.replace(/^#+\s*/, '');
      const sizes = ['text-lg md:text-xl font-black text-emerald-300', 'text-base md:text-lg font-bold text-emerald-300/90', 'text-sm md:text-base font-bold text-emerald-300/80'];
      nodes.push(<div key={i} className={sizes[level - 1] + ' mt-2 mb-1'}>{parseInline(text, i)}</div>); return;
    }
    if (/^>\s?/.test(trimmed)) {
      flushList('b' + i);
      const text = trimmed.replace(/^>\s?/, '');
      nodes.push(<div key={i} className="border-r-2 border-emerald-500/40 pr-3 mr-2 text-emerald-200/80 italic text-xs md:text-sm py-1 my-1">{parseInline(text, i)}</div>); return;
    }
    if (/^[-*]\s/.test(trimmed)) {
      inList = true;
      const text = trimmed.replace(/^[-*]\s*/, '');
      listItems.push(<div key={'li' + i} className="flex items-start gap-2 text-xs md:text-sm"><span className="text-emerald-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span><span>{parseInline(text, i)}</span></div>); return;
    }
    if (/^\d+[.)]\s/.test(trimmed)) {
      inList = true;
      const num = trimmed.match(/^\d+/)?.[0] || '';
      const text = trimmed.replace(/^\d+[.)]\s*/, '');
      listItems.push(<div key={'li' + i} className="flex items-start gap-2 text-xs md:text-sm"><span className="text-emerald-400 font-mono font-bold text-[10px] mt-0.5 shrink-0 w-4">{num}.</span><span>{parseInline(text, i)}</span></div>); return;
    }
    flushList('f' + i);
    nodes.push(<p key={i} className="text-xs md:text-sm leading-relaxed">{parseInline(trimmed, i)}</p>);
  });
  flushList('end');
  return nodes;
};

const WELCOME_MSG: ChatMsg = { role: 'assistant', content: 'السلام عليكم! أنا **المستشار الإسلامي**، مساعد ذكاء اصطناعي أقدم معلومات استرشادية بناءً على القرآن والسنة.\n\n> 💡 **تنبيه:** أنا ذكاء اصطناعي وليس مفتياً. يُرجى مراجعة **هيئة كبار العلماء** أو **دار الإفتاء السعودية** أو دار الإفتاء في بلدك للحصول على الفتوى الرسمية.\n\n**مثال:** ما حكم الاستثمار في الأسهم؟' };

const msgVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

interface AiChatProps {
  userId?: string | null;
  email?: string;
  userName?: string;
}

const AiChat: React.FC<AiChatProps> = ({ userId, email, userName }) => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [remaining, setRemaining] = useState(30);
  const [blocked, setBlocked] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);

  const msgBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!userId;

  const refreshRemaining = async () => {
    const r = await getRemaining(userId || null);
    setRemaining(r);
    setBlocked(r <= 0);
  };

  useEffect(() => {
    if (!open) return;
    refreshRemaining();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 400);
    // Load last guest chat if not logged in
    if (!isLoggedIn) {
      const saved = getGuestMessages();
      if (saved.length > 0) {
        setMsgs(saved as ChatMsg[]);
      }
    }
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (msgBoxRef.current) {
        msgBoxRef.current.scrollTop = msgBoxRef.current.scrollHeight;
      }
    });
  }, [msgs, loading, open]);

  const saveCurrentChat = async () => {
    const chatMsgs = msgs.filter(m => m.content !== WELCOME_MSG.content || m.role !== 'assistant');
    if (chatMsgs.length === 0) return;
    if (isLoggedIn) {
      const newId = await saveChat({ userId, email, name: userName, messages: msgs, chatId });
      if (newId) setChatId(newId);
    } else {
      saveGuestMessages(msgs);
    }
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading || blocked) return;
    setInput('');
    const newMsgs: ChatMsg[] = [...msgs, { role: 'user', content: q }];
    setMsgs(newMsgs);
    setLoading(true);

    try {
      const apiMsgs = [{ role: 'system', content: SYSTEM_PROMPT }, ...newMsgs.slice(-10).map(m => ({ role: m.role, content: m.content }))];
      const reply = await fetchDeepSeek(apiMsgs);
      const finalMsgs = [...newMsgs, { role: 'assistant', content: reply }];
      setMsgs(finalMsgs);

      // Update count & save
      if (isLoggedIn) {
        const newId = await saveChat({ userId, email, name: userName, messages: finalMsgs, chatId });
        if (newId) setChatId(newId);
        const r = await getRemaining(userId);
        setRemaining(r);
        if (r <= 0) setBlocked(true);
      } else {
        incrementGuestCount();
        saveGuestMessages(finalMsgs);
        const r = await getRemaining(null);
        setRemaining(r);
        if (r <= 0) setBlocked(true);
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى لاحقاً.' }]);
    } finally { setLoading(false); }
  };

  const copyAll = async () => {
    const text = msgs.filter(m => m.role === 'assistant').map(m => m.content).join('\n\n---\n\n');
    await navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const clearChat = () => {
    setMsgs([WELCOME_MSG]);
    setChatId(null);
    if (!isLoggedIn) {
      resetGuestCount();
      saveGuestMessages([]);
      setRemaining(3);
      setBlocked(false);
    } else {
      refreshRemaining();
    }
  };

  const loadHistory = async () => {
    if (!isLoggedIn) return;
    setHistoryLoading(true);
    const list = await getUserChats(userId!);
    setHistoryList(list);
    setShowHistory(true);
    setHistoryLoading(false);
  };

  const openHistoryChat = async (item: any) => {
    const full = item.messages || [];
    setMsgs(full.length > 0 ? full : [WELCOME_MSG]);
    setChatId(item.id);
    setShowHistory(false);
    setSelectedHistory(null);
    refreshRemaining();
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteChat(id);
    setHistoryList(prev => prev.filter(h => h.id !== id));
  };

  const startNewChat = () => {
    setMsgs([WELCOME_MSG]);
    setChatId(null);
    setShowHistory(false);
    refreshRemaining();
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.12, boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-[999] w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-900/60 flex items-center justify-center transition-all ring-2 ring-emerald-500/40"
            aria-label="المستشار الإسلامي"
          >
            <MessageCircle size={24} className="drop-shadow-lg" />
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0f172a] shadow-lg shadow-emerald-500/50"
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setOpen(false)} />

            <div className="relative flex flex-col flex-1 w-full md:max-w-lg md:mx-auto md:my-auto md:max-h-[620px] md:rounded-3xl bg-[#0b1622]/95 backdrop-blur-2xl border border-emerald-500/20 rounded-t-3xl shadow-2xl overflow-hidden shadow-emerald-900/20">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/8 blur-[120px] rounded-full pointer-events-none" />

              {/* Header */}
              <div className="relative shrink-0 p-3 md:p-4 border-b border-white/5 flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/5">
                {showHistory ? (
                  <>
                    <button onClick={() => setShowHistory(false)} className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      <ChevronLeft size={16} />
                    </button>
                    <div className="flex-1 text-center">
                      <h3 className="text-white font-bold text-xs md:text-sm">سجل المحادثات</h3>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ rotate: -20, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 250, delay: 0.15 }}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 shrink-0"
                    >
                      <Bot size={18} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-xs md:text-sm truncate">المستشار الإسلامي</h3>
                      <p className="text-[9px] md:text-[10px] text-emerald-400/70 flex items-center gap-1">
                        <Sparkles size={9} className="text-emerald-400 shrink-0" />
                        للاستفسارات الشرعية
                      </p>
                    </div>
                    {isLoggedIn && (
                      <button onClick={loadHistory} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="سجل المحادثات">
                        <History size={14} />
                      </button>
                    )}
                    <button onClick={copyAll} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="نسخ المحادثة">
                      {copyFeedback ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <button onClick={clearChat} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="مسح المحادثة">
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => setOpen(false)} className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* History Panel */}
              {showHistory ? (
                <div className="flex-1 overflow-y-auto p-3 md:p-4 custom-scrollbar">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                  ) : historyList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                      <MessageSquare size={40} className="mb-3 opacity-30" />
                      <p className="text-sm font-bold">لا توجد محادثات سابقة</p>
                      <p className="text-[10px] mt-1">كل محادثة ستظهر هنا تلقائياً</p>
                      <button onClick={startNewChat} className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[11px] font-black hover:bg-emerald-500 transition-all">
                        بدء محادثة جديدة
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-gray-500 font-bold">{historyList.length} محادثة</p>
                        <button onClick={startNewChat} className="text-[10px] text-emerald-400 font-black hover:text-emerald-300 transition-all">
                          + جديدة
                        </button>
                      </div>
                      {historyList.map((item) => {
                        const msgsArr: ChatMsg[] = item.messages || [];
                        const lastMsg = msgsArr.filter(m => m.role === 'user').pop();
                        const date = new Date(item.updated_at || item.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                        return (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => openHistoryChat(item)}
                            className="w-full text-right glass-panel p-3 md:p-4 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden"
                          >
                            <button
                              onClick={(e) => handleDeleteChat(e, item.id)}
                              className="absolute top-2 left-2 p-1.5 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 size={11} />
                            </button>
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                <MessageSquare size={14} />
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-white font-bold text-[11px] md:text-xs truncate leading-tight">
                                  {lastMsg?.content || 'بداية محادثة'}
                                </p>
                                <div className="flex items-center gap-2 text-[9px] text-gray-600">
                                  <Calendar size={9} />
                                  <span>{date}</span>
                                  <span className="text-gray-700">•</span>
                                  <span>{msgsArr.filter(m => m.role === 'user').length} سؤال</span>
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Remaining bar */}
                  {blocked ? (
                    <div className="shrink-0 px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                      {isLoggedIn ? (
                        <p className="text-[10px] md:text-xs text-amber-400 font-bold text-center flex items-center justify-center gap-2">
                          <Clock size={13} />
                          لقد استنفدت الحد اليومي. سيتم التجديد غداً.
                        </p>
                      ) : (
                        <p className="text-[10px] md:text-xs text-amber-400 font-bold text-center flex items-center justify-center gap-2">
                          <LogIn size={13} />
                          لقد استنفدت الأسئلة المجانية. <span className="text-white">سجّل دخولك</span> للمتابعة.
                        </p>
                      )}
                    </div>
                  ) : remaining <= 5 ? (
                    <div className="shrink-0 px-4 py-2 bg-rose-500/10 border-b border-rose-500/20">
                      <p className="text-[10px] text-rose-400 font-bold text-center flex items-center justify-center gap-1.5">
                        <MessageSquare size={11} />
                        متبقي {remaining} {isLoggedIn ? 'سؤال اليوم' : 'سؤال مجاني'}
                      </p>
                    </div>
                  ) : (
                    <div className="shrink-0 px-4 py-1.5 bg-emerald-500/5 border-b border-emerald-500/10">
                      <p className="text-[9px] text-emerald-400/60 font-bold text-center flex items-center justify-center gap-1">
                        <MessageSquare size={10} />
                        {isLoggedIn ? `باقي ${remaining} سؤال اليوم` : `${remaining} أسئلة مجانية`}
                      </p>
                    </div>
                  )}

                  {/* Messages */}
                  <div ref={msgBoxRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2.5 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {msgs.map((msg, i) => (
                        <motion.div
                          key={i}
                          variants={msgVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          layout
                          className={`flex gap-2 ${msg.role === 'user' ? 'justify-start flex-row-reverse' : ''}`}
                        >
                          {msg.role === 'assistant' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', damping: 15, stiffness: 250, delay: 0.1 }}
                              className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-gradient-to-br from-emerald-400/30 to-emerald-600/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1 border border-emerald-500/20"
                            >
                              <Bot size={12} />
                            </motion.div>
                          )}
                          <div className={`max-w-[88%] p-3 md:p-3.5 rounded-2xl text-[11px] md:text-sm leading-relaxed shadow-lg ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-bl-lg shadow-emerald-900/40'
                              : 'bg-white/5 text-gray-200 border border-white/5 rounded-br-lg backdrop-blur-sm'
                          }`}>
                            <div className="space-y-0.5" dir="auto">{renderMd(msg.content)}</div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {loading && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                        <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-gradient-to-br from-emerald-400/30 to-emerald-600/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1 border border-emerald-500/20">
                          <Bot size={12} />
                        </div>
                        <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl rounded-br-lg backdrop-blur-sm">
                          <div className="flex gap-1.5">
                            <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }} className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full" />
                            <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15, ease: 'easeInOut' }} className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full" />
                            <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3, ease: 'easeInOut' }} className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="relative shrink-0 p-3 md:p-4 border-t border-white/5 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5">
                    <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-2xl p-1.5 focus-within:border-emerald-500/50 transition-all duration-300 shadow-inner shadow-black/50">
                      <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send()}
                        placeholder={blocked ? (isLoggedIn ? 'الحد اليومي انتهى' : 'سجّل دخولك للمتابعة') : 'اسأل عن أي شيء...'}
                        className="flex-1 bg-transparent border-none px-3 py-2 text-white text-xs md:text-sm outline-none placeholder:text-gray-600"
                        disabled={blocked}
                        dir="auto"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={blocked ? undefined : send}
                        disabled={loading || !input.trim() || blocked}
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/40"
                      >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </motion.button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChat;
