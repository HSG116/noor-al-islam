---
name: Watermarked demo fonts break text pipelines
description: Some user-supplied "free" Arabic/decorative font files are trial/demo versions that substitute a fixed vendor watermark string for any input text instead of rendering it — always test before trusting.
---

Some downloadable font files (seen with Arabic calligraphy fonts) are demo/trial
builds whose glyph substitution tables ignore the actual input text and always
render a fixed vendor watermark phrase instead (e.g. "تم تركيب الخط بواسطة ...").
This is not a shaping/rendering bug — the font itself is doing it via its GSUB
ligature rules, so it happens consistently across renderers (PIL, libass, browsers).

**Why:** Wired such a font directly into an ffmpeg/ASS caption pipeline and every
generated video showed garbled repeated watermark text instead of the intended
Quran ayah, even though the pipeline logic (wrapping, positioning, timing) was
correct. Wasted a full generation+inspection cycle before realizing the font
file itself was the problem.

**How to apply:** Before wiring any new/unfamiliar font file into a production
text-rendering pipeline, do a 30-second smoke test first — render a short known
string with it directly (e.g. via PIL `ImageDraw.text` or a quick browser canvas
test) and visually confirm the output matches the input text. If it doesn't, the
font is unusable regardless of how correct the surrounding pipeline is; fall back
to a verified working font rather than debugging the pipeline.
