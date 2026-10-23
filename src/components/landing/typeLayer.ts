/**
 * Draws the hero's type onto a 2D canvas exactly where the DOM sets it, so
 * grains can be sampled from it — both for the name forming and for the hero
 * dissolving. Colours match the CSS in landing.css.
 */

/** AKSHITA: warm gold into orange (landing.css .ttl). */
export const NAME_STOPS: [number, string][] = [
  [0, "#fff1d6"],
  [0.38, "#f7c983"],
  [0.72, "#ec9a4c"],
  [1, "#cf7433"],
];
/** MAHAJAN: champagne gold (landing.css .ttl-line2). */
export const SURNAME_STOPS: [number, string][] = [
  [0, "#fff7e6"],
  [0.52, "#dfbe88"],
  [1, "#c29653"],
];

export function drawText(ctx: CanvasRenderingContext2D, el: HTMLElement, text: string, fill: string | CanvasGradient, rect = el.getBoundingClientRect()) {
  const cs = getComputedStyle(el);
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  ctx.fillStyle = fill;
  const m = ctx.measureText(text);
  // Same baseline the browser uses for a one-line box: centre the font's ascent+descent in the line.
  const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize);
  const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
  const baseline = rect.top + (Math.min(rect.height, lineH) - (asc + desc)) / 2 + asc;
  return { m, baseline };
}

/** Paints each letter span (`.ttl`) matching `selector` in its gradient. The context must already be translated to the host's origin. */
export function drawLetters(ctx: CanvasRenderingContext2D, host: HTMLElement, selector = ".ttl") {
  host.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    const r = el.getBoundingClientRect();
    const stops = el.classList.contains("ttl-line2") ? SURNAME_STOPS : NAME_STOPS;
    const g = ctx.createLinearGradient(0, r.top, 0, r.bottom);
    for (const [at, c] of stops) g.addColorStop(at, c);
    const ch = el.firstChild?.textContent ?? "";
    const { baseline } = drawText(ctx, el, ch, g, r);
    // Each letter is its own box and its tracking is space after the glyph, so the ink starts at the box's left edge.
    ctx.letterSpacing = "0px";
    ctx.fillText(ch, r.left, baseline);
  });
}
