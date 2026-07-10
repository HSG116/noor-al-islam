import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';
import { getAyahAudio, getAyahTranslation, getSurahMeta, type AyahAudio } from './quranClient';
import { getOutroPath } from './outros';
import { getBackgroundKeywords, splitAyahForDisplay, toEasternArabicNumeral } from './aiPicker';
import { searchMultipleBackgrounds } from './pexelsClient';

export type JobStatus = 'queued' | 'fetching' | 'rendering' | 'done' | 'error';

export interface Job {
  id: string;
  status: JobStatus;
  progress: number; // 0-100
  message: string;
  resultFile?: string; // absolute path once done
  error?: string;
  createdAt: number;
}

export interface GenerateOptions {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  reciterEdition: string;
  backgroundVideoUrl: string; // fallback background if per-segment search is unavailable
  outroId: string;
  fontSize?: number;
  fontColor?: string; // reserved for future use
  showTranslation?: boolean;
}

const jobs = new Map<string, Job>();
export const GENERATED_DIR = path.resolve('server/generated');
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });

const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour retention for generated files/job records
const MAX_CONCURRENT_JOBS = 2;
let activeJobs = 0;
const pendingQueue: (() => void)[] = [];

function acquireSlot(): Promise<void> {
  if (activeJobs < MAX_CONCURRENT_JOBS) {
    activeJobs++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => pendingQueue.push(resolve));
}

