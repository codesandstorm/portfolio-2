/**
 * Play the guided tour with its real narration and check it is in sync.
 *   node scripts/tour-audio.mjs [baseUrl] [outDir]
 */
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3];
if (out) mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
// Keep a handle on the tour's audio element so we can watch it play.
await page.evaluateOnNewDocument(() => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) {
    window.__tourAudio = this;
    return play.apply(this, a);
  };
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await page.goto(base, { waitUntil: "networkidle0" });
await sleep(2000);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.startsWith("or take the guided tour"))?.click());
await sleep(600);
await page.click(process.argv.includes("--recruiter") ? "button::-p-text(Recruiter cut)" : "button::-p-text(Her story)");

const samples = [];
for (let i = 0; i < 26; i++) {
  await sleep(1000);
  samples.push(
    await page.evaluate(() => {
      const a = window.__tourAudio;
      const dock = document.querySelector('[aria-label="Guided tour"]');
      const words = dock ? [...dock.querySelectorAll('p[aria-live] > span[aria-hidden] > span')] : [];
      const lit = words.filter((w) => w.className.includes("text-ivory ") || w.className.endsWith("text-ivory")).length;
      const orb = dock?.querySelector("span.blur-\\[3px\\]")?.style.transform ?? "";
      return {
        src: a?.src?.split("/").pop() ?? null,
        t: a ? Number(a.currentTime.toFixed(2)) : null,
        paused: a ? a.paused : null,
        lit,
        total: words.length,
        counter: dock?.textContent?.match(/\d\d \/ \d\d/)?.[0] ?? null,
        captionsOnly: !!dock?.textContent?.includes("captions only"),
        orb,
        y: Math.round(scrollY),
      };
    }),
  );
  if (out && (i === 6 || i === 20)) await page.screenshot({ path: `${out}/tour-audio-${i}.jpg`, type: "jpeg", quality: 72 });
}
for (const s of samples) console.log(JSON.stringify(s));
console.log(errors.length ? `errors:\n${errors.join("\n")}` : "errors: 0");
await browser.close();
