/**
 * Behaviour checks for the opening and its fallbacks.
 *   node scripts/behaviour.mjs [baseUrl]
 */
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);

async function fresh(opts = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  if (opts.reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base + (opts.query ?? ""), { waitUntil: "domcontentloaded" });
  return { ctx, page, errors };
}
const nameOpacity = (page) => page.$eval("#signal-title", (el) => Number(getComputedStyle(el).opacity));
const navVisible = (page) => page.$eval('a[aria-label^="Akshita Mahajan"]', (el) => getComputedStyle(el).visibility === "visible");
const scrollTo = (page, y) => page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y)), y);

{
  const { ctx, page, errors } = await fresh();
  await sleep(1500);
  await page.click('button[aria-label="Turn sound on"]');
  await sleep(11000);
  check("sound on: full intro without errors", errors.length === 0, errors[0]);
  check("intro resolves the name", (await nameOpacity(page)) > 0.95);
  check("navigation revealed after intro", await navVisible(page));
  await ctx.close();
}
{
  const { ctx, page, errors } = await fresh();
  await sleep(1800);
  check("nav hidden during intro", !(await navVisible(page)));
  const covered = await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent === "Skip intro"); const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); b.click(); return !b.contains(top) && top ? top.tagName : ""; });
  if (covered) console.log("note: skip button covered by", covered, "(dev overlay)");
  await sleep(1800);
  check("skip intro: name present", (await nameOpacity(page)) > 0.95);
  check("skip intro: nav revealed", await navVisible(page));
  check("skip intro: no errors", errors.length === 0, errors[0]);
  await ctx.close();
}
{
  const { ctx, page } = await fresh();
  await sleep(2000);
  await scrollTo(page, 400);
  await sleep(1500);
  const done = await page.evaluate(() => document.querySelector('a[aria-label^="Akshita Mahajan"]') && getComputedStyle(document.querySelector('a[aria-label^="Akshita Mahajan"]')).visibility === "visible");
  check("scroll during intro completes it (never traps)", done);
  await scrollTo(page, 2600);
  await sleep(1500);
  const away = await nameOpacity(page);
  await scrollTo(page, 0);
  await sleep(2500);
  const back = await nameOpacity(page);
  check("scroll forward fades the name, back restores it", away < 0.1 && back > 0.95, `away ${away.toFixed(2)} back ${back.toFixed(2)}`);
  // Repeat visit in the same context: shorter intro.
  const t0 = Date.now();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('a[aria-label^="Akshita Mahajan"]')).visibility === "visible", { timeout: 20000 });
  const secs = (Date.now() - t0) / 1000;
  check("repeat visit plays a shorter intro", secs < 8, `${secs.toFixed(1)}s to settle`);
  await ctx.close();
}
{
  const { ctx, page, errors } = await fresh({ reduced: true });
  await sleep(2500);
  const tier = await page.evaluate(() => document.documentElement.dataset.tier);
  const canvas = await page.$("canvas");
  check("reduced motion → static tier without canvas", tier === "static" && !canvas, `tier ${tier}`);
  check("reduced motion: name immediately visible", (await nameOpacity(page)) > 0.95);
  const sections = await page.$$eval("section[data-chapter]", (s) => s.length);
  check("reduced motion: all chapters present", sections === 10);
  check("reduced motion: no errors", errors.length === 0, errors[0]);
  // Keyboard: tab through the first stops and make sure each is visible and named.
  const stops = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        const r = el.getBoundingClientRect();
        return { name: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40), visible: r.width > 0 && getComputedStyle(el).visibility !== "hidden" };
      }),
    );
  }
  check("keyboard: first 14 tab stops visible and named", stops.every((s) => s.visible && s.name), stops.map((s) => s.name).join(" | "));
  await ctx.close();
}
{
  // The last thread: drag from "You" to her name; the keyboard path does the same.
  const { ctx, page, errors } = await fresh();
  await sleep(1500);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "Skip intro")?.click());
  await page.evaluate(() => {
    const el = document.getElementById("continue");
    const top = el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * 0.6;
    if (window.__lenis) window.__lenis.scrollTo(top, { immediate: true });
    else window.scrollTo(0, top);
  });
  await sleep(2500);
  const shots = process.env.SHOTS;
  if (shots) await page.screenshot({ path: shots + "/thread-before.jpg", type: "jpeg", quality: 72 });
  const handle = await page.$('button[aria-label^="Draw the last thread"]');
  const box = await handle.boundingBox();
  const start = { x: box.x + 10, y: box.y + box.height / 2 };
  const target = await page.evaluate(() => {
    const c = document.querySelector("#continue svg circle");
    return { x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")) };
  });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(start.x + ((target.x - start.x) * k) / 12, start.y + ((target.y - start.y) * k) / 12);
  if (shots) await page.screenshot({ path: shots + "/thread-drag.jpg", type: "jpeg", quality: 72 });
  await page.mouse.up();
  await sleep(1600);
  if (shots) await page.screenshot({ path: shots + "/thread-after.jpg", type: "jpeg", quality: 72 });
  const linked = await page.evaluate(() => document.querySelector("#continue")?.textContent?.includes("Your thread reached her"));
  check("last thread: dragging to her name connects", !!linked, `target ${Math.round(target.x)},${Math.round(target.y)}`);
  await page.reload({ waitUntil: "domcontentloaded" });
  await sleep(2500);
  const remembered = await page.evaluate(() => document.querySelector("#continue")?.textContent?.includes("Your thread reached her"));
  check("last thread: remembered on return", !!remembered);
  await page.evaluate(() => localStorage.removeItem("sutra-last-thread"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await sleep(1500);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent === "Skip intro")?.click());
  await page.focus('button[aria-label^="Draw the last thread"]');
  await page.keyboard.press("Enter");
  await sleep(500);
  const viaKeys = await page.evaluate(() => document.querySelector("#continue")?.textContent?.includes("Your thread reached her"));
  check("last thread: Enter completes it", !!viaKeys);
  check("last thread: no errors", errors.length === 0, errors[0]);
  await ctx.close();
}
await browser.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
