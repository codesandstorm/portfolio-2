export type Tier = "high" | "standard" | "mobile" | "static";

export type TierConfig = {
  particles: number;
  dpr: [number, number];
  post: boolean;
  dust: number;
  shards: number;
};

export const tierConfig: Record<Exclude<Tier, "static">, TierConfig> = {
  high: { particles: 7000, dpr: [1, 2], post: true, dust: 1600, shards: 48 },
  standard: { particles: 4500, dpr: [1, 1.5], post: true, dust: 1000, shards: 32 },
  mobile: { particles: 2400, dpr: [1, 1.5], post: false, dust: 500, shards: 16 },
};

function hasWebGL2() {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCoarsePointer() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

/** Decide once, on the client. `?tier=` overrides for testing. */
export function detectTier(): Tier {
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "high" || forced === "standard" || forced === "mobile" || forced === "static") return forced;
  if (prefersReducedMotion() || !hasWebGL2()) return "static";
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (isCoarsePointer() || window.innerWidth < 768) return "mobile";
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 8;
  if (cores >= 8 && mem >= 8 && window.devicePixelRatio <= 2.5) return "high";
  return "standard";
}
