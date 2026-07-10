import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';
import { getAyahAudio, type AyahAudio } from './quranClient';
import { getOutroPath } from './outros';

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
  backgroundVideoUrl: string;
  outroId: string;
  fontSize?: number;
  fontColor?: string; // ASS &HBBGGRR& will be derived
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

function buildAssFile(segments: { text: string; start: number; end: number }[], workDir: string, fontSize: number): string {
  const fontsDir = path.resolve('server/assets/fonts');
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Ayah,Amiri,${fontSize},&H00F5FFFF,&H000000FF,&H00104030,&HB0000000,1,0,0,0,100,100,0,0,1,4,2,2,60,60,140,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines = segments
    .map((s) => `Dialogue: 0,${formatAssTime(s.start)},${formatAssTime(s.end)},Ayah,,0,0,0,,${escapeAss(s.text)}`)
    .join('\n');
  const assPath = path.join(workDir, 'captions.ass');
  fs.writeFileSync(assPath, header + lines + '\n', 'utf-8');
  return assPath;
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

    // Compute per-ayah durations to time captions
    const durations: number[] = [];
    for (const f of audioFiles) durations.push(await getDuration(f));

    const segments: { text: string; start: number; end: number }[] = [];
    let cursor = 0;
    for (let i = 0; i < ayahAudios.length; i++) {
      segments.push({ text: ayahAudios[i].text, start: cursor, end: cursor + durations[i] });
      cursor += durations[i];
    }
    const totalAudioDuration = cursor;

    // Concat audio (mp3 -> concat demuxer needs a list file; re-encode to be safe)
    job.status = 'rendering';
    job.message = 'دمج الصوت...';
    job.progress = 35;
    const concatListPath = path.join(workDir, 'audio-list.txt');
    fs.writeFileSync(concatListPath, audioFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
    const mergedAudio = path.join(workDir, 'merged-audio.m4a');
    await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatListPath, '-c:a', 'aac', '-b:a', '192k', mergedAudio]);

    // Download background video
    job.message = 'تحميل الخلفية...';
    job.progress = 45;
    const bgPath = path.join(workDir, 'background.mp4');
    await downloadFile(opts.backgroundVideoUrl, bgPath);

    // Build captions
    const assPath = buildAssFile(segments, workDir, opts.fontSize || 78);

    // Compose: loop/trim background to audio duration, scale to 1080x1920, burn captions, mux audio
    job.message = 'تركيب الفيديو والترجمة...';
    job.progress = 60;
    const mainClip = path.join(workDir, 'main.mp4');
    const fontsDir = path.resolve('server/assets/fonts');
    const vf = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,ass=${assPath.replace(/:/g, '\\:')}:fontsdir=${fontsDir.replace(/:/g, '\\:')}`;
    await run('ffmpeg', [
      '-y',
      '-stream_loop', '-1', '-i', bgPath,
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
