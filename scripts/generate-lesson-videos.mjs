import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";
import { courses } from "../src/courses.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const escape = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const fontFolder = path.join(
  root,
  "node_modules/@fontsource-variable/noto-sans-arabic/files",
);
const fontFile = (await fs.readdir(fontFolder)).find(
  (n) => n.includes("arabic-wght-normal") && n.endsWith(".woff2"),
);
const font = await fs.readFile(path.join(fontFolder, fontFile));
await fs.mkdir(path.join(root, "public/lessons"), { recursive: true });
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await b.newPage({ viewport: { width: 1280, height: 720 } });
for (const c of courses.filter((c) => c.video)) {
  const slides = [
    `<h1>${escape(c.title.en)}</h1><h2 dir="rtl">${escape(c.title.ar)}</h2><div class="formula">${escape(c.rule)}</div>`,
    `<h2>The idea / الفكرة</h2><p>${escape(c.explanation.en)}</p><p dir="rtl" class="arabic">${escape(c.explanation.ar)}</p>`,
    `<h2>Say it in context / أمثلة</h2>${c.examples.map((ex) => `<div class="example">${escape(ex)}</div>`).join("")}`,
    `<h2>A small correction / تصحيح مهم</h2><div class="wrong">${escape(c.mistake[0])}</div><div class="correct">${escape(c.mistake[1])}</div><p dir="rtl" class="arabic">جرّب الآن: اكتب جملة من عندك، ثم افتح تدريب الدرس.</p><p>Try it: write your own sentence, then take the lesson quiz.</p>`,
  ];
  const frames = [];
  for (const [i, slide] of slides.entries()) {
    const html = `<!doctype html><meta charset="UTF-8"><style>@font-face{font-family:Arabic;src:url(data:font/woff2;base64,${font.toString("base64")})}*{box-sizing:border-box}body{margin:0;padding:55px 75px;background:#174d40;color:#f0f4e5;font-family:Arial,Arabic,sans-serif;height:720px}.brand{font-size:20px;letter-spacing:3px;color:#c8d9a5;border-bottom:1px solid #577d66;padding-bottom:20px;margin-bottom:32px}h1{font-size:60px;margin:10px 0}h2{font-size:30px;line-height:1.5;margin:12px 0 24px}p{font-size:25px;line-height:1.6;margin:18px 0}.arabic{font-family:Arabic;font-size:23px;line-height:1.9}.formula{font-size:28px;background:#294f3f;color:#d8e5bc;padding:25px;margin-top:40px;border-radius:10px}.example{font-size:32px;padding:23px 0;border-bottom:1px solid #56785d}.wrong{text-decoration:line-through;color:#efb49c;font-size:34px;margin:40px 0 22px}.correct{font-size:38px;color:#cce6b2}.footer{position:absolute;bottom:26px;left:75px;right:75px;display:flex;justify-content:space-between;font-size:16px;color:#c1d1b6}</style><div class="brand">TALAQA / طلاقة</div>${slide}<div class="footer"><span>Original visual lesson • Silent video / شرح مرئي بدون صوت</span><span>${i + 1} / 4</span></div>`;
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(root, `.impeccable/video-source/${c.id}-${i}.png`);
    await page.screenshot({ path: file });
    frames.push(file);
    if (i === 0)
      await fs.copyFile(
        file,
        path.join(root, `public/lessons/${c.id}-poster.png`),
      );
  }
  const list =
    frames.map((f) => `file '${f}'\nduration 8`).join("\n") +
    `\nfile '${frames.at(-1)}'\n`;
  const manifest = path.join(root, `.impeccable/video-source/${c.id}.txt`);
  await fs.writeFile(manifest, list);
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    manifest,
    "-vf",
    "scale=960:540",
    "-r",
    "24",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "26",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-t",
    "32",
    path.join(root, `public/lessons/${c.id}.mp4`),
  ]);
  console.log(c.id, "32-second original lesson video created");
}
await b.close();
