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

  const url = `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=portrait`;
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
