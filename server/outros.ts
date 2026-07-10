import path from 'path';
import fs from 'fs';

export const OUTROS_DIR = path.resolve('server/assets/outros');

export interface OutroMeta {
  id: string;
  file: string;
  label: string;
}

export function listOutros(): OutroMeta[] {
  if (!fs.existsSync(OUTROS_DIR)) return [];
  return fs
    .readdirSync(OUTROS_DIR)
    .filter((f) => f.toLowerCase().endsWith('.mp4'))
    .sort()
    .map((f, i) => ({ id: path.parse(f).name, file: path.join(OUTROS_DIR, f), label: `خاتمة ${i + 1}` }));
}

export function getOutroPath(id: string): string | null {
  const found = listOutros().find((o) => o.id === id);
  return found ? found.file : null;
}
