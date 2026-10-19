import { portraitCanvas } from "./targets";

let cached: Promise<HTMLCanvasElement> | null = null;

/** One portrait source, shared by the point cloud and the hologram plane. */
export function getPortraitCanvas(src: string | null) {
  cached ??= portraitCanvas(src);
  return cached;
}
