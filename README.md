<div align="center">
  <img src="public/logo.png" alt="Noor Al-Islam" width="120" height="120" style="border-radius:24px" />
  <h1 align="center" style="font-size:3rem;font-weight:900;background:linear-gradient(135deg,#10b981,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0">نور الإسلام</h1>
  <h3 align="center" style="color:#94a3b8;font-weight:600;margin-top:4px">Noor Al-Islam — Your Complete Islamic Companion</h3>
  <p align="center">
    <a href="https://discord.com/users/1416151331965767810"><img src="https://img.shields.io/badge/Join_Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" /></a>
    <a href="https://x.com/Moh_HSG"><img src="https://img.shields.io/badge/Follow_on_X-000000?style=for-the-badge&logo=x&logoColor=white" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" /></a>
  </p>
  <br />
  <img src="public/logo.png" alt="Banner" width="100%" style="border-radius:16px;border:1px solid rgba(255,255,255,0.1)" />
  <br /><br />
</div>

---

## ✨ Overview

**Noor Al-Islam** is a cutting-edge, feature-rich Islamic web application built with **React**, **TypeScript**, and **Vite**. It serves as a comprehensive digital companion for Muslims worldwide, combining traditional Islamic practices with modern technology.

Whether you want to read the **Holy Qur'an**, track your **daily Azkar**, join **challenge competitions**, find **prayer times**, or learn through **AI-powered tutoring** — Noor Al-Islam has you covered with a seamless, beautiful, and responsive experience.

---

## 🚀 Key Features

### 📖 **Qur'an Reader**
- Full Qur'an with 604 pages, beautifully rendered with Arabic script
- **Auto-tracking**: Every page read is automatically recorded to your active challenges
- **Surat Al-Kahf Friday tracking**: Automatic detection of Friday reading with point rewards/penalties
- **Anti-cheat system**: Smart detection prevents abuse with progressive warnings and bans
- **Celebration modal**: Confetti animation when you complete a khatma challenge

### 🏆 **Challenge & Competition System**
| Feature | Description |
|---------|-------------|
| **Khatma Challenges** | Finish the full Qur'an or specific Juz with page-range validation |
| **Azkar Challenges** | Track morning, evening, sleep, post-prayer, and ruqyah azkar daily |
| **Tasbeeh Challenges** | Complete tasbeeh targets (33, 100, 300, or custom) |
| **Tier System** | `Major` (max 1 active) + `Minor` (max 2 active) challenges simultaneously |
| **Daily Quiz** | 300+ Islamic questions with daily rotation and 50-point rewards |
| **Weekly Competitions** | Join weekly contests and climb the leaderboard |
| **Leaderboard** | Top 10 users ranked by total points with profile avatars |
| **Achievements** | Level progression, badges, streak tracking |

### ☀️ **Azkar & Tasbeeh (أذكار وتسبيح)**
- **Hisn Muslim integration**: Fetches authentic azkar from the Hisn Muslim API
- **Per-dhikr tracking**: Every individual dhikr is saved immediately to the database
- **Category completion**: Auto-marks categories as complete when all dhikrs are read
- **5 Azkar Types**: Morning, Evening, Sleep, Post-Prayer, and Ruqyah — each with dedicated challenge progress
- **Smart counter**: Tap anywhere on the card to increment; auto-completion detection
- **Swipe navigation**: Swipe left/right to move between dhikr items
- **Tasbeeh counter**: Circular progress ring with lap tracking and auto-save to challenges
- **Daily progress**: See today's completed azkar and tasbeeh counts at a glance

### 🕌 **Prayer Times**
- Accurate prayer times based on your location (GPS or manual city/country)
- Next prayer countdown with visual indicator
- Multiple calculation methods (MWL, ISNA, Egypt, Umm Al-Qura, etc.)

### 🤖 **AI Qur'an Tutor**
- Powered by Google's Gemini AI
- Ask any question about verses, tafsir, or Islamic concepts
- Context-aware responses with Qur'anic references

