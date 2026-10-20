import { portraitCanvas } from "./targets";

let cached: Promise<HTMLCanvasElement> | null = null;

/** One portrait source, shared by the point cloud and the hologram plane. */
export function getPortraitCanvas(src: string | null) {
  cached ??= portraitCanvas(src);
  return cached;
}

let heroCached: Promise<HTMLCanvasElement | null> | null = null;

/**
 * Her photograph prepared for the landing: a head-and-shoulders crop with a
 * soft silhouette mask (the graphics around her in the source fall away) and
 * the pink rim light of the original shoot neutralised, so the landing's own
 * fire and ice light her instead. Real photo pixels only — nothing generated.
 */
export function getHeroPortrait(src: string | null) {
  heroCached ??= (async () => {
    if (!src) return null;
    const img = new Image();
    img.src = src;
    await img.decode();
    const S = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    const side = Math.min(img.width, img.height) * 0.84;
    ctx.drawImage(img, img.width * 0.12, 0, side, side, 0, 0, S, S);
    const d = ctx.getImageData(0, 0, S, S);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const u = ((i / 4) % S) / S, v = Math.floor(i / 4 / S) / S;
      // Soft union of head-and-hair and shoulders.
      const blob = (cx: number, cy: number, rx: number, ry: number, k: number) => Math.max(0, Math.min(1, (1 - Math.hypot((u - cx) / rx, (v - cy) / ry)) * k));
      const mask = Math.max(blob(0.6, 0.4, 0.3, 0.42, 5), blob(0.55, 1.02, 0.55, 0.5, 4));
      let r = px[i], g = px[i + 1], b = px[i + 2];
      // Neutralise magenta casts (the studio's pink rim light and backdrop).
      const magenta = Math.max(0, Math.min(1, ((Math.min(r, b) - g) / 255) * 3.5));
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r += (lum * 1.02 - r) * magenta;
      g += (lum * 0.98 - g) * magenta;
      b += (lum * 0.95 - b) * magenta;
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = Math.round(mask * 255);
    }
    ctx.putImageData(d, 0, 0);
    return c;
  })();
  return heroCached;
}
