
import { supabase } from '../supabaseClient';

export interface CompetitionUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  total_points: number;
  streak_days: number;
  badges_array: string[];
  last_login: string;
  last_quiz_date?: string;
  last_submission_date?: string;
  active_challenges?: UserChallenge[];
}

export interface Quiz {
  id: string;
  date: string;
  question_text: string;
  media_url?: string;
  type: 'text' | 'image' | 'audio';
  options_array: string[];
  correct_answer_index: number;
  created_by?: string;
  creator_name?: string;
}

export interface UserChallenge {
  type: 'quran' | 'tasbih';
  targetId: number; // Part number for Quran, count for Tasbih
  isCompleted: boolean;
  startDate: string;
}

// User Profile Management
export const getUserProfile = async (userId: string): Promise<CompetitionUser | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data as CompetitionUser;
};

// Quiz Management
export const getDailyQuiz = async (): Promise<Quiz | null> => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_quizzes')
    .select('*')
    .eq('date', today)
    .single();
  
  if (error) {
    console.error('Error fetching daily quiz:', error);
    return null;
  }
  return data as Quiz;
};

export const submitQuizAnswer = async (userId: string, points: number, isCorrect: boolean) => {
  const today = new Date().toISOString().split('T')[0];

  if (isCorrect) {
    // Fetch current points first to increment safely
    const { data: user } = await supabase
      .from('users')
      .select('total_points, streak_days')
      .eq('id', userId)
      .single();

    if (user) {
      const { error } = await supabase
        .from('users')
        .update({
          total_points: user.total_points + points,
          last_quiz_date: today,
          streak_days: user.streak_days + 1
        })
        .eq('id', userId);

      if (error) console.error('Error updating score:', error);
    }
  }
};

// Leaderboard Real-time Listener
export const subscribeToLeaderboard = (callback: (data: any[]) => void) => {
  // Initial fetch
  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(50);
    if (data) callback(data);
  };

  fetchLeaderboard();

  // Subscribe to changes
  const subscription = supabase
    .channel('public:users')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
      fetchLeaderboard(); // Refresh on any change
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

// User Quiz Submission
export const submitUserQuiz = async (userId: string, userName: string, quizData: Omit<Quiz, 'id' | 'created_by' | 'creator_name'>) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Check last submission date
  const { data: user } = await supabase
    .from('users')
    .select('last_submission_date, total_points')
    .eq('id', userId)
    .single();

  if (user && user.last_submission_date) {
    const lastDate = new Date(user.last_submission_date);
    const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 2) {
      throw new Error("يمكنك إضافة فزورة واحدة كل يومين فقط.");
    }
  }

  const { error } = await supabase
    .from('daily_quizzes')
    .insert({
      ...quizData,
      created_by: userId,
      creator_name: userName,
      created_at: new Date().toISOString()
    });

  if (error) throw error;

  // Reward user
  if (user) {
    await supabase
      .from('users')
      .update({
        last_submission_date: today,
        total_points: user.total_points + 50
      })
      .eq('id', userId);
  }
};

// Challenge Management
export const startChallenge = async (userId: string, challenge: UserChallenge) => {
  const { data: user } = await supabase
    .from('users')
    .select('active_challenges')
    .eq('id', userId)
    .single();

  if (user) {
    const currentChallenges = user.active_challenges || [];
    const updatedChallenges = [...currentChallenges, { ...challenge, startDate: new Date().toISOString() }];
    
    await supabase
      .from('users')
      .update({ active_challenges: updatedChallenges })
      .eq('id', userId);
  }
};

export const completeChallenge = async (userId: string, challengeType: string, targetId: number) => {
  const { data: user } = await supabase
    .from('users')
    .select('active_challenges, total_points, badges_array')
    .eq('id', userId)
    .single();
  
  if (user) {
    const challenges = user.active_challenges || [];
    const updatedChallenges = challenges.map((c: any) => 
      (c.type === challengeType && c.targetId === targetId) ? { ...c, isCompleted: true } : c
    );
    
    const newBadge = challengeType === 'quran' ? `ختمة جزء ${targetId}` : 'بطل التسبيح';
    const updatedBadges = [...(user.badges_array || []), newBadge];

    await supabase
      .from('users')
      .update({
        active_challenges: updatedChallenges,
        total_points: user.total_points + 100,
        badges_array: updatedBadges
      })
      .eq('id', userId);
  }
};