### 📚 **Additional Modules**
- **Hadith Library**: Browse authentic hadith collections
- **Fatwa Library**: Search Islamic rulings by topic
- **Mosque Finder**: Locate nearby mosques on a map
- **Qibla Compass**: Accurate qibla direction finder
- **Planner**: Create customized Qur'an memorization plans
- **Islamic Radio**: Stream live Qur'an radio stations
- **Remix**: Creative Islamic content remixing tool

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS 3, Motion (Framer Motion) |
| **Icons** | Lucide React |
| **Backend** | Supabase (PostgreSQL, Auth, RLS) |
| **AI** | Google Gemini API |
| **Charts** | Recharts |
| **Email** | EmailJS |

</div>

---

## 🏗️ Project Structure

```
noor-al-islam/
├── App.tsx                    # Root app with routing & state
├── index.tsx                  # Entry point
├── supabaseClient.ts          # Supabase configuration
├── types.ts                   # TypeScript interfaces & enums
├── components/                # React components
│   ├── Azkar.tsx              # Azkar & tasbeeh reader with challenge integration
│   ├── Competitions.tsx       # Full challenge system UI
│   ├── QuranList.tsx          # Qur'an reader with auto-tracking
│   ├── PrayerTimes.tsx        # Prayer times calculator
│   ├── Dashboard.tsx          # Main dashboard
│   └── ...                    # 30+ other components
├── services/                  # Business logic & API
│   ├── challengeService.ts    # Challenge CRUD, tracking, leaderboard
│   ├── competitionService.ts  # Weekly competitions
│   ├── dailyQuestionsService.ts # Quiz engine (300+ questions)
│   └── ...
├── data/                      # Static data
│   ├── questions_bank.json    # 300+ Islamic quiz questions
│   └── ...
├── public/                    # Static assets
│   ├── logo.png
│   ├── stickers/              # Achievement stickers
│   └── ...
├── competitions_schema.sql    # DB schema for challenges
├── challenges_seed.sql        # 13 pre-defined challenges
├── fix_all_tracking.sql       # RLS policies & migrations
├── fix_challenge_pages.sql    # Page range columns
└── ...
```

---

## 🎯 Challenge System Deep Dive

### Challenge Categories

| Category | Type | Simultaneous Limit | Examples |
|----------|------|-------------------|----------|
| **Khatma** | `major` | 1 active | Full Qur'an (30 days, 604 pages) |
| **Khatma** | `minor` | 2 active | Juz Tabarak, Juz Amma, Surat Al-Kahf |
| **Azkar** | — | Unlimited* | Morning/Evening, Sleep, Post-Prayer, Ruqyah |
| **Tasbeeh** | — | 1 active | Daily Tasbeeh (1000), Salawat upon Prophet |

*Each azkar type has its own challenge — you can have all 4 active simultaneously.

### Challenge Completion Flow

```
User reads a page
        ↓
recordPageRead() validates page range
        ↓
Updates ALL matching active khatma challenges
        ↓
Awards 10 base points + challenge reward on completion
        ↓
Inserts reading_logs entry
```

### Azkar Tracking Flow

```
User taps dhikr counter
        ↓
handleIncrement() fires IMMEDIATELY
        ↓
recordAzkarItem() saves individual dhikr to activity_logs
        ↓
When all items in category complete → recordAzkarCompletion()
        ↓
Matches azkar type to active challenge → updates progress
        ↓
Awards 50 points + challenge reward on completion
```

---

## 📊 Pre-loaded Challenges

| # | Challenge | Category | Days | Target | Points | Tier |
|---|-----------|----------|------|--------|--------|------|
| 1 | ختمة القرآن الكريم | khatma | 30 | 604 pages | 1000 | major |
| 2 | جزء تبارك | khatma | 7 | 20 pages | 200 | minor |
| 3 | جزء عم | khatma | 7 | 37 pages | 250 | minor |
| 4 | سورة الكهف كل جمعة | khatma | 30 | 16 pages (Fri only) | 350 | major |
| 5 | تدبر آيات القرآن | khatma | 14 | 14 pages | 300 | minor |
| 6 | أذكار الصباح والمساء | azkar | 30 | 60 completions | 500 | — |
| 7 | أذكار النوم | azkar | 30 | 30 completions | 300 | — |
| 8 | أذكار بعد الصلاة | azkar | 14 | 70 completions | 250 | — |
| 9 | الرقية الشرعية | azkar | 7 | 14 completions | 200 | — |
| 10 | التسبيح اليومي (١٠٠٠) | tasbeeh | 30 | 30,000 tasbeeh | 500 | — |
| 11 | الصلاة على النبي ﷺ | tasbeeh | 30 | 3,000 salawat | 400 | — |
| 12 | الاستغفار | tasbeeh | 21 | 10,500 istighfar | 350 | — |
| 13 | سبحان الله وبحمده | tasbeeh | 14 | 2,800 tasbeeh | 250 | — |

