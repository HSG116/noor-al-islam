
export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface UserProgress {
  id?: string;
  user_id: string;
  surah_id: number;
  status: 'not_started' | 'in_progress' | 'completed';
  last_ayah: number;
  updated_at?: string;
}

export enum ViewState {
  HOME = 'HOME',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  QURAN_LIST = 'QURAN_LIST',
  QURAN_READ = 'QURAN_READ',
  AI_TUTOR = 'AI_TUTOR',
  PLANNER = 'PLANNER',
  AZKAR = 'AZKAR',
  PRAYER_TIMES = 'PRAYER_TIMES',
  MOSQUES = 'MOSQUES',
  QIBLA = 'QIBLA',
  RADIO = 'RADIO',
  REMIX = 'REMIX',
  TASBIH = 'TASBIH',
  HADITH = 'HADITH',
  FATAWA = 'FATAWA',
  COMPETITIONS = 'COMPETITIONS'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// --- PRAYER TIMES ---
export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
}

export interface NextPrayerInfo {
  name: string;
  time: string;
  arabicName: string;
  timeLeft: string;
  isNext: boolean;
}

// --- PLANNER TYPES ---

export enum PlanStrategy {
  CAPACITY = 'CAPACITY', // I can do X pages per day
  DEADLINE = 'DEADLINE'  // I want to finish by Date Y
}

export enum PlanScopeType {
  FULL_QURAN = 'FULL_QURAN',
  CUSTOM_RANGE = 'CUSTOM_RANGE'
}

export interface MemorizationPlan {
  id: string;
  userId: string;
  startDate: string;
  targetEndDate: string; // Dynamic calculation result

  // Scope
  scopeType: PlanScopeType;
  startPage: number; // 1
  endPage: number;   // 604

  // Logic Inputs
  strategy: PlanStrategy;
  pagesPerDay: number; // For CAPACITY strategy
  offDays: number[]; // 0-6 (Sun-Sat)

  // Method
  memorizationStyle: string;
  lastPrayerCompleted: string; // NEW FIELD: 'NONE' | 'Fajr' | 'Dhuhr' ...
  city?: string;    // Added for guest prayer times
  country?: string; // Added for guest prayer times

  // Review Logic
  reviewEnabled: boolean;
  reviewRatio: number; // e.g. 5 pages review for 1 page new

  // Live Progress State
  currentPage: number; // The pointer
  completedPages: number;
  totalDaysElapsed: number;
  streak: number;

  // Emergency State
  backlogPages: number; // Accumulated debt
  lastActivityDate?: string;
}

export interface DayTask {
  date: string;
  isOffDay: boolean;
  newPages: { start: number; end: number } | null;
  reviewPages: { start: number; end: number } | null;
  isBacklog: boolean; // Is this task heavier due to compensation?
  isDone: boolean;
}
