import * as fontkit from 'fontkit';
import sharp from 'sharp';
import path from 'path';

const FONTS_DIR = path.resolve('fontss/QCF2BSMLfonts');

function renderQCFToSvgPaths(text, font, fontSize, centerX, baselineY, fillColor) {
  const run = font.layout(text);
  const scale = fontSize / font.unitsPerEm;
  let totalAdvance = 0;
  for (let i = 0; i < run.glyphs.length; i++) {
    totalAdvance += run.positions[i].xAdvance;
  }
  const widthPx = totalAdvance * scale;
  let cursorX = centerX + widthPx / 2;
  let paths = '';
  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i];
    const pos = run.positions[i];
    const advancePx = pos.xAdvance * scale;
    cursorX -= advancePx;
    const pathData = glyph.path?.toSVG();
    if (!pathData || pathData.length < 3) continue;
    const tx = cursorX + (pos.xOffset * scale);
    const ty = baselineY - (pos.yOffset * scale);
    paths += `<path d="${pathData}" transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale.toFixed(6)}, ${(-scale).toFixed(6)})" fill="${fillColor}" />\n`;
  }
  return { svg: paths, widthPx };
}

async function test() {
  // Test with chapter 113 (Surah Al-Falaq), page 604
  const codeV2 = 'ﱤ ﱥ ﱦ ﱧ ﱨ ﱩ';  // 113:4
  const font = fontkit.openSync(path.join(FONTS_DIR, 'QCF2604.ttf'));
  
  const width = 1080;
  const height = 1920;
  const fontSize = 80;
  const centerX = width / 2;
  const baselineY = height / 2;

  const { svg: pathsSvg, widthPx } = renderQCFToSvgPaths(codeV2, font, fontSize, centerX, baselineY, 'white');
  console.log(`Rendered width: ${widthPx}px`);

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F5E6C8" />
        <stop offset="50%" stop-color="#FFFFFF" />
        <stop offset="100%" stop-color="#F5E6C8" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="#111" />
    <g>${pathsSvg}</g>
    <text x="${centerX}" y="${baselineY + 120}" font-family="'Segoe UI', sans-serif" font-size="28" fill="#D4D4D4" text-anchor="middle" font-style="italic">
      And from the evil of the blowers in knots
    </text>
    <text x="${centerX}" y="${baselineY + 180}" font-family="'Segoe UI', sans-serif" font-size="22" fill="#999" text-anchor="middle">
      سورة الفلق · الآية ٤
    </text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile('test-fontkit-render.png');
  console.log('Saved test-fontkit-render.png — check it!');
}

test().catch(console.error);
