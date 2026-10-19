/**
 * Visual / performance QA against a running server, using the locally
 * installed Chrome with its real GPU.
 *
 *   node scripts/qa.mjs [baseUrl] [outDir] [--widths=1440,390] [--tiers=high,static] [--shots]
 *
 * For each width × tier it visits every chapter, reports FPS, console errors
 * and horizontal overflow, and optionally saves a screenshot per chapter.
 */
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const flag = (name, def) => (args.find((a) => a.startsWith(`--${name}=`)) ?? `=${def}`).split("=")[1];
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const out = args.find((a) => !a.startsWith("http") && !a.startsWith("--")) ?? "qa-out";
const widths = flag("widths", "1440").split(",").map(Number);
const tiers = flag("tiers", "auto").split(",");
const shots = args.includes("--shots");
const chapters = ["signal", "start", "akshita", "connect", "collaborate", "build", "learn", "lead", "converge", "continue"];
const at = { signal: 0, start: 0.5, akshita: 0.55, connect: 0.4, collaborate: 0.9, build: 0.07, learn: 0.4, lead: 0.12, converge: 0.15, continue: 0.6 };

mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
});

const heights = { 320: 640, 360: 740, 375: 812, 390: 844, 430: 932, 768: 1024, 1024: 768, 1440: 900, 1920: 1080 };
let failures = 0;

for (const width of widths) {
  for (const tier of tiers) {
    const page = await browser.newPage();
    const mobile = width < 768;
    await page.setViewport({ width, height: heights[width] ?? 900, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    const q = tier === "auto" ? "" : `?tier=${tier}`;
    await page.goto(`${base}/${q}`, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 3500));
    const info = await page.evaluate(() => ({ tier: document.documentElement.dataset.tier, gpu: (() => { const gl = document.createElement("canvas").getContext("webgl2"); const e = gl?.getExtension("WEBGL_debug_renderer_info"); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : "n/a"; })() }));
    console.log(`\n== ${width}px · tier ${info.tier} · ${info.gpu}`);

    for (const id of chapters) {
      await page.evaluate((id, f) => {
        const el = document.getElementById(id);
        const top = el.getBoundingClientRect().top + scrollY + Math.max(0, el.offsetHeight - innerHeight) * f;
        if (window.__lenis) window.__lenis.scrollTo(top, { immediate: true });
        else window.scrollTo(0, top);
      }, id, at[id]);
      await new Promise((r) => setTimeout(r, 1800));
      const m = await page.evaluate(async () => {
        let n = 0;
        const times = [];
        let last = performance.now();
        const t0 = last;
        await new Promise((res) => {
          const f = (t) => { n++; times.push(t - last); last = t; if (t - t0 < 1500) requestAnimationFrame(f); else res(); };
          requestAnimationFrame(f);
        });
        times.sort((a, b) => a - b);
        return {
          fps: Math.round(n / ((performance.now() - t0) / 1000)),
          p95: Math.round(times[Math.floor(times.length * 0.95)] ?? 0),
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      if (m.overflow > 0) failures++;
      console.log(`${id.padEnd(12)} fps ${String(m.fps).padStart(3)}  p95 ${String(m.p95).padStart(3)}ms  overflowX ${m.overflow}px`);
      if (shots) await page.screenshot({ path: `${out}/${width}-${info.tier}-${id}.jpg`, type: "jpeg", quality: 70 });
    }
    if (errors.length) {
      failures += errors.length;
      console.log("console errors:\n  " + [...new Set(errors)].slice(0, 10).join("\n  "));
    } else console.log("console errors: 0");
    await page.close();
  }
}
await browser.close();
process.exit(failures ? 1 : 0);
