/** Threads (sūtras) between nodes. Energy pulses travel away from the focus. */
export const threadVertex = /* glsl */ `
  attribute float aT;
  attribute float aHi;
  attribute float aDir;
  attribute float aConf;
  attribute float aSeed;
  varying float vT;
  varying float vHi;
  varying float vDir;
  varying float vConf;
  varying float vSeed;
  varying float vDepth;

  void main() {
    vT = aT; vHi = aHi; vDir = aDir; vConf = aConf; vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const threadFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uFocus;
  uniform vec3 uGold;
  uniform vec3 uDim;
  varying float vT;
  varying float vHi;
  varying float vDir;
  varying float vConf;
  varying float vSeed;
  varying float vDepth;

  void main() {
    // Inferred relationships are drawn dashed.
    if (vConf > 0.5 && fract(vT * 26.0) > 0.55) discard;
    float t = vDir > 0.5 ? vT : 1.0 - vT;
    float phase = fract(t * 2.0 - uTime * 0.55 + vSeed);
    float pulse = smoothstep(0.82, 1.0, phase) * 1.6;
    float idle = mix(0.16, 0.035, uFocus);
    // A slow ambient pulse keeps unlit threads alive.
    float ambient = smoothstep(0.94, 1.0, fract(vT - uTime * 0.08 + vSeed * 3.0)) * 0.25;
    float a = mix(idle + ambient * (1.0 - uFocus), 0.38 + pulse, vHi);
    a *= smoothstep(160.0, 8.0, vDepth) * uOpacity;
    vec3 col = mix(uDim, uGold * (1.0 + pulse), vHi);
    gl_FragColor = vec4(col, a);
  }
`;

/** Nodes: glowing points that breathe; brightness follows relationship state. */
export const nodeVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aState;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vState;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float breathe = 1.0 + 0.14 * sin(uTime * 1.4 + aSeed * 6.2831);
    gl_PointSize = aSize * breathe * (0.55 + aState * 0.75) * uPixelRatio * (60.0 / max(1.0, -mv.z));
    vColor = aColor;
    vState = aState;
  }
`;

export const nodeFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vState;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d2 = dot(c, c);
    float core = exp(-d2 * 90.0);
    float halo = exp(-d2 * 14.0) * 0.45;
    float ring = smoothstep(0.012, 0.0, abs(sqrt(d2) - 0.32)) * 0.35 * vState;
    float a = (core + halo + ring) * (0.2 + vState * 0.8) * smoothstep(0.0, 0.08, vState) * uOpacity;
    if (a < 0.01) discard;
    vec3 col = mix(vColor, vec3(1.0), core * 0.6) * (0.6 + vState * 1.6);
    gl_FragColor = vec4(col, a);
  }
`;
