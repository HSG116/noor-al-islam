const { execSync } = require('child_process');
const url = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3';
console.time('ffprobe');
try {
  const dur = execSync(`ffprobe -i "${url}" -show_entries format=duration -v quiet -of csv="p=0"`).toString().trim();
  console.timeEnd('ffprobe');
  console.log('Duration:', dur);
} catch (e) {
  console.error(e.message);
}
