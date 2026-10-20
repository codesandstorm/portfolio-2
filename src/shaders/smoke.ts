/**
 * Cosmic fire-and-ice smoke for the landing. Domain-warped noise gives slow,
 * folding smoke; ridged noise gives fine luminous filaments (the "rays"); an
 * elliptical vortex makes it swirl around her. Ice on the left, fire on the
 * right, meeting behind her. Everything moves slowly — seconds per fold.
 * `uLayer` 0 is the deep layer behind her, 1 the thin wisps in front.
 */
export const smokeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9998, 1.0);
  }
`;

export const smokeFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  uniform float uAmount;
  uniform float uLayer;
  uniform float uFlash;
  uniform vec2 uPointer;
  uniform vec2 uCenter;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
    return v;
  }
  float ridged(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) { float n = 1.0 - abs(noise(p) * 2.0 - 1.0); v += a * n * n; p = m * p; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 c = uCenter;
    vec2 d = (uv - c) * vec2(uAspect, 1.0);
    float r = length(d);
    float t = uTime * (uLayer > 0.5 ? 0.055 : 0.035);

    // A slow vortex: points turn around her, more the closer they are.
    float swirl = 0.9 / (0.35 + r * 2.2) + t * 0.6;
    float cs = cos(swirl), sn = sin(swirl);
    vec2 p = mat2(cs, -sn, sn, cs) * d * 2.2 + uPointer * 0.06;

    // Domain warping: smoke folding over itself.
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
    vec2 w = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.7), fbm(p + 3.5 * q + vec2(8.3, 2.8) - t * 0.5));
    float smoke = fbm(p + 3.0 * w);
    // Fine filaments riding the same flow: the cosmic rays.
    float rays = pow(ridged(p * 1.6 + 2.5 * w + t), 3.0);

    // Swirling arcs around her (an ellipse of smoke), broken up by the flow.
    float ring = exp(-pow((length(d * vec2(0.85, 1.25)) - 0.46) / 0.12, 2.0)) * smoothstep(0.25, 0.75, fbm(p * 0.8 + w));

    // Ice on the left, fire on the right; the seam wanders with the smoke.
    float side = smoothstep(-0.18, 0.18, d.x + (w.x - 0.5) * 0.35);
    vec3 ice = mix(vec3(0.05, 0.16, 0.36), vec3(0.45, 0.72, 1.0), rays);
    vec3 fire = mix(vec3(0.36, 0.09, 0.015), vec3(1.0, 0.55, 0.16), rays);
    vec3 tint = mix(ice, fire, side);

    float density = smoothstep(0.38, 0.95, smoke) * 0.75 + ring * 0.55;
    // Keep her face clear: the smoke thins in a soft oval around it.
    float face = smoothstep(0.1, 0.32, length((uv - vec2(c.x, 0.66)) * vec2(uAspect * 0.9, 1.0)));
    density *= mix(1.0, face, uLayer > 0.5 ? 1.0 : 0.55);
    // Darker towards the far edges so the frame stays cinematic.
    density *= smoothstep(1.35, 0.25, r);

    float layer = uLayer > 0.5 ? 0.45 : 1.0;
    vec3 col = tint * density * 0.32 + tint * rays * density * 0.9;
    // Lightning from the title briefly lights the smoke from within.
    col += vec3(0.55, 0.7, 1.0) * uFlash * density * 0.6;
    col *= uAmount * layer;
    float alpha = clamp(density * uAmount * layer * 1.2, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;
