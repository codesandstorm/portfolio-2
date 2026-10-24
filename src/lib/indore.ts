/**
 * The time in Indore, where she lives. The site's haze follows its sky —
 * dawn rose, daylight, dusk amber, night indigo — and the finale says what
 * time it is there. Values are linear and deliberately dim.
 */
type RGB = [number, number, number];

const KEYS: [number, RGB][] = [
  [0, [0.0025, 0.003, 0.011]], // night: deep indigo
  [5, [0.0035, 0.0028, 0.008]],
  [6.5, [0.0075, 0.0035, 0.0045]], // dawn: rose
  [9, [0.0045, 0.0048, 0.0085]], // day: clear, a touch brighter
  [16.5, [0.0048, 0.0046, 0.0075]],
  [18.5, [0.0085, 0.0045, 0.0025]], // dusk: amber
  [20.5, [0.0035, 0.0032, 0.010]],
  [24, [0.0025, 0.003, 0.011]],
];

let cached: { at: number; hour: number } | null = null;

/** Hour of day in Indore (IST), with minutes as a fraction. Re-read at most once a minute. */
export function indoreHour(): number {
  const now = Date.now();
  if (cached && now - cached.at < 60_000) return cached.hour;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date(now));
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  cached = { at: now, hour: h + m / 60 };
  return cached.hour;
}

export function indoreSky(): RGB {
  const h = indoreHour();
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [h0, a] = KEYS[i];
    const [h1, b] = KEYS[i + 1];
    if (h >= h0 && h <= h1) {
      const t = (h - h0) / (h1 - h0);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
  }
  return KEYS[0][1];
}
