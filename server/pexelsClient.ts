// Server-side proxy for Pexels Video Search — keeps the API key off the client.
const PEXELS_API = 'https://api.pexels.com/videos/search';

export interface PexelsVideoResult {
  id: number;
  image: string;
  duration: number;
  url: string; // page url
  videoFile: string; // best-quality mp4 file url we picked
  width: number;
  height: number;
}

export async function searchBackgroundVideos(query: string, perPage = 15, page = 1): Promise<PexelsVideoResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error('PEXELS_API_KEY is not configured');

  // Randomize the page number to avoid getting the exact same videos for repetitive queries
  // Limit to 3 pages to ensure high quality results while maintaining some variety.
  const fetchPage = page === 1 ? Math.floor(Math.random() * 3) + 1 : page;

  const url = `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${fetchPage}&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) throw new Error(`Pexels API error ${res.status}`);
  const json: any = await res.json();

  return (json.videos || []).map((v: any) => {
    // Prefer an HD portrait file; fall back to the largest available file.
    const files = (v.video_files || []).slice().sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
    const hd = files.find((f: any) => f.height >= 720 && f.height <= 1920) || files[0];
    return {
      id: v.id,
      image: v.image,
      duration: v.duration,
      url: v.url,
      videoFile: hd?.link,
      width: hd?.width,
      height: hd?.height,
    } as PexelsVideoResult;
  }).filter((v: PexelsVideoResult) => !!v.videoFile);
}

/**
 * Fetch one distinct, high-quality background video per query. Used to give
 * each ayah/segment of a reel its own beautiful, matching background instead
 * of reusing a single clip for the whole video.
 */
export async function searchMultipleBackgrounds(queries: string[]): Promise<PexelsVideoResult[]> {
  const usedIds = new Set<number>();
  const results: PexelsVideoResult[] = [];

  for (const query of queries) {
    try {
      const videos = await searchBackgroundVideos(query, 10, 1);
      const fresh = videos.filter((v) => !usedIds.has(v.id));
      const pool = fresh.length > 0 ? fresh : videos;
      if (pool.length === 0) {
        results.push(results[results.length - 1] || null as any);
        continue;
      }
      const pick = pool[Math.floor(Math.random() * Math.min(4, pool.length))];
      usedIds.add(pick.id);
      results.push(pick);
    } catch {
      results.push(results[results.length - 1] || null as any);
    }
  }

  return results.filter(Boolean);
}
