/**
 * Geometry of the Fire × Ice opening. The hero plays on a plane 22 units in
 * front of the intro camera; these helpers map between that plane and CSS
 * pixels so particles can land exactly on the DOM <h1>.
 */
export const HERO_Z = 24;
export const INTRO_CAM_Z = 46;

export type HeroFrame = {
  tall: boolean;
  hw: number;
  hh: number;
  /** Characteristic size of each energy system. */
  s: number;
  fire: [number, number];
  ice: [number, number];
};

export function heroFrame(width: number, height: number): HeroFrame {
  const aspect = width / height;
  const tall = aspect < 0.9;
  const fov = tall ? 62 : 50;
  const hh = (INTRO_CAM_Z - HERO_Z) * Math.tan((fov * Math.PI) / 360);
  const hw = hh * aspect;
  const s = Math.min(hw, hh);
  // Fire on the left (top on phones), ice on the right (bottom on phones).
  return tall
    ? { tall, hw, hh, s, fire: [0, hh * 0.56], ice: [0, -hh * 0.56] }
    : { tall, hw, hh, s, fire: [-hw * 0.6, -hh * 0.04], ice: [hw * 0.6, hh * 0.04] };
}

/** CSS px → hero plane. */
export function pxToHero(x: number, y: number, width: number, height: number, f: HeroFrame): [number, number] {
  return [(x / width - 0.5) * 2 * f.hw, -(y / height - 0.5) * 2 * f.hh];
}
