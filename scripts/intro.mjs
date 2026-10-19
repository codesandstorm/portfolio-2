/**
 * Film the opening: screenshots at fixed moments of a first visit.
 *   node scripts/intro.mjs [baseUrl] [outDir] [--width=1440] [--height=900]
 */
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const flag = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) ?? `=${d}`).split("=")[1];
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const out = args.find((a) => !a.startsWith("http") && !a.startsWith("--")) ?? "qa-out";
const width = Number(flag("width", 1440));
const height = Number(flag("height", 900));
const moments = flag("at", "0.6,1.8,3,4.4,5.6,6.6,7.05,7.4,8,9,10.5").split(",").map(Number);
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
await page.goto(base, { waitUntil: "domcontentloaded" });
// Clock starts when the intro timeline starts moving.
await page.waitForFunction(() => document.querySelector("#signal-title") && window.performance.now() > 0, { timeout: 20000 });
const t0 = Date.now();
for (const s of moments) {
  const wait = s * 1000 - (Date.now() - t0);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  await page.screenshot({ path: `${out}/intro-${width}-${String(s).replace(".", "_")}.jpg`, type: "jpeg", quality: 72 });
}
console.log(errors.length ? `errors:\n${errors.join("\n")}` : "errors: 0");
await browser.close();
