import { runGenerateJob, createJob } from './server/ffmpegJob.ts';
import fs from 'fs';
import path from 'path';

async function test() {
  const bgPath = 'public/background/IMG_1055.JPG';
  const dummyBg = `http://localhost:5173/background/IMG_1055.JPG`;
  
  const job = createJob();
  
  // start a mock express server to serve the local background file
  const express = (await import('express')).default;
  const app = express();
  app.use(express.static('public'));
  const server = app.listen(5173);

  try {
    await runGenerateJob(job, {
      surahNumber: 1,
      startAyah: 1,
      endAyah: 3,
      reciterEdition: 'ar.alafasy',
      backgroundVideoUrl: dummyBg,
      outroId: 'outro-1'
    });
    console.log("Job finished:", job);
  } catch (err) {
    console.error("Job error:", err);
  } finally {
    server.close();
  }
}
test().catch(console.error);
