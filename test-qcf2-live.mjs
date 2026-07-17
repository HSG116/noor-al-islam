import { getAyahCodeV2 } from './server/quranClient.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Copy a bit of buildTextOverlays logic for testing
async function testQCF2() {
  console.log("Fetching QCF2 data for Surah 1, Ayah 1-2...");
  const glyphs = await getAyahCodeV2(1, 1, 2);
  console.log("Got glyphs:", glyphs);

  if (glyphs.length === 0) {
    console.error("No glyphs returned!");
    return;
  }

  const g = glyphs[0]; // Ayah 1
  const codeV2 = g.codeV2;
  const pageNum = g.v2Page;
  console.log(`Page: ${pageNum}, Code: ${codeV2}`);

  const FONTS_DIR = path.resolve('fontss/QCF2BSMLfonts');
  const padded = String(pageNum).padStart(3, '0');
  const fontPath = path.join(FONTS_DIR, `QCF2${padded}.ttf`);
  const fontB64 = fs.readFileSync(fontPath).toString('base64');
  const qcfFontFamily = `QCF2${padded}`;

  const width = 1080;
  const height = 1920;
  const arabicFs = 80;

  const svgStyle = `
    @font-face {
      font-family: '${qcfFontFamily}';
      src: url('data:font/ttf;base64,${fontB64}');
    }
  `;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>${svgStyle}</style>
    </defs>
    <rect width="100%" height="100%" fill="black" />
    <text x="${width/2}" y="${height/2}" font-family="'${qcfFontFamily}'" font-size="${arabicFs}" fill="white" text-anchor="middle" direction="rtl">
      ${codeV2}
    </text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile('test-qcf2-live.png');
  console.log("Saved test-qcf2-live.png");
}

testQCF2().catch(console.error);
