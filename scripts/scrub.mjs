/**
 * Screenshot exact scroll positions (useful for scroll-scrubbed moments).
 *   node scripts/scrub.mjs [baseUrl] [outDir] --at=akshita:0.7,akshita:0.95,connect:0 [--width=1440 --height=900]
 * A fraction is of the chapter's pinned range; values above 1 run into the hand-over.
 */
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const flag = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) ?? `=${d}`).split("=")[1];
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const out = args.find((a) => !a.startsWith("http") && !a.startsWith("--")) ?? "qa-out";
const width = Number(flag("width", 1440));
const height = Number(flag("height", 900));
const shots = flag("at", "akshita:0.5").split(",").map((s) => s.split(":"));
mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
const mobile = width < 768;
await page.setViewport({ width, height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(base, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 3000));
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "Skip intro")?.click());
for (const [id, f] of shots) {
  await page.evaluate((id, f) => {
    const el = document.getElementById(id);
    const top = el.getBoundingClientRect().top + scrollY + Math.max(0, el.offsetHeight - innerHeight) * Number(f);
    window.__lenis ? window.__lenis.scrollTo(top, { immediate: true }) : window.scrollTo(0, top);
  }, id, f);
  await new Promise((r) => setTimeout(r, 1600));
  await page.screenshot({ path: `${out}/scrub-${width}-${id}-${f}.jpg`, type: "jpeg", quality: 72 });
}
console.log(errors.length ? `errors:\n${errors.join("\n")}` : "errors: 0");
await browser.close();
