/**
 * Ask the constellation, end to end: suggestion → spoken answer → the world moves.
 *   node scripts/ask.mjs [baseUrl] [outDir]
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
const speakCalls = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("response", async (r) => {
  if (r.url().endsWith("/api/speak")) speakCalls.push({ status: r.status(), type: r.headers()["content-type"], bytes: (await r.buffer().catch(() => Buffer.alloc(0))).length });
});
await page.evaluateOnNewDocument(() => {
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) {
    window.__askAudio = this;
    return play.apply(this, a);
  };
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);

await page.goto(base, { waitUntil: "networkidle0" });
await sleep(1500);
await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "Skip intro")?.click());
await sleep(1500);
await page.click('button[aria-label="Ask the constellation a question"]');
await sleep(600);
const disclosed = await page.evaluate(() => document.querySelector('[aria-label="Ask the constellation"]')?.textContent?.includes("AI-generated, not hers"));
check("ask: AI disclosure visible", !!disclosed);
await page.click("button::-p-text(Where has she used React?)");
await sleep(4000);
const s = await page.evaluate(() => ({
  answer: document.querySelector('[aria-label="Ask the constellation"]')?.textContent ?? "",
  chapter: document.querySelector('nav[aria-label="Chapters"] [aria-current="step"]')?.textContent?.trim(),
  panel: document.querySelector('aside[aria-label^="Connections of"]')?.getAttribute("aria-label"),
  playing: window.__askAudio ? !window.__askAudio.paused || window.__askAudio.currentTime > 0 : false,
}));
if (out) await page.screenshot({ path: `${out}/ask-react.jpg`, type: "jpeg", quality: 72 });
check("ask: grounded answer shown", s.answer.includes("Enterprise HRMS") && s.answer.includes("FoodHub"));
const dur = await page.evaluate(() => window.__askAudio?.duration ?? 0);
check("ask: voice returned audio", speakCalls.some((c) => c.status === 200 && c.type?.includes("audio")) && dur > 2, `${dur.toFixed(1)}s of audio`);
check("ask: voice played", s.playing);
check("ask: world travelled to skills and opened React", (s.chapter ?? "").includes("Learn") && s.panel === "Connections of React", `${s.chapter} · ${s.panel}`);

await page.type('input[aria-label="Your question"]', "What is her favourite movie?");
await page.keyboard.press("Enter");
await sleep(2500);
const unknown = await page.evaluate(() => document.querySelector('[aria-label="Ask the constellation"]')?.textContent?.includes("I only answer from what's verified"));
check("ask: admits what it doesn't know", !!unknown);
if (out) await page.screenshot({ path: `${out}/ask-unknown.jpg`, type: "jpeg", quality: 72 });
check("ask: no console errors", errors.length === 0, errors[0]);
console.log(results.join("\n"));
await browser.close();
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
