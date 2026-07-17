import { spawn } from 'child_process';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
const ffprobePath = ffprobeStatic.path;
import { getAyahAudio, getSurahMeta, getAyahTranslation, listReciters, getAyahCodeV2, type AyahAudio, type QCFGlyph } from './quranClient';
import { getOutroPath } from './outros';
import { getBackgroundKeywords, splitAyahForDisplay, toEasternArabicNumeral, FEATURED_RECITERS } from './aiPicker';
import { searchMultipleBackgrounds } from './pexelsClient';

export type JobStatus = 'queued' | 'fetching' | 'rendering' | 'done' | 'error';

export interface JobOutput {
  quality: '1080p' | '720p' | '480p';
  path: string;
  sizeMb: number;
}

export interface Job {
  id: string;
  status: JobStatus;
  progress: number; // 0-100
  message: string;
  resultFile?: string; // absolute path once done (default 1080p)
  outputs?: JobOutput[];
  caption?: { title: string; description: string; hashtags: string };
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
  fontColor?: string;
  showTranslation?: boolean;
}

const jobs = new Map<string, Job>();
export const GENERATED_DIR = path.resolve('server/generated');
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });

const JOB_TTL_MS = 60 * 60 * 1000;
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
  const actualCmd = cmd === 'ffmpeg' ? (ffmpegPath || 'ffmpeg') : cmd;
  return new Promise((resolve, reject) => {
    const p = spawn(actualCmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
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
const MAX_DOWNLOAD_BYTES = 200 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 300_000;

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
    const p = spawn(ffprobePath || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath]);
    let out = '';
    p.stdout.on('data', (d) => { out += d.toString(); });
    p.on('error', reject);
    p.on('close', () => resolve(parseFloat(out.trim()) || 0));
  });
}

// ─── Segment & Layout Types ──────────────────────────────────────────────

export interface Segment {
  text: string;
  start: number;
  end: number;
  bgQuery: string;
  surahNameArabic: string;
  ayahNumber: number;
  isLastPartOfAyah: boolean;
  translation?: string;
  codeV2?: string;       // QCF2 glyph codes for this segment
  v2Page?: number;       // Mushaf page number (1-604) → QCF2{page}.ttf
}

// ─── SVG/PNG Text Overlay Generation (Fontkit-based) ─────────────────────
// Sharp's SVG renderer (librsvg) CANNOT load custom fonts via @font-face
// with base64 data URIs. So we use fontkit to convert QCF2 glyph codes
// into raw SVG <path> elements, bypassing font loading entirely.
// This guarantees pixel-perfect Mushaf rendering.

import * as fontkit from 'fontkit';

const FONTS_DIR = path.resolve('fontss/QCF2BSMLfonts');

// Cache loaded fontkit Font objects (much faster than re-parsing from disk)
const fontkitCache = new Map<number, any>();

function getQCFFont(pageNum: number): any {
  const cached = fontkitCache.get(pageNum);
  if (cached) return cached;
  const padded = String(pageNum).padStart(3, '0');
  const fontPath = path.join(FONTS_DIR, `QCF2${padded}.ttf`);
  let font: any;
  if (fs.existsSync(fontPath)) {
    font = fontkit.openSync(fontPath);
  } else {
    console.warn(`QCF2 font for page ${pageNum} not found, falling back to page 1`);
    font = fontkit.openSync(path.join(FONTS_DIR, 'QCF2001.ttf'));
  }
  fontkitCache.set(pageNum, font);
  return font;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Render a string of QCF2 glyph codes into SVG <path> elements using fontkit.
 * Returns the SVG markup and the total rendered width in pixels.
 * Fontkit applies bidi layout, returning glyphs in visual Left-to-Right order.
 * So we draw them left-to-right starting from (centerX - widthPx/2).
 */
function renderQCFToSvgPaths(
  text: string,
  font: any,
  fontSize: number,
  centerX: number,
  baselineY: number,
  fillColor: string,
): { svg: string; widthPx: number } {
  const run = font.layout(text);
  const scale = fontSize / font.unitsPerEm;

  // Calculate total advance width
  let totalAdvance = 0;
  for (let i = 0; i < run.glyphs.length; i++) {
    totalAdvance += run.positions[i].xAdvance;
  }
  const widthPx = totalAdvance * scale;

  // Fontkit returns glyphs in visual LTR order. Start from the left.
  let cursorX = centerX - widthPx / 2;

  let paths = '';
  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i];
    const pos = run.positions[i];
    const advancePx = pos.xAdvance * scale;

    const pathData = glyph.path?.toSVG();
    if (pathData && pathData.length >= 3) {
      // Font glyphs are in em units with Y going up, SVG Y goes down, so we flip Y
      const tx = cursorX + (pos.xOffset * scale);
      const ty = baselineY - (pos.yOffset * scale);

      paths += `<path d="${pathData}" transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale.toFixed(6)}, ${(-scale).toFixed(6)})" fill="${fillColor}" />\n`;
    }

    // Move cursor right for the next glyph
    cursorX += advancePx;
  }

  return { svg: paths, widthPx };
}

