import sharp from 'sharp';
import fs from 'fs';

async function run() {
  const fontBase64 = fs.readFileSync('fontss/QCF2BSMLfonts/QCF2001.ttf').toString('base64');
  
  const svg = `
  <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @font-face {
          font-family: 'QCF2001';
          src: url('data:font/ttf;base64,${fontBase64}');
        }
      </style>
    </defs>
    <rect width="100%" height="100%" fill="black" />
    <text x="540" y="960" font-family="QCF2001" font-size="80" fill="white" text-anchor="middle" direction="rtl">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</text>
  </svg>
  `;
  await sharp(Buffer.from(svg)).toFile('test-qcf2001.png');
  console.log('done QCF2001 SVG');
}
run().catch(console.error);
