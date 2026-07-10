import { supabase } from '../supabaseClient';

const GUEST_LIMIT = 3;
const DAILY_LIMIT = 30;
const GUEST_KEY = 'noor_guest_chat_count';

// ── Guest (localStorage) ──

export const getGuestCount = (): number => {
  try { return parseInt(localStorage.getItem(GUEST_KEY) || '0', 10); }
  catch { return 0; }
};

export const incrementGuestCount = (): number => {
  const next = getGuestCount() + 1;
  try { localStorage.setItem(GUEST_KEY, next.toString()); } catch {}
  return next;
};

export const resetGuestCount = (): void => {
  try { localStorage.removeItem(GUEST_KEY); } catch {}
};

// Stored in localStorage under key per session
export const getGuestMessages = (): { role: string; content: string }[] => {
  try {
    const raw = localStorage.getItem('noor_guest_chat_msgs');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const saveGuestMessages = (msgs: { role: string; content: string }[]): void => {
  try { localStorage.setItem('noor_guest_chat_msgs', JSON.stringify(msgs)); } catch {}
};

// ── Logged-in (Supabase) ──

export const getTodayUserMsgCount = async (userId: string): Promise<number> => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('chat_logs')
    .select('messages')
    .eq('user_id', userId)
    .gte('created_at', today + 'T00:00:00Z');
  if (error || !data) return 0;
  let userMsgs = 0;
  for (const row of data) {
    const msgs: any[] = row.messages || [];
    userMsgs += msgs.filter(m => m.role === 'user').length;
  }
  return userMsgs;
};

export const getRemaining = async (userId: string | null): Promise<number> => {
  if (!userId) return Math.max(0, GUEST_LIMIT - getGuestCount());
  const used = await getTodayUserMsgCount(userId);
  return Math.max(0, DAILY_LIMIT - used);
};

export const canSend = async (userId: string | null): Promise<boolean> => {
  return (await getRemaining(userId)) > 0;
};

// ── CRUD ──

export const saveChat = async (opts: {
  userId?: string | null;
  email?: string;
  name?: string;
  messages: { role: string; content: string }[];
  chatId?: string | null;
}): Promise<string | null> => {
  const { userId, email, name, messages, chatId } = opts;
  if (!userId) return null;

  const payload = { messages, email: email || null, name: name || null, updated_at: new Date().toISOString() };

  if (chatId) {
    const { error } = await supabase.from('chat_logs').update(payload).eq('id', chatId);
    return error ? null : chatId;
  }

  const { data, error } = await supabase.from('chat_logs').insert({
    ...payload,
    user_id: userId,
  }).select('id').single();

  return error ? null : (data?.id || null);
};

export const getUserChats = async (userId: string): Promise<any[]> => {
  const { data } = await supabase
    .from('chat_logs')
    .select('id, email, name, created_at, updated_at, messages')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);
  return data || [];
};

export const getChatById = async (chatId: string): Promise<any> => {
  const { data } = await supabase
    .from('chat_logs')
    .select('*')
    .eq('id', chatId)
    .single();
  return data;
};

export const deleteChat = async (chatId: string): Promise<boolean> => {
  const { error } = await supabase.from('chat_logs').delete().eq('id', chatId);
  return !error;
};

// ── Admin ──

export const getAllChats = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('chat_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) console.error('getAllChats error:', error);
  return data || [];
};