function releaseSlot(): void {
  const next = pendingQueue.shift();
  if (next) next();
  else activeJobs = Math.max(0, activeJobs - 1);
}

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) {
      if (job.resultFile && fs.existsSync(job.resultFile)) {
        fs.rm(job.resultFile, () => {});
      }
      jobs.delete(id);
    }
  }
}, 10 * 60 * 1000).unref();

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    p.stderr.on('data', (d) => { stderr += d.toString(); });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}\n${stderr.slice(-2000)}`));
    });
  });
}

const ALLOWED_DOWNLOAD_HOSTS = ['videos.pexels.com', 'images.pexels.com', 'cdn.islamic.network'];
const MAX_DOWNLOAD_BYTES = 200 * 1024 * 1024; // 200MB safety cap per file
const DOWNLOAD_TIMEOUT_MS = 60_000;

export function assertAllowedDownloadUrl(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('رابط غير صالح');
  }
  if (parsed.protocol !== 'https:') throw new Error('يُسمح فقط بروابط HTTPS');
  if (!ALLOWED_DOWNLOAD_HOSTS.includes(parsed.hostname)) {
    throw new Error('مصدر الملف غير مسموح به');
  }
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  assertAllowedDownloadUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_DOWNLOAD_BYTES) {
      throw new Error('حجم الملف أكبر من الحد المسموح');
    }
    if (!res.body) throw new Error('استجابة فارغة أثناء التنزيل');
    const fileStream = fs.createWriteStream(destPath);
    let total = 0;
    for await (const chunk of res.body as any) {
      total += chunk.length;
      if (total > MAX_DOWNLOAD_BYTES) {
        fileStream.destroy();
        throw new Error('حجم الملف أكبر من الحد المسموح');
      }
      if (!fileStream.write(chunk)) await new Promise<void>((r) => fileStream.once('drain', () => r()));
    }
    await new Promise<void>((resolve, reject) => fileStream.end((err: any) => (err ? reject(err) : resolve())));
  } finally {
    clearTimeout(timer);
  }
}

async function getDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const p = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath]);
    let out = '';
    p.stdout.on('data', (d) => { out += d.toString(); });
    p.on('error', reject);
    p.on('close', () => resolve(parseFloat(out.trim()) || 0));
  });
}

function escapeAss(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\N').replace(/[{}]/g, '');
}

function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.round((seconds - Math.floor(seconds)) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

interface Segment {
  text: string;
  start: number; // seconds within full timeline
  end: number;   // seconds within full timeline
  bgQuery: string;
  surahNameArabic: string;
  ayahNumber: number; // numberInSurah, shown as the Quranic end-of-ayah ornament
  isLastPartOfAyah: boolean; // only the final split-part of an ayah carries the ۝ ornament
  translation?: string;
}

// Max text block width: ~65% of the 1080px canvas (per the "60-70%" spec),
// used to estimate how many lines a given ayah will wrap to at a given size.
const MAX_TEXT_WIDTH_PX = Math.round(1080 * 0.65);
// Rough average glyph width for Amiri Arabic (incl. diacritics) as a fraction
// of font size — used only to *estimate* wrap-line count, not to lay out text.
const AVG_GLYPH_WIDTH_RATIO = 0.42;

/**
 * Responsive typography: the ayah font size is derived continuously from how
 * many lines the ayah is estimated to wrap to at a reference size (which
 * itself comes from the ayah's character length), instead of a handful of
 * fixed buckets. One line loses no size, each extra line shaves a consistent
 * amount off the scale — so a 1-line ayah and a 6-line ayah both look
 * intentional and proportioned, never "huge" or "tiny".
 */
function computeFontSize(text: string, base: number): number {
  const len = Math.max(1, text.length);
  const charsPerLineAtBase = MAX_TEXT_WIDTH_PX / (base * AVG_GLYPH_WIDTH_RATIO);
  const estimatedLines = Math.max(1, Math.ceil(len / charsPerLineAtBase));
  const scale = 1.18 - 0.13 * (estimatedLines - 1);
  const clampedScale = Math.max(0.55, Math.min(1.05, scale));
  const size = Math.round(base * clampedScale);
  return Math.max(52, Math.min(118, size));
}

// Vertical anchor for the whole caption block — centered horizontally, and
// roughly vertically centered with a slight downward offset (per the updated
// professional Quran-reel layout). Every video uses the exact same anchor so
// the composition stays consistent.
const TEXT_ANCHOR_Y = Math.round(1920 * 0.52);
// Max text width: ~65% of the 1080px canvas, matching MAX_TEXT_WIDTH_PX.
const SIDE_MARGIN = Math.round((1080 - MAX_TEXT_WIDTH_PX) / 2);
// NOTE: The "Elgharib" font files supplied by the user (all 3 variants) are
// watermarked demo fonts — they silently replace ANY Arabic text with a fixed
// vendor watermark string ("تم تركيب الخط بواسطة ...") no matter what is
// rendered. Confirmed via direct font rendering test and matching file
// checksums across "different" uploads. They cannot be used until the user
// provides the real licensed files. Falling back to Amiri, a proper full
// Unicode Arabic typeface already bundled in the app.
const PRIMARY_FONT = 'Amiri';
const TRANSLATION_FONT = 'Inter';

function buildAssFile(segments: Segment[], workDir: string, baseFontSize: number, showTranslation: boolean): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 1
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Ayah,${PRIMARY_FONT},${baseFontSize},&H00FFFFFF,&H000000FF,&H00000000,&HB0000000,1,0,0,0,100,100,0,0,1,2,1,5,${SIDE_MARGIN},${SIDE_MARGIN},0,1
Style: Glow,${PRIMARY_FONT},${baseFontSize},&H00FFFFFF,&H000000FF,&H00FFFFFF,&H00000000,1,0,0,0,100,100,0,0,1,0,0,5,${SIDE_MARGIN},${SIDE_MARGIN},0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines: string[] = [];
  for (const s of segments) {
    const ayahFs = computeFontSize(s.text, baseFontSize);
    // Translation is 45%-55% of the ayah size per spec — use the midpoint (~50%).
    const translationFs = Math.round(ayahFs * 0.5);
    const surahFs = Math.round(ayahFs * 0.34);
    const gap14Fs = 11; // invisible spacer line tuned to approximate a 14px gap (ayah -> translation)
    const gap10Fs = 8;  // invisible spacer line tuned to approximate a 10px gap (translation -> surah name)
    const startT = formatAssTime(s.start);
    const endT = formatAssTime(s.end);
    // Fade-in + gentle scale-up (0.98 -> 1.0 over 500ms), then stays fully static — no bounce/rotation/shake.
    const animTag = `{\\an5\\pos(540,${TEXT_ANCHOR_Y})\\fad(180,120)\\fscx98\\fscy98\\t(0,500,\\fscx100\\fscy100)}`;
    const escapedAyah = escapeAss(s.text);

    // Quranic end-of-ayah ornament with the ayah number set INSIDE it (۝٣٩,
    // not ٣٩ ۝), appended immediately after the ayah text with no separating
    // space so it reads as part of the ayah rather than a separate element.
    // Sized ~70% of the ayah text per spec.
    const ornament = s.isLastPartOfAyah ? `{\\fs${Math.round(ayahFs * 0.7)}}۝${toEasternArabicNumeral(s.ayahNumber)}{\\fs${ayahFs}}` : '';

    const surahLine = `${s.surahNameArabic} • الآية ${toEasternArabicNumeral(s.ayahNumber)}`;

    let body = `{\\fs${ayahFs}\\b1}${escapedAyah}${ornament}`;
    if (showTranslation && s.translation) {
      body += `\\N{\\fs${gap14Fs}\\alpha&HFF&}.{\\alpha&H00&}`; // invisible spacer ≈14px
      body += `\\N{\\fs${translationFs}\\fn${TRANSLATION_FONT}\\b0\\c&HE6E6E6&\\alpha&H1A&\\bord0.8\\shad0.6}${escapeAss(s.translation)}`;
      body += `{\\fs${gap10Fs}\\alpha&HFF&}\\N.{\\alpha&H00&}`; // invisible spacer ≈10px
    } else {
      body += `\\N{\\fs${gap10Fs}\\alpha&HFF&}.{\\alpha&H00&}`;
    }
    body += `\\N{\\fs${surahFs}\\fn${PRIMARY_FONT}\\b0\\c&HDDDDDD&\\bord1\\shad0.6}${escapeAss(surahLine)}`;

    // Soft glow pass (drawn first / lower layer), gently blurred, low opacity white — a subtle, understated halo (not a strong effect).
    lines.push(`Dialogue: 0,${startT},${endT},Glow,,0,0,0,,${animTag}{\\blur5\\alpha&HD8&}${body}`);
    // Crisp main pass (drawn on top): pure white fill, black stroke, light shadow.
    lines.push(`Dialogue: 1,${startT},${endT},Ayah,,0,0,0,,${animTag}{\\bord2\\shad1\\blur0.3}${body}`);
  }
  const assPath = path.join(workDir, 'captions.ass');
  fs.writeFileSync(assPath, header + lines.join('\n') + '\n', 'utf-8');
  return assPath;
}

/** Build the per-segment reading timeline, splitting long ayahs into natural, readable chunks. */
function buildSegments(
  ayahAudios: AyahAudio[],
  durations: number[],
  surahNameArabic: string,
  translations: (string | undefined)[],
): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (let i = 0; i < ayahAudios.length; i++) {
    const ayahDuration = durations[i];
    const parts = splitAyahForDisplay(ayahAudios[i].text);
    const ayahNumber = ayahAudios[i].numberInSurah;
    const translation = translations[i];
    if (parts.length === 1) {
      segments.push({
        text: parts[0],
        start: cursor,
        end: cursor + ayahDuration,
        bgQuery: getBackgroundKeywords(parts[0]),
        surahNameArabic,
        ayahNumber,
        isLastPartOfAyah: true,
        translation,
      });
    } else {
      const totalChars = parts.reduce((n, p) => n + p.length, 0);
      let partCursor = cursor;
      for (let j = 0; j < parts.length; j++) {
        const share = parts[j].length / totalChars;
        const dur = j === parts.length - 1 ? (cursor + ayahDuration - partCursor) : ayahDuration * share;
        segments.push({
          text: parts[j],
          start: partCursor,
          end: partCursor + dur,
          bgQuery: getBackgroundKeywords(parts[j]),
          surahNameArabic,
          ayahNumber,
          isLastPartOfAyah: j === parts.length - 1,
          translation,
        });
        partCursor += dur;
      }
    }
    cursor += ayahDuration;
  }
  return segments;
}

const TRANSITION = 0.6; // seconds of cross-fade between backgrounds
const MIN_SEG_FOR_TRANSITION = 1.2;

/**
 * Build a single background video track that changes for every segment,
 * cross-fading smoothly between clips so the visuals feel calm and cinematic
 * rather than jarring hard cuts.
 */
async function buildBackgroundTrack(
  segments: Segment[],
  bgFiles: string[],
  workDir: string,
): Promise<string> {
  const n = segments.length;
  const useTransitions = n > 1 && segments.every((s) => s.end - s.start > MIN_SEG_FOR_TRANSITION);
  const overlap = useTransitions ? TRANSITION : 0;

  // Render each segment's background to an exact-duration, correctly framed clip.
  const clipPaths: string[] = [];
  for (let i = 0; i < n; i++) {
    const segDur = segments[i].end - segments[i].start;
    const clipDur = i < n - 1 && useTransitions ? segDur + overlap : segDur;
    const clipPath = path.join(workDir, `clip-${i}.mp4`);
    await run('ffmpeg', [
      '-y',
      '-stream_loop', '-1', '-i', bgFiles[i],
      '-t', String(clipDur),
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p',
      '-an',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
      clipPath,
    ]);
    clipPaths.push(clipPath);
  }

  if (n === 1) return clipPaths[0];

  if (!useTransitions) {
    // Segments too short for a nice cross-fade — simple hard-cut concat instead.
    const listPath = path.join(workDir, 'bg-concat-list.txt');
    fs.writeFileSync(listPath, clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
    const outPath = path.join(workDir, 'bg-track.mp4');
    await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath]);
    return outPath;
  }

  // Chain xfade transitions so the total output duration equals the sum of
  // segment durations exactly (each intermediate clip is padded by `overlap`
  // seconds to donate footage to the cross-fade).
  const inputs: string[] = [];
  clipPaths.forEach((p) => { inputs.push('-i', p); });

  let filter = '';
  let lastLabel = '[0:v]';
  let cumulative = segments[0].end - segments[0].start + overlap; // duration of clip 0
  for (let i = 1; i < n; i++) {
    const segDur = segments[i].end - segments[i].start;
    const clipDur = i < n - 1 ? segDur + overlap : segDur;
    const offset = cumulative - overlap;
    const outLabel = i === n - 1 ? '[vout]' : `[v${i}]`;
    filter += `${lastLabel}[${i}:v]xfade=transition=fade:duration=${overlap}:offset=${offset.toFixed(3)}${outLabel};`;
    cumulative = cumulative + clipDur - overlap;
    lastLabel = outLabel;
  }
  filter = filter.replace(/;$/, '');

  const outPath = path.join(workDir, 'bg-track.mp4');
  await run('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex', filter,
    '-map', '[vout]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
    '-pix_fmt', 'yuv420p',
    outPath,
  ]);
  return outPath;
}

export function createJob(): Job {
  const job: Job = { id: randomUUID(), status: 'queued', progress: 0, message: 'في قائمة الانتظار...', createdAt: Date.now() };
  jobs.set(job.id, job);
  return job;
}

export async function runGenerateJob(job: Job, opts: GenerateOptions) {
  await acquireSlot();
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reels-'));
  try {
    job.status = 'fetching';
    job.message = 'جلب الآيات والصوت...';
    job.progress = 5;

    const ayahCount = opts.endAyah - opts.startAyah + 1;
    if (ayahCount <= 0 || ayahCount > 50) throw new Error('نطاق الآيات غير صالح (الحد الأقصى 50 آية للفيديو الواحد)');

    const ayahAudios: AyahAudio[] = [];
    for (let i = opts.startAyah; i <= opts.endAyah; i++) {
      const a = await getAyahAudio(opts.surahNumber, i, opts.reciterEdition);
      ayahAudios.push(a);
      job.progress = 5 + Math.round((10 * (i - opts.startAyah + 1)) / ayahCount);
    }

    // Download each ayah's audio file
    const audioFiles: string[] = [];
    for (let i = 0; i < ayahAudios.length; i++) {
      const dest = path.join(workDir, `ayah-${i}.mp3`);
      await downloadFile(ayahAudios[i].audioUrl, dest);
      audioFiles.push(dest);
      job.progress = 15 + Math.round((15 * (i + 1)) / ayahAudios.length);
    }

    // Compute per-ayah durations to time captions and backgrounds
    const durations: number[] = [];
    for (const f of audioFiles) durations.push(await getDuration(f));

    const totalAudioDuration = durations.reduce((a, b) => a + b, 0);

    // Fetch surah name + English translations (used for the caption block below the ayah)
    const surahMeta = await getSurahMeta(opts.surahNumber);
    const showTranslation = opts.showTranslation !== false;
    let translations: (string | undefined)[] = [];
    if (showTranslation) {
      try {
        translations = await Promise.all(
          ayahAudios.map((a) => getAyahTranslation(opts.surahNumber, a.numberInSurah)),
        );
      } catch { translations = ayahAudios.map(() => undefined); }
    } else {
      translations = ayahAudios.map(() => undefined);
    }

    // Split long ayahs into natural, readable segments and build the timeline
    const segments = buildSegments(ayahAudios, durations, surahMeta.name, translations);

    // Concat audio (mp3 -> concat demuxer needs a list file; re-encode to be safe)
    job.status = 'rendering';
    job.message = 'دمج الصوت...';
    job.progress = 30;
    const concatListPath = path.join(workDir, 'audio-list.txt');
    fs.writeFileSync(concatListPath, audioFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
    const mergedAudio = path.join(workDir, 'merged-audio.m4a');
    await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatListPath, '-c:a', 'aac', '-b:a', '192k', mergedAudio]);

    // Pick a distinct, matching background per segment so the scenery changes
    // with the recitation instead of a single static clip for the whole reel.
    job.message = 'اختيار خلفيات مناسبة لكل آية...';
    job.progress = 40;
    let bgUrls: string[] = [];
    try {
      if (process.env.PEXELS_API_KEY) {
        const picks = await searchMultipleBackgrounds(segments.map((s) => s.bgQuery));
        bgUrls = picks.map((p) => p?.videoFile).filter(Boolean) as string[];
      }
    } catch { /* fall back below */ }
    if (bgUrls.length < segments.length) {
      // Pad missing entries with the caller-provided background so the video always renders.
      while (bgUrls.length < segments.length) bgUrls.push(opts.backgroundVideoUrl);
    }

    // Download each unique background once
    job.message = 'تحميل الخلفيات...';
    job.progress = 48;
    const urlToFile = new Map<string, string>();
    const bgFiles: string[] = [];
    for (let i = 0; i < bgUrls.length; i++) {
      const url = bgUrls[i];
      let file = urlToFile.get(url);
      if (!file) {
        file = path.join(workDir, `bg-src-${urlToFile.size}.mp4`);
        await downloadFile(url, file);
        urlToFile.set(url, file);
      }
      bgFiles.push(file);
    }

    // Build the changing, cross-faded background track matched to the segment timeline
    job.message = 'تركيب الخلفيات والانتقالات...';
    job.progress = 58;
    const bgTrack = await buildBackgroundTrack(segments, bgFiles, workDir);

    // Build captions: large centered ayah text (~55% height), translation + surah name below, glow + stroke
    const assPath = buildAssFile(segments, workDir, opts.fontSize || 96, showTranslation);

    // Compose: burn captions onto the background track, mux with audio
    job.message = 'تركيب الفيديو والترجمة...';
    job.progress = 68;
    const mainClip = path.join(workDir, 'main.mp4');
    const fontsDir = path.resolve('server/assets/fonts');
    const vf = `ass=${assPath.replace(/:/g, '\\:')}:fontsdir=${fontsDir.replace(/:/g, '\\:')}`;
    await run('ffmpeg', [
      '-y',
      '-i', bgTrack,
      '-i', mergedAudio,
      '-filter_complex', `[0:v]${vf}[v]`,
      '-map', '[v]', '-map', '1:a',
      '-t', String(totalAudioDuration),
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
      '-c:a', 'aac', '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      '-shortest',
      mainClip,
    ]);

    // Append outro
    job.message = 'إضافة الخاتمة...';
    job.progress = 85;
    const outroPath = getOutroPath(opts.outroId);
    if (!outroPath) throw new Error('الخاتمة المحددة غير موجودة');

    // Normalize outro to same format/resolution before concat
    const outroNorm = path.join(workDir, 'outro-norm.mp4');
    await run('ffmpeg', [
      '-y', '-i', outroPath,
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
      '-c:a', 'aac', '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      outroNorm,
    ]);

    const mainNorm = path.join(workDir, 'main-norm.mp4');
    await run('ffmpeg', ['-y', '-i', mainClip, '-vf', 'fps=30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', '-pix_fmt', 'yuv420p', mainNorm]);

    const finalConcatList = path.join(workDir, 'final-list.txt');
    fs.writeFileSync(finalConcatList, `file '${mainNorm}'\nfile '${outroNorm}'\n`);
    const outputPath = path.join(GENERATED_DIR, `${job.id}.mp4`);
    await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', finalConcatList, '-c', 'copy', outputPath]);

    job.status = 'done';
    job.progress = 100;
    job.message = 'اكتمل الفيديو!';
    job.resultFile = outputPath;
  } catch (err: any) {
    job.status = 'error';
    job.error = err?.message || String(err);
    job.message = 'حدث خطأ أثناء إنشاء الفيديو';
  } finally {
    fs.rm(workDir, { recursive: true, force: true }, () => {});
    releaseSlot();
  }
}
