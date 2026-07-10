import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { listSurahs, listReciters, getSurahAyahs } from './quranClient';
import { searchBackgroundVideos } from './pexelsClient';
import { listOutros } from './outros';
import { createJob, runGenerateJob, getJob, GENERATED_DIR, assertAllowedDownloadUrl } from './ffmpegJob';
import {
  durationToAyahCount, pickSmartPassage, pickSmartReciter,
  getBackgroundKeywords, FEATURED_RECITERS,
} from './aiPicker';

const app = express();
app.use(cors());
app.use(express.json());

const router = express.Router();

// Basic per-IP rate limit for the expensive /generate endpoint.
const generateHits = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 6;
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (generateHits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  generateHits.set(ip, hits);
  return hits.length > RATE_LIMIT_MAX;
}

router.get('/health', (_req, res) => res.json({ ok: true }));

router.get('/surahs', async (_req, res) => {
  try {
    res.json(await listSurahs());
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/reciters', async (_req, res) => {
  try {
    res.json(await listReciters());
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/surah/:number/ayahs', async (req, res) => {
  try {
    const number = parseInt(req.params.number, 10);
    res.json(await getSurahAyahs(number));
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/backgrounds', async (req, res) => {
  try {
    const query = String(req.query.query || 'nature');
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    res.json(await searchBackgroundVideos(query, 15, page));
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/outros', (_req, res) => {
  res.json(listOutros().map((o) => ({ id: o.id, label: o.label })));
});

// ── New: featured reciters list ──────────────────────────────────────────────
router.get('/featured-reciters', (_req, res) => {
  res.json(FEATURED_RECITERS);
});

// ── New: smart background – given surah + ayah range, pick the best Pexels bg ─
router.get('/smart-background', async (req, res) => {
  try {
    const surahNum = parseInt(String(req.query.surah || '0'), 10);
    const start    = parseInt(String(req.query.start  || '1'), 10);
    const end      = parseInt(String(req.query.end    || '1'), 10);

    let query = 'nature peaceful landscape serene';

    if (surahNum > 0 && surahNum <= 114) {
      try {
        const { ayahs } = await getSurahAyahs(surahNum);
        const slice = ayahs.filter((a) => a.numberInSurah >= start && a.numberInSurah <= end);
        const combined = slice.map((a) => a.text).join(' ');
        query = getBackgroundKeywords(combined);
      } catch { /* fall back to default query */ }
    }

    const videos = await searchBackgroundVideos(query, 8, 1);
    if (!videos.length) return res.status(404).json({ error: 'لم يُعثر على خلفية مناسبة' });
    const pick = videos[Math.floor(Math.random() * Math.min(4, videos.length))];
    res.json({ ...pick, query });
  } catch (err: any) {
    res.status(502).json({ error: err.message });
  }
});

// ── New: full AI auto-pick (surah + reciter + background) ────────────────────
router.post('/ai-pick', async (req, res) => {
  try {
    const rawDuration = Number(req.body?.durationSeconds);
    const durationSeconds = rawDuration >= 10 && rawDuration <= 300 ? rawDuration : 60;
    const targetAyahs = durationToAyahCount(durationSeconds);
    const passage  = pickSmartPassage(targetAyahs);
    const reciter  = pickSmartReciter();

    let background = null;
    try {
      const videos = await searchBackgroundVideos(passage.backgroundQuery, 6, 1);
      if (videos.length) {
        background = videos[Math.floor(Math.random() * Math.min(4, videos.length))];
      }
    } catch { /* background is optional – client shows error if null */ }

    res.json({ passage, reciter, background, durationSeconds });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    if (isRateLimited(req.ip || 'unknown')) {
      return res.status(429).json({ error: 'عدد كبير من الطلبات، حاول لاحقاً' });
    }
    const { surahNumber, startAyah, endAyah, reciterEdition, backgroundVideoUrl, outroId, fontSize } = req.body || {};

    const isPosInt = (v: any) => Number.isInteger(v) && v > 0;
    if (!isPosInt(surahNumber) || surahNumber > 114) return res.status(400).json({ error: 'رقم سورة غير صالح' });
    if (!isPosInt(startAyah) || !isPosInt(endAyah) || endAyah < startAyah) return res.status(400).json({ error: 'نطاق آيات غير صالح' });
    if (endAyah - startAyah + 1 > 50) return res.status(400).json({ error: 'الحد الأقصى 50 آية لكل فيديو' });
    if (typeof reciterEdition !== 'string' || !/^[a-z.]+$/i.test(reciterEdition) || reciterEdition.length > 60) {
      return res.status(400).json({ error: 'قارئ غير صالح' });
    }
    if (typeof backgroundVideoUrl !== 'string') return res.status(400).json({ error: 'رابط الخلفية مفقود' });
    try {
      assertAllowedDownloadUrl(backgroundVideoUrl);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
    if (!listOutros().some((o) => o.id === outroId)) return res.status(400).json({ error: 'خاتمة غير صالحة' });
    const safeFontSize = isPosInt(fontSize) && fontSize >= 24 && fontSize <= 160 ? fontSize : undefined;

    const availableReciters = await listReciters();
    if (!availableReciters.some((r) => r.identifier === reciterEdition)) {
      return res.status(400).json({ error: 'القارئ المحدد غير متاح' });
    }

    const job = createJob();
    res.json({ jobId: job.id });
    runGenerateJob(job, { surahNumber, startAyah, endAyah, reciterEdition, backgroundVideoUrl, outroId, fontSize: safeFontSize });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.json({ status: job.status, progress: job.progress, message: job.message, error: job.error, ready: job.status === 'done' });
});

router.get('/download/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job || job.status !== 'done' || !job.resultFile) return res.status(404).json({ error: 'not ready' });
  res.download(job.resultFile, `quran-reel-${job.id}.mp4`);
});

app.use('/api/reels', router);

// Serve generated videos for direct <video> preview
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });
app.use('/reels-media', express.static(GENERATED_DIR));

const PORT = process.env.REELS_SERVER_PORT ? parseInt(process.env.REELS_SERVER_PORT, 10) : 8787;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[reels-server] listening on port ${PORT}`);
});
