import { DAILY_QUESTIONS, DailyQuestion } from '../data/dailyQuestions';
import { supabase } from '../supabaseClient';

const START_DATE = new Date('2025-01-01');
const TOTAL = DAILY_QUESTIONS.length;
// ── Helper: deterministic UUID from a string ──

function strToUuid(input: string): string {
  const hex = input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').padEnd(32, '0').slice(0, 32);
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-8${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

// ── Daily question index ──

export function getTodayQuestionIndex(): number {
  const now = new Date();
  const diff = Math.floor((now.getTime() - START_DATE.getTime()) / (1000 * 3600 * 24));
  return diff % TOTAL;
}

export function getTodayQuestion(): DailyQuestion {
  return DAILY_QUESTIONS[getTodayQuestionIndex()];
}

export function getQuestionCycle(): { total: number; current: number; dayNumber: number } {
  const idx = getTodayQuestionIndex();
  return { total: TOTAL, current: idx + 1, dayNumber: idx + 1 };
}

export function getAutoQuizId(questionId: number): string {
  return strToUuid(`auto_daily_${questionId}`);
}

// ── Ensure auto question exists in daily_quizzes table ──

async function ensureDailyQuizExists(question: DailyQuestion): Promise<string> {
  const quizId = getAutoQuizId(question.id);
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('daily_quizzes')
    .select('id')
    .eq('id', quizId)
    .maybeSingle();

  if (existing) return quizId;

  const { error } = await supabase
    .from('daily_quizzes')
    .insert({
      id: quizId,
      date: today,
      question_text: question.q,
      options_array: question.o,
      correct_answer_index: question.c,
      type: 'text',
    });

  if (error) {
    const { data: fallback } = await supabase
      .from('daily_quizzes')
      .select('id')
      .eq('date', today)
      .maybeSingle();
    if (fallback) return fallback.id;
  }

  return quizId;
}

// ── Answer tracking in Supabase ──

export async function getTodaysQuizWithAnswer(userId: string | null): Promise<{
  question: DailyQuestion;
  answered: boolean;
  isCorrect?: boolean;
  selectedAnswer?: number;
}> {
  const question = getTodayQuestion();
  const result: any = { question, answered: false };

  if (!userId) return result;

  const quizId = getAutoQuizId(question.id);
  await ensureDailyQuizExists(question);

  const { data: answer } = await supabase
    .from('quiz_answers')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .maybeSingle();

  if (answer) {
    result.answered = true;
    result.isCorrect = answer.is_correct;
    result.selectedAnswer = answer.selected_answer;
  }

  return result;
}

export async function submitAnswer(
  userId: string,
  questionId: number,
  selectedAnswer: number,
  correctIndex: number,
  points: number = 50
): Promise<{ isCorrect: boolean }> {
  const isCorrect = selectedAnswer === correctIndex;
  const quizId = getAutoQuizId(questionId);

  const { error } = await supabase.from('quiz_answers').insert({
    user_id: userId,
    quiz_id: quizId,
    selected_answer: selectedAnswer,
    is_correct: isCorrect,
  });

  if (error) throw error;

  if (isCorrect) {
    const { data: user } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({ total_points: (user.total_points || 0) + points })
        .eq('id', userId);
    }
  }

  return { isCorrect };
}