/**
 * Measure the pixel width of a QCF2 text string at a given font size.
 */
function measureQCFWidth(text: string, font: any, fontSize: number): number {
  const run = font.layout(text);
  const scale = fontSize / font.unitsPerEm;
  let totalAdvance = 0;
  for (let i = 0; i < run.glyphs.length; i++) {
    totalAdvance += run.positions[i].xAdvance;
  }
  return totalAdvance * scale;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) { current = w; continue; }
    if (current.length + w.length + 1 > maxChars) {
      lines.push(current);
      current = w;
    } else {
      current += ' ' + w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Choose an appropriate base Arabic font size based on glyph count.
 */
function computeArabicFontSize(glyphCount: number): number {
  if (glyphCount <= 4)   return 100;
  if (glyphCount <= 7)   return 85;
  if (glyphCount <= 10)  return 75;
  if (glyphCount <= 15)  return 65;
  if (glyphCount <= 20)  return 55;
  if (glyphCount <= 30)  return 45;
  return 40;
}

async function buildTextOverlays(
  segments: Segment[],
  workDir: string,
  width: number,
  height: number,
  showTranslation: boolean,
): Promise<{ textPaths: string[] }> {
  const textPaths: string[] = [];
  const MAX_TEXT_WIDTH = Math.round(width * 0.85);
  const topSafe = Math.round(height * 0.12);
  const bottomSafe = Math.round(height * 0.88);

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const hasQCF = !!(s.codeV2 && s.v2Page);

    // ── Determine Arabic font size and scale to fit single line ──
    let arabicFs: number;
    let arLine: string;
    let qcfFont: any = null;

    if (hasQCF) {
      qcfFont = getQCFFont(s.v2Page!);
      const glyphWords = s.codeV2!.trim().split(/\s+/);
      arabicFs = computeArabicFontSize(glyphWords.length);
      
      if (s.isLastPartOfAyah && glyphWords.length > 1) {
        const lastWord = glyphWords.pop();
        arLine = glyphWords.join(' ') + '      ' + lastWord;
      } else {
        arLine = s.codeV2!;
      }
      
      // Force single line: if it's too wide, scale font size down
      let w = measureQCFWidth(arLine, qcfFont, arabicFs);
      if (w > MAX_TEXT_WIDTH) {
        arabicFs = arabicFs * (MAX_TEXT_WIDTH / w);
      }
    } else {
      arabicFs = 72;
      const ornament = s.isLastPartOfAyah ? `   ۝${toEasternArabicNumeral(s.ayahNumber)}` : '';
      arLine = s.text + ornament;
      // Very rough estimation for fallback font
      const maxCharsAr = Math.floor((MAX_TEXT_WIDTH / arabicFs) * 2.0);
      if (arLine.length > maxCharsAr) {
        arabicFs = arabicFs * (maxCharsAr / arLine.length);
      }
    }

    const transFs = Math.max(22, Math.round(arabicFs * 0.35));
    const surahFs = Math.max(18, Math.round(arabicFs * 0.3));

    // ── Wrap Translation ──
    let trLines: string[] = [];
    if (showTranslation && s.translation) {
      const maxCharsTr = Math.floor((MAX_TEXT_WIDTH / transFs) * 2.2);
      trLines = wrapText(s.translation, maxCharsTr);
      if (trLines.length > 3) trLines = trLines.slice(0, 3); // max 3 lines
    }

    const surahText = `${s.surahNameArabic}  ·  الآية ${toEasternArabicNumeral(s.ayahNumber)}`;

    // ── Vertical Layout ──
    const gapArabicToTrans = Math.round(arabicFs * 0.35); // Closer gap!
    const transLineHeight = transFs * 1.5;
    const gapTransToSurah = Math.round(arabicFs * 0.35); // Closer gap!

    let currentYOffset = 0; // Arabic baseline
    
    let transBaselineY = 0;
    let surahBaselineY = 0;
    
    if (trLines.length > 0) {
      // arabicFs * 0.3 accounts for Arabic text descent
      currentYOffset += arabicFs * 0.3 + gapArabicToTrans + transFs; 
      transBaselineY = currentYOffset;
      currentYOffset += (trLines.length - 1) * transLineHeight;
    }
    
    // transFs * 0.3 accounts for English text descent
    currentYOffset += transFs * 0.3 + gapTransToSurah + surahFs;
    surahBaselineY = currentYOffset;
    
    // Total block metrics
    const blockTopOffset = -arabicFs * 0.85; // Approximate ascent of Arabic
    const blockBottomOffset = surahBaselineY + surahFs * 0.3; // Approximate descent of Surah text
    const totalContentHeight = blockBottomOffset - blockTopOffset;

    // Optical center (slightly above true center)
    const opticalY = Math.round(height * 0.46);
    let blockTop = Math.round(opticalY - totalContentHeight / 2);
    if (blockTop < topSafe) blockTop = topSafe;
    if (blockTop + totalContentHeight > bottomSafe) blockTop = bottomSafe - totalContentHeight;

    // ── Glassmorphism Box ──
    const padX = Math.round(arabicFs * 0.8);
    const padY = Math.round(arabicFs * 0.6);
    const boxW = MAX_TEXT_WIDTH + padX * 2;
    const boxH = totalContentHeight + padY * 2;
    const boxL = Math.round((width - boxW) / 2);
    const boxT = blockTop - padY;

    // Screen Baselines
    const arabicScreenY = blockTop - blockTopOffset;
    const transScreenY = arabicScreenY + transBaselineY;
    const surahScreenY = arabicScreenY + surahBaselineY;
    const centerX = width / 2;

    // ── Build SVG ──
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
          <feOffset dx="0" dy="3" />
          <feComponentTransfer><feFuncA type="linear" slope="0.65"/></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
          <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F5E6C8" />
          <stop offset="50%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#F5E6C8" />
        </linearGradient>
      </defs>
    `;

    // ── Arabic Quranic Text (rendered via fontkit paths) ──
    if (hasQCF && qcfFont) {
      const { svg: glowSvg } = renderQCFToSvgPaths(arLine, qcfFont, arabicFs, centerX, arabicScreenY, 'rgba(255,255,255,0.15)');
      svg += `<g transform="translate(0, 3)" filter="url(#glow)">${glowSvg}</g>\n`;
      
      const { svg: pathsSvg } = renderQCFToSvgPaths(arLine, qcfFont, arabicFs, centerX, arabicScreenY, 'url(#goldGrad)');
      svg += `<g filter="url(#shadow)">${pathsSvg}</g>\n`;
    } else {
      // Fallback: plain text with system Arabic font
      svg += `<text x="${centerX}" y="${arabicScreenY}" font-family="'Traditional Arabic', 'Amiri', serif" font-size="${arabicFs}" fill="white" text-anchor="middle" direction="rtl" filter="url(#shadow)">`;
      svg += `<tspan x="${centerX}">${escapeXml(arLine)}</tspan>`;
      svg += `</text>`;
    }

    // ── English Translation (system font — librsvg handles these fine) ──
    if (trLines.length > 0) {
      let tLines = '';
      trLines.forEach((l, idx) => {
        tLines += `<tspan x="${centerX}" dy="${idx === 0 ? 0 : transLineHeight}">${escapeXml(l)}</tspan>`;
      });
      svg += `<text x="${centerX}" y="${transScreenY}" font-family="'Inter', 'Open Sans', sans-serif" font-size="${transFs}" fill="rgba(255,255,255,0.85)" text-anchor="middle" direction="ltr" filter="url(#shadow)">${tLines}</text>\n`;
    }

    // ── Surah Info ──
    svg += `<text x="${centerX}" y="${surahScreenY}" font-family="'Traditional Arabic', 'Amiri', serif" font-size="${surahFs}" fill="rgba(255,255,255,0.6)" text-anchor="middle" direction="rtl" filter="url(#shadow)">${surahText}</text>\n`;

    svg += `</svg>`;

    const textPath = path.join(workDir, `text_${i}.png`);
    await sharp(Buffer.from(svg)).png().toFile(textPath);
    textPaths.push(textPath);
  }

  return { textPaths };
}

// ─── Segment Building ────────────────────────────────────────────────────

function buildSegments(
  ayahAudios: AyahAudio[],
  durations: number[],
  surahNameArabic: string,
  translations: (string | undefined)[],
  qcfGlyphs: QCFGlyph[],
): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  // Build a lookup map for QCF glyphs by ayah number
  const qcfMap = new Map<number, QCFGlyph>();
  for (const g of qcfGlyphs) {
    qcfMap.set(g.numberInSurah, g);
  }

  for (let i = 0; i < ayahAudios.length; i++) {
    const ayahDuration = durations[i];
    const parts = splitAyahForDisplay(ayahAudios[i].text);
    const ayahNumber = ayahAudios[i].numberInSurah;
    const translation = translations[i];
    const qcf = qcfMap.get(ayahNumber);

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
        codeV2: qcf?.codeV2,
        v2Page: qcf?.v2Page,
      });
    } else {
      // When splitting a long ayah, the full QCF code_v2 goes on the last part
      // and each part gets the same v2Page so the correct font is loaded.
      const totalChars = parts.reduce((n, p) => n + p.length, 0);
      let partCursor = cursor;

      // Split QCF glyphs proportionally across parts
      const allGlyphWords = qcf?.codeV2?.trim().split(/\s+/) || [];
      const totalGlyphWords = allGlyphWords.length;

      for (let j = 0; j < parts.length; j++) {
        const share = parts[j].length / totalChars;
        const dur = j === parts.length - 1 ? (cursor + ayahDuration - partCursor) : ayahDuration * share;

        // Split glyph words proportionally
        let partCodeV2: string | undefined;
        if (totalGlyphWords > 0) {
          const startWord = Math.round(j * totalGlyphWords / parts.length);
          const endWord = j === parts.length - 1
            ? totalGlyphWords
            : Math.round((j + 1) * totalGlyphWords / parts.length);
          partCodeV2 = allGlyphWords.slice(startWord, endWord).join(' ');
        }

        segments.push({
          text: parts[j],
          start: partCursor,
          end: partCursor + dur,
          bgQuery: getBackgroundKeywords(parts[j]),
          surahNameArabic,
          ayahNumber,
          isLastPartOfAyah: j === parts.length - 1,
          translation,
          codeV2: partCodeV2,
          v2Page: qcf?.v2Page,
        });
        partCursor += dur;
      }
    }
    cursor += ayahDuration;
  }
  return segments;
}

// ─── Background Video Track ──────────────────────────────────────────────

const TRANSITION = 0.6;
const MIN_SEG_FOR_TRANSITION = 1.2;

async function buildBackgroundTrack(
  segments: Segment[],
  bgFiles: string[],
  workDir: string,
): Promise<string> {
  const n = segments.length;
  const useTransitions = n > 1 && segments.every((s) => s.end - s.start > MIN_SEG_FOR_TRANSITION);
  const overlap = useTransitions ? TRANSITION : 0;

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
    const listPath = path.join(workDir, 'bg-concat-list.txt');
    fs.writeFileSync(listPath, clipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
    const outPath = path.join(workDir, 'bg-track.mp4');
    await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outPath]);
    return outPath;
  }

  const inputs: string[] = [];
  clipPaths.forEach((p) => { inputs.push('-i', p); });

  let filter = '';
  let lastLabel = '[0:v]';
  let cumulative = segments[0].end - segments[0].start + overlap;
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

// ─── Job Management ──────────────────────────────────────────────────────

export function createJob(): Job {
  const job: Job = { id: randomUUID(), status: 'queued', progress: 0, message: 'في قائمة الانتظار...', createdAt: Date.now() };
  jobs.set(job.id, job);
  return job;
}

// ─── Caption Generation ──────────────────────────────────────────────────

/** Map of surah themes/moods to fitting emojis */
const SURAH_EMOJIS: Record<string, string> = {
  'الفاتحة': '🤲', 'البقرة': '🌟', 'آل عمران': '💎', 'النساء': '⚖️', 'المائدة': '📜',
  'الأنعام': '🌿', 'الأعراف': '🏔️', 'الأنفال': '⚔️', 'التوبة': '🔥', 'يونس': '🌊',
  'هود': '⛰️', 'يوسف': '🌙', 'الرعد': '⛈️', 'إبراهيم': '🌳', 'الحجر': '🏜️',
  'النحل': '🐝', 'الإسراء': '✨', 'الكهف': '🕳️', 'مريم': '🌹', 'طه': '💫',
  'الأنبياء': '🕊️', 'الحج': '🕋', 'المؤمنون': '🙏', 'النور': '💡', 'الفرقان': '📖',
  'الشعراء': '🎭', 'النمل': '🐜', 'القصص': '📚', 'العنكبوت': '🕸️', 'الروم': '🏛️',
  'لقمان': '🧠', 'السجدة': '🤲', 'الأحزاب': '🛡️', 'سبأ': '🏰', 'فاطر': '🌌',
  'يس': '❤️', 'الصافات': '👼', 'ص': '👑', 'الزمر': '🌅', 'غافر': '🤲',
  'فصلت': '📜', 'الشورى': '🤝', 'الزخرف': '✨', 'الدخان': '🌫️', 'الجاثية': '⏳',
  'الأحقاف': '🏜️', 'محمد': '⚔️', 'الفتح': '🏆', 'الحجرات': '🏡', 'ق': '🌿',
  'الذاريات': '💨', 'الطور': '⛰️', 'النجم': '⭐', 'القمر': '🌙', 'الرحمن': '🌺',
  'الواقعة': '😨', 'الحديد': '⚙️', 'المجادلة': '💬', 'الحشر': '🏰', 'الممتحنة': '📋',
  'الصف': '🎖️', 'الجمعة': '🕌', 'المنافقون': '🎭', 'التغابن': '⚖️', 'الطلاق': '📜',
  'التحريم': '🔒', 'الملك': '👑', 'القلم': '🖊️', 'الحاقة': '💥', 'المعارج': '🪜',
  'نوح': '🚢', 'الجن': '👻', 'المزمل': '🌙', 'المدثر': '🔔', 'القيامة': '😱',
  'الإنسان': '🧬', 'المرسلات': '💨', 'النبأ': '📢', 'النازعات': '🌊', 'عبس': '😶',
  'التكوير': '☀️', 'الانفطار': '🌌', 'المطففين': '⚖️', 'الانشقاق': '🌅', 'البروج': '⭐',
  'الطارق': '🌟', 'الأعلى': '🙌', 'الغاشية': '😰', 'الفجر': '🌄', 'البلد': '🏙️',
  'الشمس': '☀️', 'الليل': '🌙', 'الضحى': '🌤️', 'الشرح': '💖', 'التين': '🫒',
  'العلق': '🩸', 'القدر': '✨', 'البينة': '📜', 'الزلزلة': '🌍', 'العاديات': '🐎',
  'القارعة': '💥', 'التكاثر': '💰', 'العصر': '⏰', 'الهمزة': '🗣️', 'الفيل': '🐘',
  'قريش': '🐪', 'الماعون': '🤲', 'الكوثر': '💧', 'الكافرون': '🚫', 'النصر': '🏆',
  'المسد': '🔥', 'الإخلاص': '💎', 'الفلق': '🌅', 'الناس': '🧑‍🤝‍🧑',
};

const INSPIRATIONAL_PHRASES = [
  'تلاوة تهز القلوب',
  'تلاوة خاشعة ومؤثرة',
  'من أجمل التلاوات',
  'تلاوة تريح النفس',
  'تلاوة تملأ القلب سكينة',
  'تلاوة مُبكية ومؤثرة',
  'من روائع التلاوات',
  'تلاوة تأخذك إلى عالم آخر',
];

function generateCaption(
  surahMeta: { name: string; englishName: string; number: number },
  reciterEdition: string,
  startAyah: number,
  endAyah: number,
  allReciters: any[]
): { title: string; description: string; hashtags: string } {
  // Find Arabic reciter name
  const featured = FEATURED_RECITERS.find(r => r.identifier === reciterEdition);
  const fromApi = allReciters.find(r => r.identifier === reciterEdition);
  const reciterName = featured?.arabicName || fromApi?.name || featured?.name || reciterEdition.replace('ar.', '').replace(/([A-Z])/g, ' $1').trim();

  // Surah name without ‎سورة prefix
  const surahClean = surahMeta.name.replace(/^سُورَةُ\s*/, '').replace(/^سورة\s*/, '');
  const emoji = SURAH_EMOJIS[surahClean] || '📖';
  const phrase = INSPIRATIONAL_PHRASES[Math.floor(Math.random() * INSPIRATIONAL_PHRASES.length)];

  const ayahRange = startAyah === endAyah ? `الآية ${startAyah}` : `الآيات ${startAyah}-${endAyah}`;

  const title = `${emoji} سورة ${surahClean} | ${phrase}`;
  const description = `${emoji} سورة ${surahClean} - ${ayahRange}\n🎙️ بصوت الشيخ ${reciterName}\n\n${phrase} 🤍\nاستمع وشارك الأجر ✨`;

  // 5 hashtags
  const surahTag = `#سورة_${surahClean.replace(/\s+/g, '_')}`;
  const reciterTag = `#${reciterName.replace(/\s+/g, '_')}`;
  const hashtags = `${surahTag} #قرآن_كريم ${reciterTag} #تلاوة #موقع_نور_الاسلام`;

  return { title, description, hashtags };
}

export async function runGenerateJob(job: Job, opts: GenerateOptions) {
  await acquireSlot();
  const workDir = fs.mkdtempSync(path.join(GENERATED_DIR, 'work-'));
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
      job.progress = 5 + Math.round((5 * (i - opts.startAyah + 1)) / ayahCount);
    }

    // Download each ayah's audio file
    const audioFiles: string[] = [];
    for (let i = 0; i < ayahAudios.length; i++) {
      const dest = path.join(workDir, `ayah-${i}.mp3`);
      await downloadFile(ayahAudios[i].audioUrl, dest);
      audioFiles.push(dest);
      job.progress = 10 + Math.round((10 * (i + 1)) / ayahAudios.length);
    }

    // Compute per-ayah durations
    const durations: number[] = [];
    for (const f of audioFiles) durations.push(await getDuration(f));
    const totalAudioDuration = durations.reduce((a, b) => a + b, 0);

    // Fetch surah name + English translations
    const [surahMeta, allReciters] = await Promise.all([
      getSurahMeta(opts.surahNumber),
      listReciters()
    ]);
    job.caption = generateCaption(surahMeta, opts.reciterEdition, opts.startAyah, opts.endAyah, allReciters);
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

    // Fetch QCF2 glyph data from Quran.com API
    job.message = 'جلب خطوط المصحف (QCF2)...';
    let qcfGlyphs: QCFGlyph[] = [];
    try {
      qcfGlyphs = await getAyahCodeV2(opts.surahNumber, opts.startAyah, opts.endAyah);
    } catch (err) {
      console.warn('Failed to fetch QCF2 glyphs, falling back to plain text:', err);
    }

    // Build segments
    const segments = buildSegments(ayahAudios, durations, surahMeta.name, translations, qcfGlyphs);

    // Concat audio
    job.status = 'rendering';
    job.message = 'دمج الصوت...';
    job.progress = 25;
    const concatListPath = path.join(workDir, 'audio-list.txt');
    fs.writeFileSync(concatListPath, audioFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
    const mergedAudio = path.join(workDir, 'merged-audio.m4a');
    await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatListPath, '-c:a', 'aac', '-b:a', '192k', mergedAudio]);

    // Pick backgrounds
    job.message = 'اختيار خلفيات مناسبة لكل آية...';
    job.progress = 30;
    let bgUrls: string[] = [];
    try {
      if (process.env.PEXELS_API_KEY) {
        const picks = await searchMultipleBackgrounds(segments.map((s) => s.bgQuery));
        bgUrls = picks.map((p) => p?.videoFile).filter(Boolean) as string[];
      }
    } catch { /* fall back below */ }
    if (bgUrls.length < segments.length) {
      while (bgUrls.length < segments.length) bgUrls.push(opts.backgroundVideoUrl);
    }

    // Download backgrounds
    job.message = 'تحميل الخلفيات...';
    job.progress = 35;
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

    // Build background track
    job.message = 'تركيب الخلفيات والانتقالات...';
    job.progress = 45;
    const bgTrack = await buildBackgroundTrack(segments, bgFiles, workDir);

    // ── Generate text overlay PNGs ──
    job.message = 'توليد النصوص والزخارف (SVG → PNG)...';
    job.progress = 55;
    const { textPaths } = await buildTextOverlays(segments, workDir, 1080, 1920, showTranslation);

    // ── Final FFmpeg compose: overlay PNGs with cinematic grading ──
    job.message = 'تركيب الفيديو والتأثيرات السينمائية... (هذا يستغرق وقتاً)';
    job.progress = 65;
    const mainClip = path.join(workDir, 'main.mp4');

    const inputsArgs: string[] = ['-y', '-i', bgTrack, '-i', mergedAudio];
    for (let i = 0; i < segments.length; i++) {
      inputsArgs.push('-loop', '1', '-t', String(totalAudioDuration), '-i', textPaths[i]);
    }

    // Build filter_complex
    let fc = '';

    // Cinematic grading on background
    fc += `[0:v]eq=contrast=1.05:saturation=1.1:brightness=0.01,vignette=PI/4,format=yuv420p[bg_graded];\n`;

    // ── Generate watermark PNG ──
    const wmPath = path.join(workDir, 'watermark.png');
    let wmPng: Buffer;
    try {
      const logoBuffer = fs.readFileSync(path.resolve('logo', 'image.webp'));
      const logoResized = await sharp(logoBuffer).resize(40, 40).png().toBuffer();
      const logoBase64 = logoResized.toString('base64');
      // Layout: [text on left] [logo on right]  — total ~280px wide, 50px tall
      const wmSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="50">
        <defs>
          <filter id="wmshadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="#000" flood-opacity="0.7"/>
          </filter>
        </defs>
        <g filter="url(#wmshadow)">
          <image x="235" y="5" width="40" height="40" href="data:image/png;base64,${logoBase64}" />
          <text x="225" y="32" text-anchor="end" fill="rgba(255,255,255,0.9)" font-family="Arial" font-size="16" font-weight="bold">موقع نور الاسلام</text>
        </g>
      </svg>`;
      wmPng = await sharp(Buffer.from(wmSvg)).png().toBuffer();
    } catch (e) {
      // Fallback if logo not found
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50">
        <text x="190" y="32" text-anchor="end" fill="rgba(255,255,255,0.9)" font-family="Arial" font-size="16" font-weight="bold">موقع نور الاسلام</text>
      </svg>`;
      wmPng = await sharp(Buffer.from(fallbackSvg)).png().toBuffer();
    }
    fs.writeFileSync(wmPath, wmPng);

    // Add watermark as an extra input
    inputsArgs.push('-loop', '1', '-t', String(totalAudioDuration), '-i', wmPath);
    const wmIdx = 2 + segments.length; // index of the watermark input

    // Overlay text PNGs with crossfade
    let lastV = 'bg_graded';
    for (let i = 0; i < segments.length; i++) {
      const tIdx = 2 + i; // text inputs start after [0:v] and [1:a]
      const dur = segments[i].end - segments[i].start;
      const fadeDur = Math.min(0.25, dur / 3);
      const st = segments[i].start.toFixed(3);
      const endT = segments[i].end.toFixed(3);
      const outSt = (segments[i].end - fadeDur).toFixed(3);
      const fd = fadeDur.toFixed(3);

      fc += `[${tIdx}:v]format=yuva420p,fade=t=in:st=${st}:d=${fd}:alpha=1,fade=t=out:st=${outSt}:d=${fd}:alpha=1[tf${i}];\n`;

      const outLabel = `[to${i}]`;
      fc += `[${lastV}][tf${i}]overlay=x=0:y=0:format=auto:enable='between(t,${st},${endT})'${outLabel};\n`;
      lastV = `to${i}`;
    }

    // Watermark overlay — switching position with fades
    const midTime = totalAudioDuration / 2;
    
    // 1. Top Right Watermark (First Half)
    const wm1FadeOut = (midTime - 1).toFixed(3);
    fc += `[${wmIdx}:v]format=yuva420p,fade=t=in:st=0:d=1:alpha=1,fade=t=out:st=${wm1FadeOut}:d=1:alpha=1[wm1];\n`;
    fc += `[${lastV}][wm1]overlay=W-w-40:40:format=auto[vwithwm1];\n`;

    // 2. Bottom Left Watermark (Second Half)
    const wm2FadeIn = midTime.toFixed(3);
    const wm2FadeOut = Math.max(midTime, totalAudioDuration - 1.5).toFixed(3);
    fc += `[${wmIdx}:v]format=yuva420p,fade=t=in:st=${wm2FadeIn}:d=1:alpha=1,fade=t=out:st=${wm2FadeOut}:d=1.5:alpha=1[wm2];\n`;
    fc += `[vwithwm1][wm2]overlay=40:H-h-40:format=auto[vfinal];\n`;

    // Remove trailing semicolon and newline
    fc = fc.replace(/;\n$/, '\n');
    
    // Save filter_complex to a script file to avoid Windows command line length limit (Error 4294967274)
    const fcScriptPath = path.join(workDir, 'filter.txt');
    fs.writeFileSync(fcScriptPath, fc, 'utf8');

    inputsArgs.push(
      '-filter_complex_script', fcScriptPath,
      '-map', `[vfinal]`, '-map', '1:a',
      '-t', String(totalAudioDuration),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
      '-c:a', 'aac', '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      '-shortest',
      mainClip,
    );

    await run(ffmpegPath || 'ffmpeg', inputsArgs);

    // Append outro
    job.message = 'إضافة الخاتمة...';
    job.progress = 85;
    const outroPath = getOutroPath(opts.outroId);
    if (!outroPath) throw new Error('الخاتمة المحددة غير موجودة');

    // Step 1: Combine outro video (no audio) with scaled dimensions
    const outroNorm = path.join(workDir, 'outro-norm.mp4');
    await run('ffmpeg', [
      '-y', '-i', outroPath,
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
      '-an', // Ensure no audio from the outro
      '-pix_fmt', 'yuv420p',
      outroNorm,
    ]);

    const mainNorm = path.join(workDir, 'main-norm.mp4');
    await run('ffmpeg', ['-y', '-i', mainClip, '-vf', 'fps=30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-c:a', 'aac', '-b:a', '192k', '-pix_fmt', 'yuv420p', mainNorm]);

    const finalConcatList = path.join(workDir, 'final-list.txt');
    fs.writeFileSync(finalConcatList, `file '${mainNorm}'\nfile '${outroNorm}'\n`);
    const outputPath = path.join(GENERATED_DIR, `${job.id}.mp4`);
    await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', finalConcatList, '-c', 'copy', outputPath]);

    job.message = 'تجهيز الجودات المتعددة (2K, 720p, 480p)...';
    job.progress = 90;
    
    const out1080 = outputPath;
    const out2K = path.join(GENERATED_DIR, `${job.id}-2K.mp4`);
    const out720 = path.join(GENERATED_DIR, `${job.id}-720p.mp4`);
    const out480 = path.join(GENERATED_DIR, `${job.id}-480p.mp4`);

    // Generate 2K — lanczos upscale + unsharp sharpening for crystal clarity
    await run('ffmpeg', [
      '-y', '-i', out1080,
      '-vf', 'scale=1440:2560:flags=lanczos,unsharp=5:5:0.8:5:5:0.4',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '15',
      '-c:a', 'copy',
      out2K
    ]);

    // 720p — good balance of quality and size
    await run('ffmpeg', [
      '-y', '-i', out1080,
      '-vf', 'scale=720:1280:flags=lanczos',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
      '-c:a', 'copy',
      out720
    ]);
    
    // 480p — lightweight for sharing
    await run('ffmpeg', [
      '-y', '-i', out1080,
      '-vf', 'scale=480:854:flags=lanczos',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
      '-c:a', 'copy',
      out480
    ]);

    const stat2K = fs.statSync(out2K).size / (1024 * 1024);
    const stat1080 = fs.statSync(out1080).size / (1024 * 1024);
    const stat720 = fs.statSync(out720).size / (1024 * 1024);
    const stat480 = fs.statSync(out480).size / (1024 * 1024);

    job.resultFile = out1080;
    job.outputs = [
      { quality: '2K', path: out2K, sizeMb: Number(stat2K.toFixed(1)) },
      { quality: '1080p', path: out1080, sizeMb: Number(stat1080.toFixed(1)) },
      { quality: '720p', path: out720, sizeMb: Number(stat720.toFixed(1)) },
      { quality: '480p', path: out480, sizeMb: Number(stat480.toFixed(1)) },
    ];

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