---

## 🚦 Getting Started

### Prerequisites
- **Node.js** >= 18
- **npm** >= 9
- **Supabase** account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/HSG6/Noor-Al-Islam.git
cd Noor-Al-Islam
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Database Setup

Run these SQL files **in order** in your Supabase SQL Editor:

| File | Purpose |
|------|---------|
| `competitions_schema.sql` | Creates all tables (challenges, user_challenges, activity_logs, etc.) |
| `challenges_seed.sql` | Inserts the 13 pre-defined challenges |
| `fix_challenge_pages.sql` | Adds page-range & tier columns |
| `fix_all_tracking.sql` | Adds points columns & RLS policies |

### 4. Run

```bash
npm run dev
```

The app will be available at **http://localhost:3001**

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📱 Pages & Routes

| Page | Component | Description |
|------|-----------|-------------|
| 🏠 **Home** | `Dashboard` | Overview with quick actions |
| 📖 **Qur'an** | `QuranList` | Read & track pages |
| ☀️ **Azkar** | `Azkar` | Morning/evening/sleep/ruqyah azkar |
| 🏆 **Competitions** | `Competitions` | Join & track challenges |
| 🕌 **Prayer Times** | `PrayerTimes` | Accurate prayer schedule |
| 🧭 **Qibla** | `Qibla` | Qibla direction finder |
| 🗺️ **Mosques** | `MosqueFinder` | Nearby mosque locator |
| 🤖 **AI Tutor** | `AITutor` | AI-powered Qur'an learning |
| 📚 **Hadith** | `HadithLibrary` | Browse hadith collections |
| 📜 **Fatwa** | `FatwaLibrary` | Islamic rulings |
| 📅 **Planner** | `Planner` | Memorization planning |
| 📻 **Radio** | `Radio` | Live Qur'an radio |
| 🎨 **Remix** | `Remix` | Islamic content remix |
| 👤 **Profile** | `Profile` | User settings & stats |
| 🔧 **Admin** | `Admin` | Management dashboard |

---

## 🔐 RLS Policies

The app uses **Row Level Security** on Supabase. Key policies:

| Table | Policy | Rule |
|-------|--------|------|
| `activity_logs` | INSERT | `auth.uid() = user_id` |
| `activity_logs` | SELECT | `auth.uid() = user_id` |
| `reading_logs` | INSERT | `auth.uid() = user_id` |
| `user_challenges` | SELECT/INSERT/UPDATE | `auth.uid() = user_id` |
| `challenges` | SELECT | `true` (public) |

Run `fix_all_tracking.sql` to apply all policies.

---

## 🧪 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at :3001 |
| `npm run build` | Build for production |
| `npm run lint` | TypeScript type checking |
| `npm run preview` | Preview production build |
| `npm run deploy` | Quick git push (customize first) |

---

## 🤝 Contributing

Contributions are warmly welcomed! Here's how:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing`)
5. **Open** a Pull Request

Please ensure your code passes `npm run lint` before submitting.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Built With

- The Holy Qur'an API
- Hisn Muslim API for authentic azkar
- Google Gemini AI for intelligent tutoring
- Supabase for scalable backend
- OpenStreetMap for mosque locations
- AllMuslim prayer times calculation

---

<div align="center">
  <br />
  <img src="public/icon.png" width="48" height="48" style="border-radius:12px" />
  <br />
  <strong>نور الإسلام — Noor Al-Islam</strong>
  <br />
  <em>Light of Islam — guiding hearts, empowering minds.</em>
  <br /><br />
  <p>
    Built with ❤️ by <strong>HSG</strong> for the Ummah
    <br />
    <a href="https://discord.com/users/1416151331965767810">💬 Join Discord</a>
    ·
    <a href="https://x.com/Moh_HSG">🐦 Follow on X</a>
  </p>
  <br />
</div>
