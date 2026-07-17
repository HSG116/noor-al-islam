import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { SEO_MAP } from '../services/seoConfig.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://noor-al-islam.vercel.app';
const PUBLIC_DIR = resolve(__dirname, '../public');

if (!existsSync(PUBLIC_DIR)) {
  mkdirSync(PUBLIC_DIR, { recursive: true });
}

async function generateSitemap() {
  console.log('Generating sitemap.xml...');
  
  const today = new Date().toISOString().split('T')[0];
  
  let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const key of Object.keys(SEO_MAP)) {
    const page = SEO_MAP[key as keyof typeof SEO_MAP];
    const loc = `${BASE_URL}${page.path}`;
    const priority = page.priority || 0.5;
    const changefreq = page.changefreq || 'weekly';

    sitemapContent += `
  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
  }

  sitemapContent += `
</urlset>`;

  const sitemapPath = resolve(PUBLIC_DIR, 'sitemap.xml');
  writeFileSync(sitemapPath, sitemapContent, 'utf-8');
  console.log('✅ sitemap.xml generated successfully.');
}

async function generateRobots() {
  console.log('Generating robots.txt...');
  
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;

  const robotsPath = resolve(PUBLIC_DIR, 'robots.txt');
  writeFileSync(robotsPath, robotsContent, 'utf-8');
  console.log('✅ robots.txt generated successfully.');
}

async function run() {
  try {
    await generateSitemap();
    await generateRobots();
    console.log('🎉 SEO files generated.');
  } catch (err) {
    console.error('❌ Failed to generate SEO files:', err);
    process.exit(1);
  }
}

run();
