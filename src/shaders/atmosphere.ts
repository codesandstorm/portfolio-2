/**
 * Screen-space environment light. Warm and cold fields follow the fire and ice
 * systems, combine at the collision, and settle into a balanced haze.
 */
export const atmosphereVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

export const atmosphereFragment = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uFirePos;
  uniform vec2 uIcePos;
  uniform vec2 uCenter;
  uniform float uFire;
  uniform float uIce;
  uniform float uFlash;
  uniform float uHaze;
  uniform float uTall;
  uniform float uSeam;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  float field(vec2 uv, vec2 c, float r) {
    vec2 d = (uv - c) * vec2(uAspect, 1.0);
    return exp(-dot(d, d) / (r * r));
  }

  void main() {
    vec2 uv = vUv;
    float n = fbm(uv * vec2(3.0 * uAspect, 3.0) + vec2(uTime * 0.015, -uTime * 0.01));
    float wisps = fbm(uv * vec2(6.0 * uAspect, 6.0) - vec2(uTime * 0.03, 0.0));

    // Values are linear: the output pass lifts them, so the void stays very low.
    vec3 col = vec3(0.0016, 0.0016, 0.0042);
    col += vec3(0.0035, 0.004, 0.012) * smoothstep(1.1, 0.1, length((uv - 0.5) * vec2(uAspect, 1.0))) * uHaze;

    float warm = field(uv, uFirePos, 0.34) * uFire * (0.25 + 1.1 * n * n);
    float cold = field(uv, uIcePos, 0.34) * uIce * (0.25 + 1.1 * wisps * wisps);
    col += vec3(0.24, 0.05, 0.007) * warm * 0.3;
    col += vec3(0.012, 0.045, 0.2) * cold * 0.3;

    // The meeting line: a hairline of light where the two sides touch.
    float line = smoothstep(1.5 / 900.0, 0.0, mix(abs(uv.x - uCenter.x), abs(uv.y - uCenter.y), uTall)) * field(uv, uCenter, 0.45);
    col += vec3(0.5, 0.48, 0.6) * line * min(uFire, uIce) * 0.18 * uSeam;

    float flash = field(uv, uCenter, 0.28) * uFlash * uFlash;
    col += vec3(0.42, 0.3, 0.24) * flash * 0.4;

    col += (hash(uv * 900.0 + uTime) - 0.5) * 0.003;
    gl_FragColor = vec4(col, 1.0);
  }
`;
